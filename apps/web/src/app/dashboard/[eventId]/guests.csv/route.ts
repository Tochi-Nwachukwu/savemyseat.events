import { prisma } from "@savemyseat/db";
import { getSession } from "@/lib/session";
import { appUrl } from "@/lib/urls";

const LABELS = {
  invite: { NOT_SENT: "Not sent", SENT: "Sent", DELIVERED: "Delivered", OPENED: "Opened", BOUNCED: "Bounced", FAILED: "Failed" },
  rsvp: { PENDING: "Awaiting", ATTENDING: "Attending", DECLINED: "Declined" },
} as const;

function csvCell(value: string | null | undefined) {
  const s = value ?? "";
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: RouteContext<"/dashboard/[eventId]/guests.csv">) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { eventId } = await params;
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, include: { guests: { orderBy: { createdAt: "asc" } } } });
  if (!event) return new Response("Not found", { status: 404 });

  const rows = [
    ["Name", "Email", "Phone", "Source", "Invite", "RSVP", "Note", "Replied at", "RSVP link"],
    ...event.guests.map((g) => [
      g.name,
      g.email,
      g.phone,
      g.source === "LINK" ? "Event link" : "Invited",
      LABELS.invite[g.inviteStatus],
      LABELS.rsvp[g.rsvpStatus],
      g.note,
      g.respondedAt?.toISOString() ?? "",
      appUrl(`/i/${g.token}`),
    ]),
  ];
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-guests.csv"`,
    },
  });
}
