import { z } from "zod";

// Validates the public prayer request form (brief §6.7). Only the request is required: a name
// and contact are optional, and sharing with the congregation is off unless ticked.

export const BODY_MAX = 2000;

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => value || null);

const schema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Please write your prayer request.")
    .max(BODY_MAX, `Please keep it to ${BODY_MAX} characters or fewer.`),
  name: optionalText("Name", 120),
  contact: optionalText("Contact", 200),
  // An unticked checkbox is simply missing from FormData.
  shareConsent: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

export type PrayerInput = z.output<typeof schema>;
export type PrayerField = keyof PrayerInput;

export type ParsedPrayer =
  | { kind: "ok"; data: PrayerInput }
  | { kind: "invalid"; errors: Partial<Record<PrayerField, string>> }
  | { kind: "spam" };

/** People can't see the "website" field, so anything in it came from a bot. */
export function parsePrayerForm(formData: FormData): ParsedPrayer {
  if (String(formData.get("website") ?? "")) return { kind: "spam" };

  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const parsed = schema.safeParse({
    body: text("body") ?? "",
    name: text("name"),
    contact: text("contact"),
    shareConsent: text("shareConsent"),
  });
  if (parsed.success) return { kind: "ok", data: parsed.data };

  const errors: Partial<Record<PrayerField, string>> = {};
  for (const issue of parsed.error.issues) {
    errors[issue.path[0] as PrayerField] ??= issue.message;
  }
  return { kind: "invalid", errors };
}
