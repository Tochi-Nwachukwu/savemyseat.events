// Top-level paths the app already uses, so they can't be event pages.
const RESERVED = new Set([
  "new", "login", "logout", "signup", "dashboard", "api", "i", "e", "ui", "admin", "settings", "account",
  "about", "help", "terms", "privacy", "pricing", "app", "www", "mail", "static", "assets", "_next",
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** Returns an error message, or null when the slug is usable. */
export function slugProblem(slug: string) {
  if (slug.length < 3) return "Use at least 3 characters.";
  if (!SLUG_PATTERN.test(slug)) return "Use lowercase letters, numbers and dashes.";
  if (RESERVED.has(slug)) return "That address is reserved. Try another.";
  return null;
}
