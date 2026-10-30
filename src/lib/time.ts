// Store UTC, display in Asia/Manila; admin date/time inputs are Manila time (brief §5).
// The Philippines has no daylight saving time, so Manila is always UTC+08:00.

export const CHURCH_TIME_ZONE = "Asia/Manila";
const MANILA_OFFSET = "+08:00";

const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

/**
 * Converts a Manila wall-clock value from a form input ("2027-04-10T09:00" from
 * datetime-local, or "2027-04-10" from date) to a UTC Date.
 */
export function manilaInputToUtc(value: string): Date {
  const match = INPUT_PATTERN.exec(value.trim());
  if (!match) throw new Error(`Invalid date/time input: "${value}"`);
  const [, year, month, day, hour = "00", minute = "00"] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00${MANILA_OFFSET}`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time input: "${value}"`);
  return date;
}

/** True if `value` is a well-formed Manila date/time input that manilaInputToUtc accepts. */
export function isManilaInput(value: string): boolean {
  try {
    manilaInputToUtc(value);
    return true;
  } catch {
    return false;
  }
}

/** The Manila calendar date of an instant. */
export function manilaDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHURCH_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Day of the week in Manila: 0 = Sunday … 6 = Saturday. */
export function manilaWeekday(date: Date): number {
  const { year, month, day } = manilaDateParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Formats an instant in Manila time, e.g. formatManila(d, { weekday: "short" }). */
export function formatManila(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-PH", { ...options, timeZone: CHURCH_TIME_ZONE }).format(date);
}
