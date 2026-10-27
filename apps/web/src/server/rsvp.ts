"use server";

import { prisma } from "@savemyseat/db";
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
