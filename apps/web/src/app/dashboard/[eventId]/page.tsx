import { ArrowLeftIcon, ArrowSquareOutIcon, CalendarBlankIcon, MapPinIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { DashboardHeader } from "@/components/dashboard-header";
import { buttonClass } from "@/components/ui";
import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { appUrl, displayEventUrl } from "@/lib/urls";
import { ownedEvent } from "@/server/owned-event";
import { GuestManager } from "./guest-manager";

export const metadata: Metadata = { title: "Guests" };

const NOTICES: Record<string, { text: string; tone: "success" | "warning" }> = {
  created: { text: "Your event is live! Add your guests below, then send the invites.", tone: "success" },
  saved: { text: "Changes saved.", tone: "success" },
  "image-failed": { text: "Your event was created, but the image didn't upload. Add it again from Edit event.", tone: "warning" },
};

export default async function EventDashboardPage({ params, searchParams }: PageProps<"/dashboard/[eventId]">) {
  const { eventId } = await params;
  const { notice } = await searchParams;
  const { user, event } = await ownedEvent(eventId);
  const guests = await prisma.guest.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
  const banner = typeof notice === "string" ? NOTICES[notice] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <DashboardHeader email={user.email} />

      <main className="pt-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-base font-medium text-muted hover:text-ink">
          <ArrowLeftIcon size={16} weight="bold" aria-hidden /> All events
        </Link>

        {banner && (
          <p
            className={
              banner.tone === "success"
                ? "mt-6 rounded-2xl bg-mint px-5 py-4 text-base font-medium text-mint-ink"
                : "mt-6 rounded-2xl bg-warning-soft px-5 py-4 text-base font-medium text-warning"
            }
          >
            {banner.text}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl font-semibold sm:text-5xl">{event.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base text-muted">
              <span className="flex items-center gap-2">
                <CalendarBlankIcon size={20} weight="duotone" className="text-sky-ink" aria-hidden />
                {formatEventDate(event.startsAt, event.timezone)}, {formatEventTime(event.startsAt, event.timezone)}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon size={20} weight="duotone" className="text-blush-ink" aria-hidden />
                {event.venueName}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={appUrl(`/${event.slug}`)} label={displayEventUrl(event.slug)} />
            <a href={`/${event.slug}`} target="_blank" rel="noreferrer" className={buttonClass({ variant: "secondary", size: "sm" })}>
              <ArrowSquareOutIcon size={16} weight="duotone" aria-hidden /> View page
            </a>
            <Link href={`/dashboard/${event.id}/edit`} className={buttonClass({ variant: "secondary", size: "sm" })}>
              <PencilSimpleIcon size={16} weight="duotone" aria-hidden /> Edit event
            </Link>
          </div>
        </div>

        <GuestManager
          eventId={event.id}
          capacity={event.capacity}
          rsvpBaseUrl={appUrl("/i/")}
          openRsvp={event.openRsvp}
          guests={guests.map((g) => ({
            id: g.id,
            name: g.name,
            email: g.email,
            phone: g.phone,
            source: g.source,
            token: g.token,
            inviteStatus: g.inviteStatus,
            rsvpStatus: g.rsvpStatus,
            note: g.note,
            respondedAt: g.respondedAt?.toISOString() ?? null,
          }))}
        />
      </main>
    </div>
  );
}
