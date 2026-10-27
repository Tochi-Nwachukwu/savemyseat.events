"use server";

import { newGuestToken, prisma } from "@savemyseat/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { rsvpConfirmationEmail } from "@/lib/invitation-emails";

const rsvpSchema = z.object({
  token: z.string().min(10).max(64),
  status: z.enum(["ATTENDING", "DECLINED"]),
  name: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function respondToInvite(input: z.input<typeof rsvpSchema>) {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { error: "Something went wrong. Please try again." };
  const { token, status, name, note } = parsed.data;

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { event: { include: { owner: { select: { name: true, email: true } } } } },
  });
  if (!guest) return { error: "We couldn't find this invitation." };
  const { event } = guest;

  if (event.rsvpDeadline && event.rsvpDeadline < new Date() && guest.rsvpStatus !== status)
    return { error: "RSVPs for this event have closed. Reply to your invitation email to reach the host." };

  if (status === "ATTENDING" && guest.rsvpStatus !== "ATTENDING" && event.capacity) {
    const attending = await prisma.guest.count({ where: { eventId: event.id, rsvpStatus: "ATTENDING" } });
    if (attending >= event.capacity) return { error: "Sorry, this event is full." };
  }

  const changed = guest.rsvpStatus !== status;
  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: status,
      respondedAt: new Date(),
      note: note || null,
      ...(name && !guest.name ? { name } : {}),
      ...(guest.inviteStatus !== "OPENED" ? { inviteStatus: "OPENED" } : {}),
    },
  });

  if (changed) {
    await sendEmail(rsvpConfirmationEmail(event, updated, event.owner, status === "ATTENDING")).catch((err) =>
      console.error("RSVP confirmation email failed", err),
    );
  }

  revalidatePath(`/i/${token}`);
  revalidatePath(`/dashboard/${event.id}`);
  return { ok: true as const };
}

const MAX_GUESTS_PER_EVENT = 2000;

const linkRsvpSchema = z.object({
  slug: z.string().min(1).max(60),
  status: z.enum(["ATTENDING", "DECLINED"]),
  name: z.string().trim().min(1, "Please add your name.").max(80),
  email: z.email("Please enter a valid email.").trim().toLowerCase().max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^[+()\d\s.-]{7,}$/.test(v), "Please enter a valid phone number.")
    .optional(),
  note: z.string().trim().max(500).optional(),
  /** Honeypot: hidden from people, filled in by bots. */
  website: z.string().optional(),
});

/** RSVP from the public event page, for people the host didn't email. */
export async function respondViaLink(input: z.input<typeof linkRsvpSchema>) {
  const parsed = linkRsvpSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { slug, status, name, email, phone, note, website } = parsed.data;
  if (website) return { ok: true as const }; // quietly drop bot submissions

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!event || !event.openRsvp) return { error: "RSVPs for this event aren't open." };
  if (event.rsvpDeadline && event.rsvpDeadline < new Date())
    return { error: "RSVPs for this event have closed." };

  const existing = await prisma.guest.findUnique({ where: { eventId_email: { eventId: event.id, email } } });

  if (status === "ATTENDING" && existing?.rsvpStatus !== "ATTENDING" && event.capacity) {
    const attending = await prisma.guest.count({ where: { eventId: event.id, rsvpStatus: "ATTENDING" } });
    if (attending >= event.capacity) return { error: "Sorry, this event is full." };
  }
  if (!existing && (await prisma.guest.count({ where: { eventId: event.id } })) >= MAX_GUESTS_PER_EVENT)
    return { error: "This event isn't taking more RSVPs." };

  const reply = { rsvpStatus: status, respondedAt: new Date(), note: note || null };
  const guest = existing
    ? await prisma.guest.update({
        where: { id: existing.id },
        // Already on the list (maybe emailed an invite): update the reply, keep the host's name for them.
        data: { ...reply, name: existing.name ?? name, phone: phone || existing.phone },
      })
    : await prisma.guest.create({
        data: { ...reply, eventId: event.id, name, email, phone: phone || null, source: "LINK", token: newGuestToken() },
      });

  if (existing?.rsvpStatus !== status) {
    await sendEmail(rsvpConfirmationEmail(event, guest, event.owner, status === "ATTENDING")).catch((err) =>
      console.error("RSVP confirmation email failed", err),
    );
  }

  revalidatePath(`/dashboard/${event.id}`);
  return { ok: true as const };
}
