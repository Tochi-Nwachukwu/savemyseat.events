import { prisma } from "@savemyseat/db";
import { buildIcs } from "@/lib/calendar";
import { appUrl } from "@/lib/urls";

export async function GET(_req: Request, { params }: RouteContext<"/[slug]/calendar.ics">) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return new Response("Not found", { status: 404 });

  const ics = buildIcs({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    description: `${event.title}\n${appUrl(`/${event.slug}`)}`,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
