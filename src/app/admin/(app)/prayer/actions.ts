"use server";

import { refresh } from "next/cache";
import { requirePrayerTeam } from "@/lib/dal";
import { db } from "@/lib/db";
import { isPrayerStatus } from "@/lib/prayer/status";

// Server Actions can be called by a direct POST, so each one checks requirePrayerTeam() itself:
// being an admin isn't enough to touch prayer requests.

type Result = { changed: boolean };

export async function setPrayerStatus(id: string, status: unknown): Promise<Result> {
  await requirePrayerTeam();
  if (!isPrayerStatus(status)) return { changed: false };
  const { count } = await db.prayerRequest.updateMany({ where: { id }, data: { status } });
  refresh();
  return { changed: count > 0 };
}

/** Kept requests aren't auto-deleted after a year (brief §6.7). */
export async function setKeepAsTestimony(id: string, keep: boolean): Promise<Result> {
  await requirePrayerTeam();
  const { count } = await db.prayerRequest.updateMany({
    where: { id },
    data: { keepAsTestimony: keep === true },
  });
  refresh();
  return { changed: count > 0 };
}

/** Permanent, with no undo: this is how a "please remove my request" (see /privacy) is honoured. */
export async function deletePrayerRequest(id: string): Promise<Result> {
  await requirePrayerTeam();
  const { count } = await db.prayerRequest.deleteMany({ where: { id } });
  refresh();
  return { changed: count > 0 };
}
