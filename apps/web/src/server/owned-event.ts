import "server-only";
import { prisma } from "@savemyseat/db";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";

/** The signed-in user's event, or 404 (also for other people's events). */
export async function ownedEvent(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: user.id } });
  if (!event) notFound();
  return { user, event };
}
