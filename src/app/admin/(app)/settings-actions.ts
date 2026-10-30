"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { CHURCH_ADDRESS_KEY } from "@/lib/events/address";
import { EVENTS_TAG } from "@/lib/events/public";

// Server Actions can be called by a direct POST, so this checks requireAdmin() itself.

/** Saves the church's street address, used for every event marked "At the church venue". */
export async function setChurchAddress(formData: FormData): Promise<void> {
  await requireAdmin();
  const value = String(formData.get("address") ?? "").trim().slice(0, 300);

  if (value) {
    await db.setting.upsert({
      where: { key: CHURCH_ADDRESS_KEY },
      create: { key: CHURCH_ADDRESS_KEY, value },
      update: { value },
    });
  } else {
    await db.setting.deleteMany({ where: { key: CHURCH_ADDRESS_KEY } });
  }
  updateTag(EVENTS_TAG); // event pages show the new address right away
  refresh();
}
