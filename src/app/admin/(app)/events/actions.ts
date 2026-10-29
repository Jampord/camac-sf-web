"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { parseEventForm, type EventFormState, type EventInput } from "@/lib/events/input";
import { slugBase, uniqueSlug } from "@/lib/slug";

// Server Actions are reachable by direct POST, so every action checks requireAdmin() itself.

/** Public pages (build step 2) cache event data under this tag. */
const EVENTS_TAG = "events";

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const admin = await requireAdmin();
  const parsed = await parseAndCheck(formData);
  if (!parsed.success) return parsed.state;

  const event = await createWithUniqueSlug(parsed.data, admin.id);
  updateTag(EVENTS_TAG);
  redirect(`/admin/events/${event.id}`);
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const parsed = await parseAndCheck(formData);
  if (!parsed.success) return parsed.state;

  // The slug is deliberately not updated: shared links must keep working (brief §6.1).
  await db.event.updateMany({ where: { id, deletedAt: null }, data: parsed.data });
  updateTag(EVENTS_TAG);
  refresh();
  return { saved: true };
}

export async function publishEvent(id: string) {
  await requireAdmin();
  await db.event.updateMany({
    where: { id, deletedAt: null, publishedAt: null },
    data: { publishedAt: new Date() },
  });
  updateTag(EVENTS_TAG);
  refresh();
}

export async function cancelEvent(id: string, formData: FormData) {
  await requireAdmin();
  const note = String(formData.get("cancelNote") ?? "").trim().slice(0, 200);
  await db.event.updateMany({
    where: { id, deletedAt: null, publishedAt: { not: null }, cancelledAt: null },
    data: { cancelledAt: new Date(), cancelNote: note || null },
  });
  updateTag(EVENTS_TAG);
  refresh();
}

export async function uncancelEvent(id: string) {
  await requireAdmin();
  await db.event.updateMany({
    where: { id, deletedAt: null },
    data: { cancelledAt: null, cancelNote: null },
  });
  updateTag(EVENTS_TAG);
  refresh();
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  await db.event.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  updateTag(EVENTS_TAG);
  redirect("/admin");
}

export async function restoreEvent(id: string) {
  await requireAdmin();
  await db.event.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });
  updateTag(EVENTS_TAG);
  refresh();
}

async function parseAndCheck(
  formData: FormData,
): Promise<{ success: true; data: EventInput } | { success: false; state: EventFormState }> {
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { success: false, state: { errors: parsed.errors, values: parsed.values } };
  }

  const { ministryId } = parsed.data;
  if (ministryId && !(await db.ministry.findUnique({ where: { id: ministryId } }))) {
    return {
      success: false,
      state: {
        errors: { ministryId: "Pick a ministry from the list." },
        values: Object.fromEntries(formData) as EventFormState["values"],
      },
    };
  }
  return parsed;
}

/** Slugs are set once here. Retries if a concurrent create takes the same slug. */
async function createWithUniqueSlug(data: EventInput, createdById: string) {
  const base = slugBase(data.title, data.startsAt);

  for (let attempt = 1; ; attempt++) {
    // One query for every slug sharing the base (incl. -2, -3, … and soft-deleted events),
    // instead of one round trip per suffix for repeated titles like weekly meetings.
    const existing = await db.event.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const taken = new Set(existing.map((event) => event.slug));
    const slug = await uniqueSlug(base, async (candidate) => taken.has(candidate));
    try {
      return await db.event.create({ data: { ...data, slug, createdById }, select: { id: true } });
    } catch (error) {
      const slugClash =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!slugClash || attempt >= 3) throw error;
    }
  }
}
