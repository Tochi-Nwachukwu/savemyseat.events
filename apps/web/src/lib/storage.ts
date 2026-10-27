import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

// Declared in neon.ts with public_read access, so images load in email clients.
const BUCKET = "invitations";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function publicBaseUrl() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint) throw new Error("AWS_ENDPOINT_URL_S3 is not set (run `neon env pull`)");
  return `${endpoint.replace(/\/$/, "")}/${BUCKET}`;
}

let files: Files | undefined;

// Credentials and region come from the AWS_* vars Neon injects.
function storage() {
  return (files ??= new Files({ adapter: neon({ bucket: BUCKET, publicBaseUrl: publicBaseUrl() }) }));
}

/** Permanent public URL for a key stored on an Event. */
export function imageUrl(key: string) {
  return `${publicBaseUrl()}/${key}`;
}

/** Uploads an invitation image under a fresh key and returns that key. */
export async function uploadInvitationImage(eventId: string, file: File) {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WebP or GIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 10 MB or smaller.");

  // New key per upload, so cached copies never go stale.
  const key = `events/${eventId}/${crypto.randomUUID()}.${ext}`;
  await storage().upload(key, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000, immutable",
  });
  return key;
}

export async function deleteImage(key: string) {
  await storage().delete(key);
}
