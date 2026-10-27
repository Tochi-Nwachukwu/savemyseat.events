import type { Event } from "@savemyseat/db";
import {
  AppleLogoIcon,
  CalendarBlankIcon,
  ClockIcon,
  GoogleLogoIcon,
  MapPinIcon,
} from "@phosphor-icons/react/ssr";
import { LoopDoodle, SparkleDoodle, StarDoodle } from "@/components/doodles";
import { buttonClass, Chip, IconBubble } from "@/components/ui";
import { googleCalendarUrl, location, mapsUrl } from "@/lib/calendar";
import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { imageUrl } from "@/lib/storage";
import { appUrl } from "@/lib/urls";

type InvitationEvent = Pick<
  Event,
  "id" | "slug" | "title" | "honoreeName" | "subtitle" | "venueName" | "venueAddress" | "startsAt" | "timezone" | "message" | "imageKey"
>;

/** The invitation itself: image, headline, details, calendar links and the host's note. */
export function InvitationView({ event, children }: { event: InvitationEvent; children?: React.ReactNode }) {
  const calendarEvent = {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    description: `${event.title}\n${appUrl(`/${event.slug}`)}`,
  };

  return (
    <article className="space-y-6">
      {event.imageKey ? (
        <div className="overflow-hidden rounded-[2rem] bg-surface p-2 shadow-[0_24px_60px_-28px_rgb(31_29_51/0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- unknown aspect ratio, already resized on upload */}
          <img
            src={imageUrl(event.imageKey)}
            alt={`Invitation for ${event.title}`}
            className="w-full rounded-[1.6rem]"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[2rem] bg-lilac px-8 py-16 text-center">
          <SparkleDoodle className="absolute top-8 left-8 size-10 text-lilac-ink/40" />
          <StarDoodle className="absolute right-10 bottom-8 size-9 rotate-12 text-blush-ink/40" />
          <LoopDoodle className="absolute top-10 right-8 text-butter-ink/40" />
          <p className="text-lg font-medium text-lilac-ink">You&apos;re invited</p>
          <p className="mt-3 text-4xl font-semibold">{event.honoreeName}</p>
        </div>
      )}

      <div className="rounded-[2rem] bg-surface p-6 sm:p-8">
        <Chip tone="accent">You&apos;re invited</Chip>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">{event.title}</h1>
        <p className="mt-3 text-xl text-muted">{[event.honoreeName, event.subtitle].filter(Boolean).join(" · ")}</p>

        <ul className="mt-8 space-y-5">
          <DetailRow icon={<IconBubble icon={CalendarBlankIcon} tone="sky" />} label="Date">
            {formatEventDate(event.startsAt, event.timezone)}
          </DetailRow>
          <DetailRow icon={<IconBubble icon={ClockIcon} tone="butter" />} label="Time">
            {formatEventTime(event.startsAt, event.timezone)}
          </DetailRow>
          <DetailRow icon={<IconBubble icon={MapPinIcon} tone="blush" />} label="Where">
            <a href={mapsUrl(event)} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-ink">
              {location(event)}
            </a>
          </DetailRow>
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={googleCalendarUrl(calendarEvent)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass({ variant: "secondary", className: "sm:flex-1" })}
          >
            <GoogleLogoIcon size={18} weight="bold" aria-hidden /> Google Calendar
          </a>
          <a href={`/${event.slug}/calendar.ics`} className={buttonClass({ variant: "secondary", className: "sm:flex-1" })}>
            <AppleLogoIcon size={18} weight="fill" aria-hidden /> Apple / Outlook
          </a>
        </div>
      </div>

      {event.message && (
        <figure className="rounded-[2rem] bg-peach/70 p-6 sm:p-8">
          <blockquote className="text-xl leading-relaxed whitespace-pre-line">“{event.message}”</blockquote>
          <figcaption className="mt-4 text-base font-medium text-peach-ink">— {event.honoreeName}</figcaption>
        </figure>
      )}

      {children}
    </article>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4">
      {icon}
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="text-lg font-medium break-words">{children}</p>
      </div>
    </li>
  );
}
