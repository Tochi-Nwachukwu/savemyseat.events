import {
  CalendarCheckIcon,
  CheckCircleIcon,
  LinkSimpleIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { prisma } from "@savemyseat/db";
import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard-header";
import { Chip, IconBubble, type PastelTone } from "@/components/ui";
import { formatEventTime, timeAgo } from "@/lib/datetime";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const WEEK = 7 * 24 * 3600_000;

export default async function AdminPage() {
  const admin = await requireAdmin();
  const weekAgo = new Date(Date.now() - WEEK);

  const [userCount, newUsers, events, guestCounts, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        timezone: true,
        capacity: true,
        createdAt: true,
        owner: { select: { email: true } },
      },
    }),
    prisma.guest.groupBy({ by: ["eventId", "rsvpStatus", "source"], _count: { _all: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, email: true, name: true, role: true, createdAt: true, _count: { select: { events: true } } },
    }),
  ]);

  // eventId → counts
  const byEvent = new Map<string, { total: number; attending: number; declined: number; awaiting: number; viaLink: number }>();
  for (const row of guestCounts) {
    const c = byEvent.get(row.eventId) ?? { total: 0, attending: 0, declined: 0, awaiting: 0, viaLink: 0 };
    const n = row._count._all;
    c.total += n;
    if (row.rsvpStatus === "ATTENDING") c.attending += n;
    if (row.rsvpStatus === "DECLINED") c.declined += n;
    if (row.rsvpStatus === "PENDING") c.awaiting += n;
    if (row.source === "LINK") c.viaLink += n;
    byEvent.set(row.eventId, c);
  }
  const totals = [...byEvent.values()].reduce(
    (t, c) => ({ guests: t.guests + c.total, attending: t.attending + c.attending }),
    { guests: 0, attending: 0 },
  );
  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt > now).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <DashboardHeader user={admin} />

      <main className="pt-4">
        <Chip tone="accent">Admin</Chip>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Overview</h1>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={UserCircleIcon} tone="lilac" label="Users" value={userCount} sub={`${newUsers} new this week`} />
          <Stat icon={CalendarCheckIcon} tone="sky" label="Events" value={events.length} sub={`${upcoming} upcoming`} />
          <Stat icon={UsersThreeIcon} tone="peach" label="Guests" value={totals.guests} sub="across all events" />
          <Stat icon={CheckCircleIcon} tone="mint" label="Coming" value={totals.attending} sub="said they'll attend" />
        </section>

        <section className="mt-6 rounded-[2rem] bg-surface p-4 sm:p-6">
          <h2 className="px-2 text-2xl font-semibold">Events</h2>
          {events.length === 0 ? (
            <p className="px-2 py-10 text-center text-lg text-muted">No events yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-page text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Host</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Coming</th>
                    <th className="px-4 py-3 text-right font-medium">Declined</th>
                    <th className="px-4 py-3 text-right font-medium">Awaiting</th>
                    <th className="px-4 py-3 text-right font-medium">Guests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {events.map((e) => {
                    const c = byEvent.get(e.id) ?? { total: 0, attending: 0, declined: 0, awaiting: 0, viaLink: 0 };
                    const past = e.startsAt < now;
                    return (
                      <tr key={e.id} className="align-top">
                        <td className="px-4 py-3">
                          <a href={`/${e.slug}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                            {e.title}
                          </a>
                          <p className="text-muted">/{e.slug} · created {timeAgo(e.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{e.owner.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className={past ? "text-subtle" : ""}>
                            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: e.timezone }).format(e.startsAt)}
                          </p>
                          <p className="text-muted">{formatEventTime(e.startsAt, e.timezone)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-semibold text-success">{c.attending}</span>
                          {e.capacity && <span className="text-muted"> / {e.capacity}</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-muted">{c.declined}</td>
                        <td className="px-4 py-3 text-right text-muted">{c.awaiting}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">{c.total}</span>
                          {c.viaLink > 0 && (
                            <p className="flex items-center justify-end gap-1 text-xs text-muted">
                              <LinkSimpleIcon size={12} weight="bold" aria-hidden /> {c.viaLink} via link
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] bg-surface p-4 sm:p-6">
          <h2 className="px-2 text-2xl font-semibold">Users</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-page text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 text-right font-medium">Events</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {u.email} {u.role === "admin" && <Chip tone="accent" className="ml-1 h-5 px-2 text-xs">admin</Chip>}
                      </p>
                      {u.name && <p className="text-muted">{u.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">{u._count.events}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{timeAgo(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userCount > users.length && <p className="mt-3 px-2 text-sm text-muted">Showing the newest {users.length} of {userCount}.</p>}
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentProps<typeof IconBubble>["icon"];
  tone: PastelTone;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-[1.75rem] bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <IconBubble icon={icon} tone={tone} size="sm" />
      </div>
      <p className="mt-3 text-4xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}
