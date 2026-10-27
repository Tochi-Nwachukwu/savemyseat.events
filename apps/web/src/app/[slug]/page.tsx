import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { GuestShell } from "@/components/guest-shell";
import { InvitationView } from "@/components/invitation-view";
import { IconBubble } from "@/components/ui";
import { formatEventDate, formatShortDate } from "@/lib/datetime";
import { imageUrl } from "@/lib/storage";
import { PublicRsvpForm } from "./public-rsvp-form";

const getEvent = cache((slug: string) => prisma.event.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  if (!event) return {};
  const description = `${formatEventDate(event.startsAt, event.timezone)} · ${event.venueName}`;
  return {
    title: event.title,
    description,
    openGraph: { title: event.title, description, images: event.imageKey ? [imageUrl(event.imageKey)] : undefined },
    twitter: { card: event.imageKey ? "summary_large_image" : "summary", title: event.title, description },
  };
}

export default async function EventPage({ params }: PageProps<"/[slug]">) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();

  const closed = Boolean(event.rsvpDeadline && event.rsvpDeadline < new Date());
  const full =
    event.capacity !== null &&
    (await prisma.guest.count({ where: { eventId: event.id, rsvpStatus: "ATTENDING" } })) >= event.capacity;

  return (
    <GuestShell>
      <InvitationView event={event}>
        {event.openRsvp && !closed ? (
          <PublicRsvpForm
            slug={event.slug}
            honoreeFirstName={event.honoreeName.split(/\s+/)[0] ?? event.honoreeName}
            deadline={event.rsvpDeadline ? formatShortDate(event.rsvpDeadline, event.timezone) : null}
            full={full}
          />
        ) : (
          <div className="flex items-center gap-4 rounded-[2rem] bg-surface p-6">
            <IconBubble icon={EnvelopeSimpleIcon} tone="mint" />
            <p className="text-lg text-muted">
              {closed ? "RSVPs for this event have closed." : "Invited? Use the personal link in your invitation email to RSVP."}
            </p>
          </div>
        )}
      </InvitationView>
    </GuestShell>
  );
}
