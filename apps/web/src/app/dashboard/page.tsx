import { CalendarBlankIcon, PlusIcon, SparkleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { buttonClass, IconBubble } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your events" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const events = await prisma.event.findMany({
    where: { ownerId: user.id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      startsAt: true,
      timezone: true,
      _count: { select: { guests: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <DashboardHeader email={user.email} />

      <main className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-5xl font-semibold">Your events</h1>
          {events.length > 0 && (
            <Link href="/new" className={buttonClass()}>
              <PlusIcon size={18} weight="bold" aria-hidden /> New event
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="mt-10 rounded-[2rem] bg-surface px-6 py-16 text-center">
            <IconBubble icon={SparkleIcon} tone="lilac" size="lg" className="mx-auto" />
            <h2 className="mt-6 text-3xl font-semibold">No events yet</h2>
            <p className="mx-auto mt-3 max-w-sm text-lg text-muted">
              Create your first event and you&apos;ll have an invitation page to share in minutes.
            </p>
            <Link href="/new" className={buttonClass({ size: "lg", className: "mt-8" })}>
              Create your event
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard/${event.id}`}
                  className="block rounded-[2rem] bg-surface p-6 transition-transform hover:-translate-y-0.5"
                >
                  <h2 className="text-2xl font-semibold">{event.title}</h2>
                  <p className="mt-1 text-muted">savemyseat.events/{event.slug}</p>
                  <div className="mt-6 flex flex-wrap gap-4 text-base text-muted">
                    <span className="flex items-center gap-2">
                      <CalendarBlankIcon size={20} weight="duotone" className="text-sky-ink" aria-hidden />
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: event.timezone }).format(
                        event.startsAt,
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <UsersThreeIcon size={20} weight="duotone" className="text-mint-ink" aria-hidden />
                      {event._count.guests} {event._count.guests === 1 ? "guest" : "guests"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
