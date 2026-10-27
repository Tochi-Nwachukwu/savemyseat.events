import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui";
import { utcToZoned } from "@/lib/datetime";
import { imageUrl } from "@/lib/storage";
import { appUrl } from "@/lib/urls";
import { ownedEvent } from "@/server/owned-event";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: PageProps<"/dashboard/[eventId]/edit">) {
  const { eventId } = await params;
  const { event } = await ownedEvent(eventId);
  const { date, time } = utcToZoned(event.startsAt, event.timezone);

  return (
    <div className="mx-auto max-w-[600px] px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <Logo href="/dashboard" />
        <Link href={`/dashboard/${event.id}`} className={buttonClass({ variant: "ghost", size: "sm" })}>
          Cancel
        </Link>
      </header>
      <main className="pt-6">
        <EventForm
          mode="edit"
          eventId={event.id}
          appHost={appUrl().replace(/^https?:\/\//, "")}
          initialImageUrl={event.imageKey ? imageUrl(event.imageKey) : null}
          initial={{
            honoreeName: event.honoreeName,
            title: event.title,
            subtitle: event.subtitle ?? "",
            slug: event.slug,
            date,
            time,
            timezone: event.timezone,
            venueName: event.venueName,
            venueAddress: event.venueAddress ?? "",
            message: event.message ?? "",
            rsvpDeadline: event.rsvpDeadline ? utcToZoned(event.rsvpDeadline, event.timezone).date : "",
            capacity: event.capacity ? String(event.capacity) : "",
          }}
        />

        <section className="mt-20 rounded-[1.75rem] bg-danger-soft/60 p-6">
          <h2 className="text-xl font-semibold">Delete this event</h2>
          <p className="mt-2 text-base text-muted">
            Removes the event page, every guest and every RSVP. Guests&apos; links will stop working. This can&apos;t be undone.
          </p>
          <DeleteEventButton eventId={event.id} title={event.title} />
        </section>
      </main>
    </div>
  );
}
