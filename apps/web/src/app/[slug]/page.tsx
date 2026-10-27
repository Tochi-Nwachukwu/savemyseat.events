import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { GuestShell } from "@/components/guest-shell";
import { InvitationView } from "@/components/invitation-view";
import { IconBubble } from "@/components/ui";
import { formatEventDate } from "@/lib/datetime";
import { imageUrl } from "@/lib/storage";

const getEvent = cache((slug: string) => prisma.event.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  if (!event) return {};
  const description = `${formatEventDate(event.startsAt, event.timezone)} · ${event.venueName}`;
  return {
    title: event.title,
    description,
    openGraph: { title: event.title, description, images: event.imageKey ? [imageUrl(event.imageKey)] : undefined },
  };
}

export default async function EventPage({ params }: PageProps<"/[slug]">) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();

  return (
    <GuestShell>
      <InvitationView event={event}>
        <div className="flex items-center gap-4 rounded-[2rem] bg-surface p-6">
          <IconBubble icon={EnvelopeSimpleIcon} tone="mint" />
          <p className="text-lg text-muted">
            Invited? Use the personal link in your invitation email to RSVP.
          </p>
        </div>
      </InvitationView>
    </GuestShell>
  );
}
