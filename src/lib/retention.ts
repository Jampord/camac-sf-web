import { timingSafeEqual } from "node:crypto";
import { PURGE_AFTER_DAYS } from "@/lib/events/status";

// What the daily cleanup job removes (brief §6.7, §6.1). If these change, change the wording on
// /privacy and the form's notice too: they promise these numbers to people.

const DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_PRAYERS_AFTER_DAYS = 60;
const DELETE_PRAYERS_AFTER_DAYS = 365;

export function cleanupCutoffs(now: Date) {
  const ago = (ms: number) => new Date(now.getTime() - ms);
  return {
    archivePrayersBefore: ago(ARCHIVE_PRAYERS_AFTER_DAYS * DAY_MS),
    deletePrayersBefore: ago(DELETE_PRAYERS_AFTER_DAYS * DAY_MS),
    purgeEventsDeletedBefore: ago(PURGE_AFTER_DAYS * DAY_MS),
    // Only the last hour counts toward the limit. Running daily, nothing lives past about a day.
    deleteRateLimitHitsBefore: ago(60 * 60 * 1000),
  };
}

/** Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". No secret set means nobody gets in. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
