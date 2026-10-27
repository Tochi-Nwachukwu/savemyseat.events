"use server";

import { prisma } from "@savemyseat/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidTimeZone, zonedToUtc } from "@/lib/datetime";
import { requireUser } from "@/lib/session";
import { slugProblem } from "@/lib/slug";
import { deleteImage, uploadInvitationImage } from "@/lib/storage";
import { ownedEvent } from "./owned-event";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

const eventSchema = z.object({
  honoreeName: z.string().trim().min(1, "Who are we celebrating?").max(80),
  title: z.string().trim().min(1, "Give your event a name.").max(120),
  subtitle: optionalText(160),
  slug: z.string().trim().toLowerCase(),
  date: isoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time."),
  timezone: z.string().refine(isValidTimeZone, "Pick a time zone."),
  venueName: z.string().trim().min(1, "Where is it happening?").max(160),
  venueAddress: optionalText(200),
  message: optionalText(2000),
  rsvpDeadline: z.preprocess(blankToUndefined, isoDate.optional()),
  capacity: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100_000).optional()),
  removeImage: z.preprocess((v) => v === "true", z.boolean()),
});

export type SaveEventResult = { error: string } | undefined;

function parse(formData: FormData) {
  const result = eventSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Please check the form." } as const;
  const slugError = slugProblem(result.data.slug);
  if (slugError) return { error: slugError } as const;
  const d = result.data;
  const startsAt = zonedToUtc(d.date, d.time, d.timezone);
  const rsvpDeadline = d.rsvpDeadline ? zonedToUtc(d.rsvpDeadline, "23:59", d.timezone) : null;
  if (rsvpDeadline && rsvpDeadline > startsAt) return { error: "The RSVP deadline should be before the event." } as const;
  return {
    data: {
      honoreeName: d.honoreeName,
      title: d.title,
      subtitle: d.subtitle ?? null,
      slug: d.slug,
      startsAt,
      timezone: d.timezone,
      venueName: d.venueName,
      venueAddress: d.venueAddress ?? null,
      message: d.message ?? null,
      rsvpDeadline,
      capacity: d.capacity ?? null,
    },
    removeImage: d.removeImage,
  } as const;
}

function imageFrom(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

async function slugTaken(slug: string, exceptEventId?: string) {
  const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(existing && existing.id !== exceptEventId);
}

export async function checkSlug(slug: string, exceptEventId?: string) {
  await requireUser();
  const problem = slugProblem(slug);
  if (problem) return { available: false, message: problem };
  if (await slugTaken(slug, exceptEventId)) return { available: false, message: "That address is taken. Try another." };
  return { available: true, message: "Available" };
}

export async function createEvent(formData: FormData): Promise<SaveEventResult> {
  const user = await requireUser("/new");
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error! };
  if (await slugTaken(parsed.data.slug)) return { error: "That page address is taken. Try another." };

  const event = await prisma.event.create({ data: { ...parsed.data, ownerId: user.id } });

  const image = imageFrom(formData);
  if (image) {
    try {
      const imageKey = await uploadInvitationImage(event.id, image);
      await prisma.event.update({ where: { id: event.id }, data: { imageKey } });
    } catch (err) {
      console.error("Image upload failed", err);
      // The event exists; let them add the image from the edit page.
      redirect(`/dashboard/${event.id}?notice=image-failed`);
    }
  }

  redirect(`/dashboard/${event.id}?notice=created`);
}

export async function updateEvent(eventId: string, formData: FormData): Promise<SaveEventResult> {
  const { event } = await ownedEvent(eventId);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error! };
  if (await slugTaken(parsed.data.slug, eventId)) return { error: "That page address is taken. Try another." };

  let imageKey = event.imageKey;
  const image = imageFrom(formData);
  if (image) {
    try {
      imageKey = await uploadInvitationImage(event.id, image);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't upload that image." };
    }
  } else if (parsed.removeImage) {
    imageKey = null;
  }

  await prisma.event.update({ where: { id: eventId }, data: { ...parsed.data, imageKey } });
  if (event.imageKey && event.imageKey !== imageKey) await deleteImage(event.imageKey).catch(() => {});

  revalidatePath(`/${event.slug}`);
  revalidatePath(`/${parsed.data.slug}`);
  redirect(`/dashboard/${eventId}?notice=saved`);
}

export async function deleteEvent(eventId: string) {
  const { event } = await ownedEvent(eventId);
  await prisma.event.delete({ where: { id: eventId } });
  if (event.imageKey) await deleteImage(event.imageKey).catch(() => {});
  redirect("/dashboard");
}
