// Event times are stored in UTC and shown in the event's own IANA time zone.

/** Milliseconds `timeZone` is ahead of UTC at the given instant. */
function tzOffset(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
}

/** "2026-12-09" + "13:00" in America/New_York → the UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const wallClock = Date.UTC(y, m - 1, d, hh, mm);
  // Second pass corrects for a DST change between the guess and the answer.
  const first = wallClock - tzOffset(wallClock, timeZone);
  return new Date(wallClock - tzOffset(first, timeZone));
}

/** Inverse of zonedToUtc, for pre-filling edit forms. */
export function utcToZoned(instant: Date, timeZone: string) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  );
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    instant,
  );
  return { date, time };
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "Wednesday, December 9, 2026" */
export function formatEventDate(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "full" }).format(instant);
}

/** "1:00 PM EST" */
export function formatEventTime(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(
    instant,
  );
}

/** "Dec 1" */
export function formatShortDate(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).format(instant);
}

/** "3 days ago", "just now" */
export function timeAgo(instant: Date, now = Date.now()) {
  const seconds = Math.round((instant.getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
