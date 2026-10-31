import { occurrences, type Series } from "@/lib/events/recurrence";
import { manilaInputToUtc, manilaMidnight, utcToManilaInput } from "@/lib/time";

// Which dates can be scheduled. They come from the weekly event, so moving a service to another
// day or skipping a week carries over here on its own.

const DAY_MS = 24 * 60 * 60 * 1000;
export const SCHEDULE_WEEKS = 8;

export type ScheduleDate = { date: string; startsAt: Date; skipped: boolean };

/** The service's next dates, soonest first. Skipped weeks are included and marked. */
export function upcomingDates(series: Series, now: Date): ScheduleDate[] {
  const horizon = new Date(now.getTime() + SCHEDULE_WEEKS * 7 * DAY_MS);
  return occurrences(series, now, horizon, { includeSkipped: true })
    .slice(0, SCHEDULE_WEEKS)
    .map(({ startsAt, skipped }) => ({
      date: utcToManilaInput(startsAt).slice(0, 10),
      startsAt,
      skipped,
    }));
}

/** The Manila midnight of a "YYYY-MM-DD" value, or null if it isn't a real calendar date. */
export function parseScheduleDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  try {
    const midnight = manilaInputToUtc(date);
    // Date quietly rolls "02-31" over to March, so make sure it comes back unchanged.
    return utcToManilaInput(midnight).slice(0, 10) === date ? midnight : null;
  } catch {
    return null;
  }
}

/** The service's occurrence on a date, if it has one and that week isn't skipped. */
export function occurrenceOn(series: Series, date: string) {
  const midnight = parseScheduleDate(date);
  if (!midnight) return null;
  const endOfDay = new Date(midnight.getTime() + DAY_MS - 1);
  return (
    occurrences(series, midnight, endOfDay).find(
      ({ startsAt }) => manilaMidnight(startsAt).getTime() === midnight.getTime(),
    ) ?? null
  );
}
