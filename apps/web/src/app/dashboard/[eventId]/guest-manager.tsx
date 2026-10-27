"use client";

import {
  BellRingingIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  UsersThreeIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button, buttonClass, Chip, IconBubble, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/datetime";
import { parseGuestList } from "@/lib/parse-guests";
import { addGuests, removeGuests, sendInvites, sendReminders, setGuestRsvp } from "@/server/guests";

type InviteStatus = "NOT_SENT" | "SENT" | "DELIVERED" | "OPENED" | "BOUNCED" | "FAILED";
type RsvpStatus = "PENDING" | "ATTENDING" | "DECLINED";

export type GuestRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: "INVITED" | "LINK";
  token: string;
  inviteStatus: InviteStatus;
  rsvpStatus: RsvpStatus;
  note: string | null;
  respondedAt: string | null;
};

const INVITE: Record<InviteStatus, { label: string; tone: "neutral" | "accent" | "success" | "danger" }> = {
  NOT_SENT: { label: "Not sent", tone: "neutral" },
  SENT: { label: "Sent", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "accent" },
  OPENED: { label: "Opened", tone: "success" },
  BOUNCED: { label: "Bounced", tone: "danger" },
  FAILED: { label: "Failed", tone: "danger" },
};

/** Guests who replied without an email (via the link, or marked by the host) don't need one. */
function inviteBadge(g: GuestRow) {
  if (g.inviteStatus !== "NOT_SENT") return INVITE[g.inviteStatus];
  if (g.source === "LINK") return { label: "Via link", tone: "accent" as const };
  if (g.rsvpStatus !== "PENDING") return { label: "Not needed", tone: "neutral" as const };
  return INVITE.NOT_SENT;
}
const needsInvite = (g: GuestRow) => g.inviteStatus === "NOT_SENT" && g.source === "INVITED" && g.rsvpStatus === "PENDING";

