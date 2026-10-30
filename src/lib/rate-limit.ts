import { createHmac } from "node:crypto";

// Loose per-IP rate limit for public forms (brief §6.7). The address itself is never stored,
// only a keyed hash of it, and a daily cron deletes the rows.

/** The visitor's address as reported by the host (Vercel sets these headers). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Keyed, so a leaked table can't be reversed by hashing every possible address. */
export function hashIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`rate-limit:${ip}`).digest("hex");
}
