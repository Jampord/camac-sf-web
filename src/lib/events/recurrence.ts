import { formatManila, manilaMidnight } from "@/lib/time";

// Weekly recurrence (brief §6.1): a series is ONE stored row; its weekly occurrences are worked
// out when needed, minus skipDates. No custom rules and no per-week edits, on purpose.
// skipDates hold the Manila midnight of each skipped week's date.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // Manila has no daylight saving, so every week is 7 x 24h

export type Series = {
  startsAt: Date;
  endsAt: Date;
  recurrence: "NONE" | "WEEKLY";
  recurrenceUntil: Date | null;
  skipDates: Date[];
};

export type Occurrence = { startsAt: Date; endsAt: Date; skipped: boolean };

/** The event's occurrences that are still going at `from` and start by `to`, soonest first. */
export function occurrences(
  series: Series,
  from: Date,
  to: Date,
  { includeSkipped = false }: { includeSkipped?: boolean } = {},
): Occurrence[] {
  const duration = series.endsAt.getTime() - series.startsAt.getTime();

  if (series.recurrence !== "WEEKLY") {
    const inRange = series.endsAt >= from && series.startsAt <= to;
    return inRange ? [{ startsAt: series.startsAt, endsAt: series.endsAt, skipped: false }] : [];
  }

  const skipped = new Set(series.skipDates.map((d) => d.getTime()));
  // Jump straight to the first week whose occurrence hasn't ended by `from`.
  const firstWeek = Math.max(0, Math.ceil((from.getTime() - series.endsAt.getTime()) / WEEK_MS));
  const result: Occurrence[] = [];

  for (let week = firstWeek; ; week++) {
    const startsAt = new Date(series.startsAt.getTime() + week * WEEK_MS);
    if (startsAt > to) break;
    if (series.recurrenceUntil && startsAt > series.recurrenceUntil) break;

    const isSkipped = skipped.has(manilaMidnight(startsAt).getTime());
    if (isSkipped && !includeSkipped) continue;
    result.push({ startsAt, endsAt: new Date(startsAt.getTime() + duration), skipped: isSkipped });
  }
  return result;
}

/** The next occurrence that hasn't ended yet, or null when the series is over. */
export function nextOccurrence(series: Series, now: Date): Occurrence | null {
  if (series.recurrence !== "WEEKLY") {
    return series.endsAt >= now
      ? { startsAt: series.startsAt, endsAt: series.endsAt, skipped: false }
      : null;
  }
  // Two years is far beyond anything a skip list would cover.
  const horizon = new Date(now.getTime() + 104 * WEEK_MS);
  return occurrences(series, now, horizon)[0] ?? null;
}

/** "Every Sunday" (the Manila weekday of the first occurrence). */
export function describeRepeat(series: Pick<Series, "startsAt">): string {
  return `Every ${formatManila(series.startsAt, { weekday: "long" })}`;
}
