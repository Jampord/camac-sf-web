"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parsePrayerForm, type PrayerField } from "@/lib/prayer/input";
import { clientIp } from "@/lib/rate-limit";
import { isRateLimited } from "@/lib/rate-limit-check";

// Public form, no login (brief §6.7). Loose limit: several people may share the church Wi-Fi.
const LIMIT_PER_HOUR = 10;

export type PrayerFormState = {
  sent?: boolean;
  message?: string;
  errors?: Partial<Record<PrayerField, string>>;
};

export async function submitPrayerRequest(
  _prev: PrayerFormState,
  formData: FormData,
): Promise<PrayerFormState> {
  const parsed = parsePrayerForm(formData);
  // A bot that filled the honeypot sees success, so it has no reason to try something else.
  if (parsed.kind === "spam") return { sent: true };
  if (parsed.kind === "invalid") return { errors: parsed.errors };

  if (await isRateLimited(clientIp(await headers()), "prayer", LIMIT_PER_HOUR)) {
    return { message: "Please try again in a few minutes." };
  }

  await db.prayerRequest.create({ data: parsed.data });
  return { sent: true };
}
