import { formatManila, manilaDateParts } from "@/lib/time";

// Display strings for event dates, always in Manila time. The start date itself is shown by
// the date block, so these cover what's left: the times, and the end date when it differs.

const time = (date: Date) => formatManila(date, { hour: "numeric", minute: "2-digit" });

export function isSameManilaDay(a: Date, b: Date): boolean {
  const x = manilaDateParts(a);
  const y = manilaDateParts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/** "9:00 AM to 11:00 AM", or "9:00 AM to Sun, Nov 22, 3:00 PM" when it ends on another day. */
export function formatTimeRange(startsAt: Date, endsAt: Date): string {
  if (startsAt.getTime() === endsAt.getTime()) return time(startsAt);
  if (isSameManilaDay(startsAt, endsAt)) return `${time(startsAt)} to ${time(endsAt)}`;
  const endDay = formatManila(endsAt, { weekday: "short", month: "short", day: "numeric" });
  return `${time(startsAt)} to ${endDay}, ${time(endsAt)}`;
}

/** "November 2026" */
export function formatMonthHeading(date: Date): string {
  return formatManila(date, { month: "long", year: "numeric" });
}
