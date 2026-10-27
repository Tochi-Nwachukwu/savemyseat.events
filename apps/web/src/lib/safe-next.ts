/** Only allow same-site relative redirects like "/dashboard". */
export function safeNext(next: string | string[] | undefined, fallback = "/dashboard") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
