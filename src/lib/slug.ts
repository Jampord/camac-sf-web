import { manilaDateParts } from "./time";

// Slugs are generated once at creation and never changed on edit, so shared links don't break
// (brief §6.1). Format: title + Manila month/year, e.g. "youth-camp-2027-04".

const MAX_TITLE_LENGTH = 60;

export function slugBase(title: string, startsAt: Date): string {
  const titlePart =
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // strip accents: "Niño" -> "Nino"
      .toLowerCase()
      .replace(/['’]/g, "") // "Women's" -> "womens"
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, MAX_TITLE_LENGTH)
      .replace(/^-+|-+$/g, "") || "event";

  const { year, month } = manilaDateParts(startsAt);
  return `${titlePart}-${year}-${String(month).padStart(2, "0")}`;
}

/** Appends -2, -3, … until `isTaken` says the slug is free. */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) return base;
  for (let suffix = 2; ; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
}
