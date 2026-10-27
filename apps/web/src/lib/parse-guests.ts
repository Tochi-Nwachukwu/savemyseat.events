const EMAIL = /[^\s<>,;"'()]+@[^\s<>,;"'()]+\.[a-z]{2,}/i;

export type ParsedGuest = { name: string | null; email: string };

/**
 * Accepts pasted lists like:
 *   ada@example.com, tunde@example.com
 *   Grace Kim <grace@example.com>
 *   Chidi Okafor chidi@example.com
 */
export function parseGuestList(raw: string) {
  const guests: ParsedGuest[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const chunk of raw.split(/[\n;,]+/)) {
    const text = chunk.trim();
    if (!text) continue;
    const match = text.match(EMAIL);
    if (!match) {
      invalid.push(text);
      continue;
    }
    const email = match[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const name = text
      .replace(match[0], "")
      .replace(/[<>"']/g, "")
      .replace(/\s+/g, " ")
      .trim();
    guests.push({ name: name || null, email });
  }
  return { guests, invalid };
}
