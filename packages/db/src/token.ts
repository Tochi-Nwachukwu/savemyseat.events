import { randomBytes } from "node:crypto";

/** Unguessable, URL-safe token for a guest's personal RSVP link. */
export function newGuestToken() {
  return randomBytes(18).toString("base64url");
}
