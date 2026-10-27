import type { Event, Guest, User } from "@savemyseat/db";
import { formatEventDate, formatEventTime, formatShortDate } from "./datetime";
import { type EmailMessage, emailLayout, escapeHtml, fromName } from "./email";
import { imageUrl } from "./storage";
import { appUrl } from "./urls";
import { location, mapsUrl } from "./calendar";

type InviteEvent = Pick<
  Event,
  "title" | "honoreeName" | "subtitle" | "venueName" | "venueAddress" | "startsAt" | "timezone" | "message" | "imageKey" | "rsvpDeadline"
>;
type InviteGuest = Pick<Guest, "name" | "email" | "token">;
type Host = Pick<User, "name" | "email">;

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

function details(event: InviteEvent) {
  return [
    { label: "Date", value: formatEventDate(event.startsAt, event.timezone) },
    { label: "Time", value: formatEventTime(event.startsAt, event.timezone) },
    { label: "Where", value: location(event), href: mapsUrl(event) },
  ];
}

/** Invitation or reminder for one guest. */
export function invitationEmail(event: InviteEvent, guest: InviteGuest, host: Host, kind: "invite" | "reminder"): EmailMessage {
  const rsvpUrl = appUrl(`/i/${guest.token}`);
  const greeting = guest.name ? `Hi ${firstName(guest.name)}, ` : "";
  const deadline = event.rsvpDeadline ? ` by ${formatShortDate(event.rsvpDeadline, event.timezone)}` : "";
  const hostName = host.name || event.honoreeName;

  const body =
    kind === "invite"
      ? `${greeting}you're invited to ${event.title}. Please let us know if you can make it${deadline}.`
      : `${greeting}just a friendly reminder to RSVP for ${event.title}${deadline}. It only takes a tap.`;

  const messageHtml = event.message
    ? `<br><br><span style="color:#1f1d33">“${escapeHtml(event.message)}”</span><br>— ${escapeHtml(hostName)}`
    : "";

  return {
    from: fromName(hostName),
    to: guest.email,
    replyTo: host.email,
    subject: kind === "invite" ? `You're invited: ${event.title}` : `Reminder: RSVP for ${event.title}`,
    html: emailLayout({
      preheader: `${formatEventDate(event.startsAt, event.timezone)} · ${event.venueName}`,
      eyebrow: kind === "invite" ? "You're invited" : "Friendly reminder",
      imageUrl: event.imageKey ? imageUrl(event.imageKey) : null,
      imageAlt: `Invitation for ${event.title}`,
      heading: event.title,
      subheading: [event.honoreeName, event.subtitle].filter(Boolean).join(" · "),
      bodyHtml: escapeHtml(body) + messageHtml,
      details: details(event),
      cta: { label: "RSVP now", url: rsvpUrl },
      footnote: `This link is just for you. Questions? Reply to this email to reach ${hostName}.`,
    }),
    text: [
      body,
      event.message ? `\n"${event.message}"\n— ${hostName}` : "",
      "",
      `When: ${formatEventDate(event.startsAt, event.timezone)}, ${formatEventTime(event.startsAt, event.timezone)}`,
      `Where: ${location(event)}`,
      "",
      `RSVP here: ${rsvpUrl}`,
    ].join("\n"),
  };
}

/** Sent to the guest after they reply. */
export function rsvpConfirmationEmail(event: InviteEvent, guest: InviteGuest, host: Host, attending: boolean): EmailMessage {
  const rsvpUrl = appUrl(`/i/${guest.token}`);
  const hostName = host.name || event.honoreeName;
  return {
    from: fromName(hostName),
    to: guest.email,
    replyTo: host.email,
    subject: attending ? `You're on the list for ${event.title}` : `Thanks for letting us know`,
    html: emailLayout({
      eyebrow: attending ? "See you there" : "RSVP received",
      heading: attending ? "You're on the list!" : "Sorry you can't make it",
      body: attending
        ? `Your seat is saved for ${event.title}. Here are the details for your calendar.`
        : `We've let ${hostName} know you can't make it to ${event.title}. Plans change? You can update your RSVP any time.`,
      details: attending ? details(event) : undefined,
      cta: { label: attending ? "View invitation" : "Change my RSVP", url: rsvpUrl },
    }),
    text: attending
      ? `Your seat is saved for ${event.title}.\nWhen: ${formatEventDate(event.startsAt, event.timezone)}, ${formatEventTime(event.startsAt, event.timezone)}\nWhere: ${location(event)}\n\n${rsvpUrl}`
      : `We've let ${hostName} know you can't make it. Change your RSVP: ${rsvpUrl}`,
  };
}
