import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuestShell } from "@/components/guest-shell";
import { InvitationView } from "@/components/invitation-view";
import { formatShortDate } from "@/lib/datetime";
import { RsvpForm } from "./rsvp-form";

// Personal links: keep them out of search engines and link previews.
export const metadata: Metadata = { title: "Your invitation", robots: { index: false, follow: false } };

export default async function InvitePage({ params }: PageProps<"/i/[token]">) {
  const { token } = await params;
  const guest = await prisma.guest.findUnique({ where: { token }, include: { event: true } });
  if (!guest) notFound();
  const { event } = guest;

  // Opening the link counts as opening the invite (email clients often block tracking pixels).
  if (guest.inviteStatus === "SENT" || guest.inviteStatus === "DELIVERED" || guest.inviteStatus === "NOT_SENT") {
    await prisma.guest.update({ where: { id: guest.id }, data: { inviteStatus: "OPENED" } });
  }

  const closed = Boolean(event.rsvpDeadline && event.rsvpDeadline < new Date());
  const isFull =
    event.capacity !== null &&
    guest.rsvpStatus !== "ATTENDING" &&
    (await prisma.guest.count({ where: { eventId: event.id, rsvpStatus: "ATTENDING" } })) >= event.capacity;

  return (
    <GuestShell>
      <InvitationView event={event}>
        <RsvpForm
          token={token}
          guestName={guest.name}
          honoreeFirstName={event.honoreeName.split(/\s+/)[0] ?? event.honoreeName}
          initialStatus={guest.rsvpStatus}
          initialNote={guest.note ?? ""}
          deadline={event.rsvpDeadline ? formatShortDate(event.rsvpDeadline, event.timezone) : null}
          closed={closed}
          full={isFull}
        />
      </InvitationView>
    </GuestShell>
  );
}
