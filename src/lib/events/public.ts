import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CHURCH_ADDRESS_KEY } from "./address";

// Data for the public pages. Cached so a visit doesn't query the database; admin actions call
// updateTag(EVENTS_TAG) after any change visitors can see, which refreshes it immediately.
//
// Deliberately time-free: "what's upcoming" depends on the current time, so pages filter these
// results per request (after connection()) instead of baking `now` into the cache.

export const EVENTS_TAG = "events";

/** Every published, non-deleted event, soonest first. Cancelled ones stay (brief §6.1). */
export async function getPublishedEvents() {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("hours");

  return db.event.findMany({
    where: { publishedAt: { not: null }, deletedAt: null },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      recurrence: true,
      recurrenceUntil: true,
      skipDates: true,
      venue: true,
      atChurchVenue: true,
      cancelledAt: true,
      cancelNote: true,
      ministryId: true,
      ministry: { select: { name: true } },
    },
  });
}

export type PublicEvent = Awaited<ReturnType<typeof getPublishedEvents>>[number];

/** One published, non-deleted event by its slug, or null (drafts and deleted events -> 404). */
export async function getPublishedEventBySlug(slug: string) {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("hours");

  return db.event.findFirst({
    where: { slug, publishedAt: { not: null }, deletedAt: null },
    select: {
      slug: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      recurrence: true,
      recurrenceUntil: true,
      skipDates: true,
      venue: true,
      atChurchVenue: true,
      contactPerson: true,
      attire: true,
      posterUrl: true,
      cancelledAt: true,
      cancelNote: true,
      venueAddress: true,
      updatedAt: true, // versions the share card URL
      ministry: { select: { name: true } },
    },
  });
}

/** Setting row holding the church contact named on /privacy. */
export const PRIVACY_CONTACT_KEY = "privacyContact";

/** Who to ask about a prayer request, or null until an admin enters it. Saving updates the tag. */
export async function getPrivacyContact(): Promise<string | null> {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("days");

  const setting = await db.setting.findUnique({ where: { key: PRIVACY_CONTACT_KEY } });
  return setting?.value || null;
}

/** The church street address admins entered, or null until they do. Saving it updates the tag. */
export async function getChurchAddress(): Promise<string | null> {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("days");

  const setting = await db.setting.findUnique({ where: { key: CHURCH_ADDRESS_KEY } });
  return setting?.value || null;
}

/** Ministries change only through the seed script, so they can be cached for days. */
export async function getMinistries() {
  "use cache";
  cacheLife("days");

  return db.ministry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
