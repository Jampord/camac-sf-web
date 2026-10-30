"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { CHURCH_ADDRESS_KEY } from "@/lib/events/address";
import { EVENTS_TAG, PRIVACY_CONTACT_KEY } from "@/lib/events/public";

// Server Actions can be called by a direct POST, so each one checks requireAdmin() itself.

/** Saves a text setting, or removes it when left blank, and refreshes the public pages. */
async function saveSetting(key: string, raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim().slice(0, 300);
  if (value) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  } else {
    await db.setting.deleteMany({ where: { key } });
  }
  updateTag(EVENTS_TAG); // public pages show the change right away
  refresh();
}

/** Saves the church's street address, used for every event marked "At the church venue". */
export async function setChurchAddress(formData: FormData): Promise<void> {
  await requireAdmin();
  await saveSetting(CHURCH_ADDRESS_KEY, formData.get("address"));
}

/** Saves who people can ask about their prayer requests, named on the /privacy page. */
export async function setPrivacyContact(formData: FormData): Promise<void> {
  await requireAdmin();
  await saveSetting(PRIVACY_CONTACT_KEY, formData.get("contact"));
}
