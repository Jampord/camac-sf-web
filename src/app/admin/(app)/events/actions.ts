"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { parseEventForm, type EventFormState, type EventInput } from "@/lib/events/input";
import { slugBase, uniqueSlug } from "@/lib/slug";

// Server Actions can be called by a direct POST, not just through our UI,
// so every action checks requireAdmin() itself.

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const admin = await requireAdmin();

  const parsed = parseEventForm(formData);
  if (!parsed.success) return { errors: parsed.errors, values: parsed.values };

  const { ministryId } = parsed.data;
  if (ministryId && !(await db.ministry.findUnique({ where: { id: ministryId } }))) {
    return {
      errors: { ministryId: "Pick a ministry from the list." },
      values: Object.fromEntries(formData) as EventFormState["values"],
    };
  }

  await createWithUniqueSlug(parsed.data, admin.id);
  // Milestone 4 changes this to the new event's edit page.
  redirect("/admin");
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
