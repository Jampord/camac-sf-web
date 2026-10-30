"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { METRIC_START_KEY } from "@/lib/events/metric";
import { isManilaInput } from "@/lib/time";

// Server Actions can be called by a direct POST, so this checks requireAdmin() itself.

/** Sets (or corrects) the first day of the 4-week measurement window, a Manila date. */
export async function setMetricWindowStart(formData: FormData): Promise<void> {
  await requireAdmin();
  const value = String(formData.get("start") ?? "");
  // Date only ("2026-11-01"): the window starts at that day's midnight in Manila.
  if (value.length !== 10 || !isManilaInput(value)) return;

  await db.setting.upsert({
    where: { key: METRIC_START_KEY },
    create: { key: METRIC_START_KEY, value },
    update: { value },
  });
  refresh();
}