const RSVP: Record<RsvpStatus, { label: string; tone: "warning" | "success" | "danger" }> = {
  PENDING: { label: "Awaiting", tone: "warning" },
  ATTENDING: { label: "Attending", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
};

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "not-sent", label: "Not sent", test: needsInvite },
  { key: "via-link", label: "Via link", test: (g: GuestRow) => g.source === "LINK" },
  { key: "awaiting", label: "Awaiting", test: (g: GuestRow) => g.rsvpStatus === "PENDING" },
  { key: "attending", label: "Attending", test: (g: GuestRow) => g.rsvpStatus === "ATTENDING" },
  { key: "declined", label: "Declined", test: (g: GuestRow) => g.rsvpStatus === "DECLINED" },
  { key: "problems", label: "Bounced", test: (g: GuestRow) => g.inviteStatus === "BOUNCED" || g.inviteStatus === "FAILED" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

type SortKey = "guest" | "invite" | "rsvp" | "replied";
const inviteOrder: InviteStatus[] = ["BOUNCED", "FAILED", "NOT_SENT", "SENT", "DELIVERED", "OPENED"];
const rsvpOrder: RsvpStatus[] = ["ATTENDING", "PENDING", "DECLINED"];

const isInvited = (g: GuestRow) => g.inviteStatus !== "NOT_SENT";
const canRemind = (g: GuestRow) =>
  g.rsvpStatus === "PENDING" && (g.inviteStatus === "SENT" || g.inviteStatus === "DELIVERED" || g.inviteStatus === "OPENED");

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function GuestManager({
  eventId,
  guests,
  capacity,
  rsvpBaseUrl,
  openRsvp,
}: {
  eventId: string;
  guests: GuestRow[];
  capacity: number | null;
  rsvpBaseUrl: string;
  openRsvp: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "guest", dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(guests.length === 0 && !openRsvp);
  const [toast, setToast] = useState<{ text: string; tone: "success" | "danger" } | null>(null);
  const [pending, startTransition] = useTransition();

  // Drop selections for guests that were removed.
  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => guests.some((g) => g.id === id))));
  }, [guests]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const attending = guests.filter((g) => g.rsvpStatus === "ATTENDING").length;
    return {
      total: guests.length,
      invited: guests.filter(isInvited).length,
      attending,
      declined: guests.filter((g) => g.rsvpStatus === "DECLINED").length,
      awaiting: guests.filter((g) => g.rsvpStatus === "PENDING").length,
      notSent: guests.filter(needsInvite).length,
      viaLink: guests.filter((g) => g.source === "LINK").length,
      remindable: guests.filter(canRemind).length,
    };
  }, [guests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)!.test;
    const rows = guests.filter((g) => test(g) && (!q || g.email.includes(q) || g.name?.toLowerCase().includes(q) || g.phone?.includes(q)));
    const value = (g: GuestRow): string | number => {
      switch (sort.key) {
        case "guest":
          return (g.name ?? g.email).toLowerCase();
        case "invite":
          return inviteOrder.indexOf(g.inviteStatus);
        case "rsvp":
          return rsvpOrder.indexOf(g.rsvpStatus);
        case "replied":
          return g.respondedAt ?? "";
      }
    };
    return [...rows].sort((a, b) => (value(a) < value(b) ? -sort.dir : value(a) > value(b) ? sort.dir : 0));
  }, [guests, query, filter, sort]);

  const selectedGuests = guests.filter((g) => selected.has(g.id));
  const allVisibleSelected = visible.length > 0 && visible.every((g) => selected.has(g.id));

  function run(action: () => Promise<string | void>) {
    startTransition(async () => {
      try {
        const message = await action();
        if (message) setToast({ text: message, tone: "success" });
      } catch {
        setToast({ text: "Something went wrong. Please try again.", tone: "danger" });
      }
    });
  }

  function sendTo(ids: string[] | undefined, count: number, resend = false) {
    if (count === 0) return;
    if (!confirm(`${resend ? "Resend" : "Send"} the invitation to ${plural(count, "guest")}?`)) return;
    run(async () => {
      const { sent, failed } = await sendInvites(eventId, ids);
      setSelected(new Set());
      return failed ? `Sent ${sent}, but ${failed} failed. Try those again.` : `Invitations sent to ${plural(sent, "guest")}.`;
    });
  }

  function remind(ids: string[] | undefined, count: number) {
    if (count === 0) return;
    if (!confirm(`Send a reminder to ${plural(count, "guest")} who haven't replied?`)) return;
    run(async () => {
      const { sent, failed } = await sendReminders(eventId, ids);
      setSelected(new Set());
      return failed ? `Reminded ${sent}, but ${failed} failed.` : `Reminder sent to ${plural(sent, "guest")}.`;
    });
  }

  function remove(ids: string[]) {
    if (!confirm(`Remove ${plural(ids.length, "guest")}? Their RSVP links will stop working.`)) return;
    run(async () => {
      const { removed } = await removeGuests(eventId, ids);
      setSelected(new Set());
      return `Removed ${plural(removed, "guest")}.`;
    });
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  return (
    <>
      {/* Stats */}
      <section className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={UsersThreeIcon}
          tone="lilac"
          label="Guests"
          value={stats.total}
          sub={stats.viaLink ? `${stats.invited} invited · ${stats.viaLink} via link` : `${stats.invited} invited`}
        />
        <StatCard
          icon={CheckCircleIcon}
          tone="mint"
          label="Attending"
          value={stats.attending}
          sub={capacity ? `of ${capacity} seats` : "seats saved"}
          progress={capacity ? stats.attending / capacity : undefined}
        />
        <StatCard icon={ClockCountdownIcon} tone="butter" label="Awaiting reply" value={stats.awaiting} sub={stats.notSent ? `${stats.notSent} not sent yet` : "everyone's invited"} />
        <StatCard icon={XCircleIcon} tone="blush" label="Declined" value={stats.declined} sub="can't make it" />
      </section>

      {/* Guests */}
      <section className="mt-6 rounded-[2rem] bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="px-2 text-2xl font-semibold">Guests</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd((v) => !v)}>
              <PlusIcon size={16} weight="bold" aria-hidden /> Add guests
            </Button>
            {stats.remindable > 0 && (
              <Button variant="secondary" size="sm" disabled={pending} onClick={() => remind(undefined, stats.remindable)}>
                <BellRingingIcon size={16} weight="duotone" aria-hidden /> Remind {stats.remindable}
              </Button>
            )}
            {stats.total > 0 && (
              <a href={`/dashboard/${eventId}/guests.csv`} className={buttonClass({ variant: "secondary", size: "sm" })}>
                <DownloadSimpleIcon size={16} weight="duotone" aria-hidden /> Export
              </a>
            )}
            {stats.notSent > 0 && (
              <Button size="sm" disabled={pending} onClick={() => sendTo(undefined, stats.notSent)}>
                <PaperPlaneTiltIcon size={16} weight="duotone" aria-hidden /> Send {plural(stats.notSent, "invite")}
              </Button>
            )}
          </div>
        </div>

        {showAdd && <AddGuestsPanel eventId={eventId} onDone={(text) => setToast({ text, tone: "success" })} onClose={() => setShowAdd(false)} />}

        {guests.length > 0 && (
          <>
            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1 lg:max-w-xs">
                <span className="sr-only">Search guests</span>
                <MagnifyingGlassIcon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle" aria-hidden />
                <input
                  type="search"
                  placeholder="Search name, email or phone"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11 w-full rounded-full bg-field pr-4 pl-11 text-base placeholder:text-subtle focus:bg-surface focus:ring-2 focus:ring-accent/30 focus:outline-none"
                />
              </label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {FILTERS.map((f) => {
                  const count = guests.filter(f.test).length;
                  if ((f.key === "problems" || f.key === "via-link") && count === 0) return null;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                        filter === f.key ? "bg-ink text-white" : "bg-field text-muted hover:bg-field-hover",
                      )}
                    >
                      {f.label}
                      <span className={cn("text-xs", filter === f.key ? "text-white/70" : "text-subtle")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left text-sm md:min-w-[760px]">
                <thead className="bg-page text-muted">
                  <tr>
                    <th className="w-10 py-3 pr-1 pl-4">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        className="size-4 accent-accent"
                        checked={allVisibleSelected}
                        onChange={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            for (const g of visible) (allVisibleSelected ? next.delete(g.id) : next.add(g.id));
                            return next;
                          })
                        }
                      />
                    </th>
                    <SortHeader label="Guest" active={sort.key === "guest"} dir={sort.dir} onClick={() => toggleSort("guest")} />
                    <SortHeader label="Invite" className="hidden md:table-cell" active={sort.key === "invite"} dir={sort.dir} onClick={() => toggleSort("invite")} />
                    <SortHeader label="RSVP" className="w-px whitespace-nowrap" active={sort.key === "rsvp"} dir={sort.dir} onClick={() => toggleSort("rsvp")} />
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Note</th>
                    <SortHeader label="Replied" className="hidden md:table-cell" active={sort.key === "replied"} dir={sort.dir} onClick={() => toggleSort("replied")} />
                    <th className="w-px py-3 pr-3 pl-1">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((g) => (
                    <tr key={g.id} className={cn("transition-colors", selected.has(g.id) ? "bg-accent-soft/50" : "hover:bg-page/60")}>
                      <td className="py-3 pr-1 pl-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${g.name ?? g.email}`}
                          className="size-4 accent-accent"
                          checked={selected.has(g.id)}
                          onChange={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(g.id)) next.delete(g.id);
                              else next.add(g.id);
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-3 md:px-4">
                        <p className="font-medium">{g.name ?? <span className="text-subtle">No name</span>}</p>
                        <p className="break-all text-muted">{g.email}</p>
                        {g.phone && (
                          <a href={`tel:${g.phone}`} className="text-muted hover:text-ink">
                            {g.phone}
                          </a>
                        )}
                        <p className="mt-1 text-xs text-subtle md:hidden">Invite: {inviteBadge(g).label.toLowerCase()}</p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Chip tone={inviteBadge(g).tone}>{inviteBadge(g).label}</Chip>
                      </td>
                      <td className="w-px px-2 py-3 whitespace-nowrap md:px-4">
                        <Chip tone={RSVP[g.rsvpStatus].tone}>{RSVP[g.rsvpStatus].label}</Chip>
                      </td>
                      <td className="hidden max-w-56 px-4 py-3 text-muted md:table-cell">
                        <p className="line-clamp-2" title={g.note ?? undefined}>
                          {g.note ?? ""}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-muted md:table-cell">{g.respondedAt ? timeAgo(new Date(g.respondedAt)) : "—"}</td>
                      <td className="w-px py-3 pr-3 pl-1">
                        <RowMenu
                          guest={g}
                          rsvpUrl={`${rsvpBaseUrl}${g.token}`}
                          disabled={pending}
                          onSend={() => sendTo([g.id], 1, isInvited(g))}
                          onRemind={() => remind([g.id], 1)}
                          onSetRsvp={(status) =>
                            run(async () => {
                              await setGuestRsvp(eventId, g.id, status);
                              return `Marked ${g.name ?? g.email} as ${RSVP[status].label.toLowerCase()}.`;
                            })
                          }
                          onRemove={() => remove([g.id])}
                        />
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-base text-muted">
                        No guests match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {guests.length === 0 && !showAdd && (
          <div className="py-12 text-center">
            <IconBubble icon={EnvelopeSimpleIcon} tone="peach" size="lg" className="mx-auto" />
            <p className="mx-auto mt-4 max-w-md text-lg text-muted">
              {openRsvp
                ? "No RSVPs yet. Share your page link and replies will appear here, or add guests by email."
                : "No guests yet. Add some to send your invitations."}
            </p>
          </div>
        )}
      </section>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-[1.75rem] bg-ink p-3 text-white shadow-2xl sm:bottom-6">
          <span className="px-3 text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <BulkButton disabled={pending} onClick={() => sendTo([...selected], selected.size, selectedGuests.some(isInvited))}>
              <PaperPlaneTiltIcon size={16} weight="duotone" aria-hidden /> Send invite
            </BulkButton>
            <BulkButton
              disabled={pending || !selectedGuests.some(canRemind)}
              onClick={() => remind([...selected], selectedGuests.filter(canRemind).length)}
            >
              <BellRingingIcon size={16} weight="duotone" aria-hidden /> Remind
            </BulkButton>
            <BulkButton disabled={pending} onClick={() => remove([...selected])}>
              Remove
            </BulkButton>
            <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
              <XIcon size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={cn(
            "fixed top-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl px-5 py-4 text-base font-medium shadow-lg",
            toast.tone === "success" ? "bg-mint text-mint-ink" : "bg-danger-soft text-danger",
          )}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ComponentProps<typeof IconBubble>["icon"];
  tone: React.ComponentProps<typeof IconBubble>["tone"];
  label: string;
  value: number;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="rounded-[1.75rem] bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <IconBubble icon={icon} tone={tone} size="sm" />
      </div>
      <p className="mt-3 text-4xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-field">
          <div className="h-full rounded-full bg-mint-ink transition-all" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function SortHeader({ label, active, dir, onClick, className }: { label: string; active: boolean; dir: 1 | -1; onClick: () => void; className?: string }) {
  const Caret = dir === 1 ? CaretUpIcon : CaretDownIcon;
  return (
    <th className={cn("px-4 py-3 font-medium", className)} aria-sort={active ? (dir === 1 ? "ascending" : "descending") : undefined}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <Caret size={12} weight="bold" className={active ? "opacity-100" : "opacity-0"} aria-hidden />
      </button>
    </th>
  );
}

function BulkButton(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium hover:bg-white/20 disabled:opacity-40"
    />
  );
}

function RowMenu({
  guest,
  rsvpUrl,
  disabled,
  onSend,
  onRemind,
  onSetRsvp,
  onRemove,
}: {
  guest: GuestRow;
  rsvpUrl: string;
  disabled: boolean;
  onSend: () => void;
  onRemind: () => void;
  onSetRsvp: (status: RsvpStatus) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = (label: string, action: () => void, show = true, danger = false) =>
    show && (
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={() => {
          setOpen(false);
          action();
        }}
        className={cn("block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-page disabled:opacity-50", danger && "text-danger")}
      >
        {label}
      </button>
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Actions for ${guest.name ?? guest.email}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full text-muted hover:bg-field hover:text-ink"
      >
        <DotsThreeIcon size={22} weight="bold" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          {item("Copy RSVP link", () => navigator.clipboard.writeText(rsvpUrl))}
          {item(guest.inviteStatus === "NOT_SENT" ? "Send invite" : "Resend invite", onSend)}
          {item("Send reminder", onRemind, canRemind(guest))}
          <div className="my-1 border-t border-line" />
          {item("Mark as attending", () => onSetRsvp("ATTENDING"), guest.rsvpStatus !== "ATTENDING")}
          {item("Mark as declined", () => onSetRsvp("DECLINED"), guest.rsvpStatus !== "DECLINED")}
          {item("Reset to awaiting", () => onSetRsvp("PENDING"), guest.rsvpStatus !== "PENDING")}
          <div className="my-1 border-t border-line" />
          {item("Remove guest", onRemove, true, true)}
        </div>
      )}
    </div>
  );
}

function AddGuestsPanel({ eventId, onDone, onClose }: { eventId: string; onDone: (message: string) => void; onClose: () => void }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const parsed = useMemo(() => parseGuestList(raw), [raw]);

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await addGuests(eventId, raw);
      if ("error" in res) {
        setError(res.error!);
        return;
      }
      setRaw("");
      onClose();
      const extra = res.duplicates ? ` (${res.duplicates} already on the list)` : "";
      onDone(`Added ${plural(res.added, "guest")}${extra}. Send the invites when you're ready.`);
    });
  }

  return (
    <div className="mt-5 rounded-[1.5rem] bg-page p-5">
      <label htmlFor="guest-list" className="block text-lg font-medium">
        Paste your guest list
      </label>
      <p className="mt-1 text-base text-muted">
        One per line or separated by commas. Names are optional: <span className="text-ink">Grace Kim &lt;grace@example.com&gt;</span>
      </p>
      <Textarea
        id="guest-list"
        rows={5}
        className="mt-4 bg-surface"
        placeholder={"ada@example.com\nTunde Bello <tunde@example.com>"}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      {raw.trim() && (
        <p className="mt-3 text-base text-muted">
          Found <span className="font-medium text-ink">{plural(parsed.guests.length, "email")}</span>
          {parsed.invalid.length > 0 && (
            <span className="text-warning">
              {" "}
              · couldn&apos;t read: {parsed.invalid.slice(0, 3).join(", ")}
              {parsed.invalid.length > 3 ? "…" : ""}
            </span>
          )}
        </p>
      )}
      {error && <p className="mt-3 text-base text-danger">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button disabled={pending || parsed.guests.length === 0} onClick={submit}>
          {pending ? "Adding…" : parsed.guests.length ? `Add ${plural(parsed.guests.length, "guest")}` : "Add guests"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
