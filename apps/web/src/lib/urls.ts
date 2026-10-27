export function appUrl(path = "") {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

/** "savemyseat.events/joseph", for display. */
export function displayEventUrl(slug: string) {
  return `${appUrl().replace(/^https?:\/\//, "")}/${slug}`;
}
