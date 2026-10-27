type CalendarEvent = {
  id: string;
  title: string;
  startsAt: Date;
  venueName: string;
  venueAddress: string | null;
  description: string;
};

const DEFAULT_HOURS = 3;

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

export function location(event: Pick<CalendarEvent, "venueName" | "venueAddress">) {
  return [event.venueName, event.venueAddress].filter(Boolean).join(", ");
}

export function buildIcs(event: CalendarEvent) {
  const end = new Date(event.startsAt.getTime() + DEFAULT_HOURS * 3600_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SaveMySeat//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@savemyseat.events`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText(location(event))}`,
    `DESCRIPTION:${icsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function googleCalendarUrl(event: CalendarEvent) {
  const end = new Date(event.startsAt.getTime() + DEFAULT_HOURS * 3600_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsDate(event.startsAt)}/${icsDate(end)}`,
    location: location(event),
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function mapsUrl(event: Pick<CalendarEvent, "venueName" | "venueAddress">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location(event))}`;
}
