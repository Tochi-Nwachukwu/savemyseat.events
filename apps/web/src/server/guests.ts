"use server";

import { prisma, newGuestToken, type RsvpStatus } from "@savemyseat/db";
import { revalidatePath } from "next/cache";
import { parseGuestList } from "@/lib/parse-guests";
import { ownedEvent } from "./owned-event";
import { sendInvitations } from "./send-invitations";

const MAX_GUESTS_PER_EVENT = 2000;

function refresh(eventId: string) {
  revalidatePath(`/dashboard/${eventId}`);
}

export async function addGuests(eventId: string, raw: string) {
  const { event } = await ownedEvent(eventId);
  const { guests, invalid } = parseGuestList(raw);
  if (guests.length === 0) return { error: "We couldn't find any email addresses in that list." };

  const existing = await prisma.guest.count({ where: { eventId } });
  if (existing + guests.length > MAX_GUESTS_PER_EVENT)
    return { error: `Events can have up to ${MAX_GUESTS_PER_EVENT} guests.` };

  const { count } = await prisma.guest.createMany({
    data: guests.map((g) => ({ eventId: event.id, name: g.name, email: g.email, token: newGuestToken() })),
    skipDuplicates: true,
  });
  refresh(eventId);
  return { added: count, duplicates: guests.length - count, invalid };
}

/** guestIds omitted = everyone the host added who hasn't been emailed yet (not link RSVPs). */
export async function sendInvites(eventId: string, guestIds?: string[]) {
  const { event, user } = await ownedEvent(eventId);
  const guests = await prisma.guest.findMany({
    where: guestIds ? { eventId, id: { in: guestIds } } : { eventId, inviteStatus: "NOT_SENT", source: "INVITED", rsvpStatus: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  if (guests.length === 0) return { sent: 0, failed: 0 };
  const result = await sendInvitations(event, user, guests, "invite");
  refresh(eventId);
  return result;
}

/** Only guests who were invited and haven't replied get a reminder. */
export async function sendReminders(eventId: string, guestIds?: string[]) {
  const { event, user } = await ownedEvent(eventId);
  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      rsvpStatus: "PENDING",
      inviteStatus: { in: ["SENT", "DELIVERED", "OPENED"] },
      ...(guestIds ? { id: { in: guestIds } } : {}),
    },
  });
  if (guests.length === 0) return { sent: 0, failed: 0 };
  const result = await sendInvitations(event, user, guests, "reminder");
  refresh(eventId);
  return result;
}

/** For replies the host got by text or in person. */
export async function setGuestRsvp(eventId: string, guestId: string, status: RsvpStatus) {
  await ownedEvent(eventId);
  await prisma.guest.updateMany({
    where: { id: guestId, eventId },
    data: { rsvpStatus: status, respondedAt: status === "PENDING" ? null : new Date() },
  });
  refresh(eventId);
}

export async function updateGuestName(eventId: string, guestId: string, name: string) {
  await ownedEvent(eventId);
  await prisma.guest.updateMany({ where: { id: guestId, eventId }, data: { name: name.trim().slice(0, 80) || null } });
  refresh(eventId);
}

export async function removeGuests(eventId: string, guestIds: string[]) {
  await ownedEvent(eventId);
  const { count } = await prisma.guest.deleteMany({ where: { eventId, id: { in: guestIds } } });
  refresh(eventId);
  return { removed: count };
}
