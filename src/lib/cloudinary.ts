import { createHash } from "node:crypto";
import { POSTER_FOLDER } from "@/lib/poster-limits";

// Cloudinary helpers for event posters (brief §5: admin-only signed uploads, JPG/PNG/WebP,
// about 5 MB). Pure functions, so they're unit-tested; the secret is only read on the server.

/**
 * Cloudinary's upload signature: SHA-1 of the params sorted by name ("a=1&b=2") followed by
 * the API secret. Every param sent with the upload must be signed, except file, cloud_name,
 * resource_type and api_key.
 */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/** True for an HTTPS image uploaded to our cloud's poster folder (nothing else is stored). */
export function isPosterUrl(url: string, cloudName: string): boolean {
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  return url.startsWith(prefix) && url.includes(`/${POSTER_FOLDER}/`);
}

/** The poster with a Cloudinary transformation, e.g. "f_auto,q_auto,w_800" for phones. */
export function posterImageUrl(url: string, transformation: string): string {
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}
