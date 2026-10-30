"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { EVENTS_TAG } from "@/lib/events/public";
import { parseEventForm, type EventFormState, type EventInput } from "@/lib/events/input";
import { occurrences } from "@/lib/events/recurrence";
import { slugBase, uniqueSlug } from "@/lib/slug";
import { manilaMidnight } from "@/lib/time";

// Server Actions can be called by a direct POST, not just through our UI,
// so every action checks requireAdmin() itself.

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const admin = await requireAdmin();
  const result = await validate(formData);
  if (!result.ok) return result.state;

  const event = await createWithUniqueSlug(result.data, admin.id);
  redirect(`/admin/events/${event.id}`);
}

/** Bound to the event id on the edit page: updateEvent.bind(null, id). */
export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const result = await validate(formData);
  if (!result.ok) return result.state;

  // `data` has no slug field, so the slug can't change here: shared links keep working.
  // updateMany (not update) so a deleted or missing id is a no-op instead of an error.
  await db.event.updateMany({ where: { id, deletedAt: null }, data: result.data });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh(); // re-render the page with the saved values
  return { saved: true };
}

// Lifecycle actions (brief §6.1). Each `where` only matches an event in the right state, so
// a stale button (e.g. the event was changed in another tab) does nothing. They report
// whether anything changed so the UI can say so instead of showing a false "Published".

type LifecycleResult = { changed: boolean };

export async function publishEvent(id: string): Promise<LifecycleResult> {
  await requireAdmin();
  const { count } = await db.event.updateMany({
    where: { id, deletedAt: null, publishedAt: null },
    data: { publishedAt: new Date() },
  });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
  return { changed: count > 0 };
}

/** Cancel ≠ delete: the page stays up with a "Cancelled" banner and the optional note. */
export async function cancelEvent(id: string, note: string): Promise<LifecycleResult> {
  await requireAdmin();
  const cancelNote = note.trim().slice(0, 200) || null;
  const { count } = await db.event.updateMany({
    where: { id, deletedAt: null, publishedAt: { not: null }, cancelledAt: null },
    data: { cancelledAt: new Date(), cancelNote },
  });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
  return { changed: count > 0 };
}

export async function uncancelEvent(id: string): Promise<LifecycleResult> {
  await requireAdmin();
  const { count } = await db.event.updateMany({
    where: { id, deletedAt: null, cancelledAt: { not: null } },
    data: { cancelledAt: null, cancelNote: null },
  });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
  return { changed: count > 0 };
}

/**
 * Soft delete: sets deletedAt only, restorable for PURGE_AFTER_DAYS. No refresh() here: the
 * client navigates away, and refreshing the edit page first would flash a 404.
 */
export async function deleteEvent(id: string): Promise<LifecycleResult> {
  await requireAdmin();
  const { count } = await db.event.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  updateTag(EVENTS_TAG);
  return { changed: count > 0 };
}

export async function restoreEvent(id: string): Promise<LifecycleResult> {
  await requireAdmin();
  const { count } = await db.event.updateMany({
    where: { id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
  return { changed: count > 0 };
}

/**
 * Skip one week of a weekly event, or bring it back (brief §6.1: e.g. no prayer meeting in
 * Holy Week). `weekStartsAt` is that week's start time as an ISO string.
 */
export async function setWeekSkipped(
  id: string,
  weekStartsAt: string,
  skip: boolean,
): Promise<LifecycleResult> {
  await requireAdmin();
  const event = await db.event.findFirst({
    where: { id, deletedAt: null, recurrence: "WEEKLY" },
    select: { startsAt: true, endsAt: true, recurrence: true, recurrenceUntil: true, skipDates: true },
  });
  if (!event) return { changed: false };

  // Only accept a date that really is one of this series' weeks.
  const week = new Date(weekStartsAt);
  const isWeek = occurrences(event, week, week, { includeSkipped: true }).some(
    (o) => o.startsAt.getTime() === week.getTime(),
  );
  if (!isWeek) return { changed: false };

  const day = manilaMidnight(week).getTime();
  const others = event.skipDates.filter((d) => d.getTime() !== day);
  const skipDates = skip ? [...others, new Date(day)] : others;
  if (skipDates.length === event.skipDates.length) return { changed: false };

  await db.event.update({ where: { id }, data: { skipDates } });
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
  return { changed: true };
}

type Validated = { ok: true; data: EventInput } | { ok: false; state: EventFormState };

/** Form rules from parseEventForm, plus the one check that needs the database. */
async function validate(formData: FormData): Promise<Validated> {
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { ok: false, state: { errors: parsed.errors, values: parsed.values } };
  }

  const { ministryId } = parsed.data;
  if (ministryId && !(await db.ministry.findUnique({ where: { id: ministryId } }))) {
    return {
      ok: false,
      state: {
        errors: { ministryId: "Pick a ministry from the list." },
        values: Object.fromEntries(formData) as EventFormState["values"],
      },
    };
  }
  return { ok: true, data: parsed.data };
}

/** The slug is set once, here, and never changed (brief §6.1). */
async function createWithUniqueSlug(data: EventInput, createdById: string) {
  const base = slugBase(data.title, data.startsAt);

  for (let attempt = 1; ; attempt++) {
    // One query for every slug sharing this base ("x", "x-2", "x-3", incl. deleted events).
    const existing = await db.event.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const taken = new Set(existing.map((event) => event.slug));
    const slug = await uniqueSlug(base, async (candidate) => taken.has(candidate));

    try {
      return await db.event.create({ data: { ...data, slug, createdById }, select: { id: true } });
    } catch (error) {
      // Someone else took the same slug between our check and insert: try again.
      const slugTaken =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!slugTaken || attempt >= 3) throw error;
    }
  }
}
