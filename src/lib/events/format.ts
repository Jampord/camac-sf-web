import { formatManila, manilaDateParts, manilaMidnight } from "@/lib/time";

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

// --- Multi-day and all-day events (brief §6.1) ---

const DAY_MS = 24 * 60 * 60 * 1000; // Manila has no daylight saving, so every day is 24h

export type EventDay = { date: Date; index: number; total: number };

/**
 * Every Manila calendar day an event touches, each at that day's midnight, numbered for
 * "Day 1 of 3". An event ending exactly at midnight doesn't count the day it ends on.
 */
export function eventDays(startsAt: Date, endsAt: Date): EventDay[] {
  const first = manilaMidnight(startsAt);
  const lastMoment = endsAt > startsAt ? new Date(endsAt.getTime() - 1) : startsAt;
  const total = Math.round((manilaMidnight(lastMoment).getTime() - first.getTime()) / DAY_MS) + 1;
  return Array.from({ length: total }, (_, i) => ({
    date: new Date(first.getTime() + i * DAY_MS),
    index: i + 1,
    total,
  }));
}

type Timing = { startsAt: Date; endsAt: Date; allDay: boolean };

/** What's true on one day of an event: "Starts 9:00 AM", "All day", "Ends 3:00 PM". */
export function formatDayTimes(event: Timing, day: EventDay): string {
  if (event.allDay) return "All day";
  if (day.total === 1) return formatTimeRange(event.startsAt, event.endsAt);
  if (day.index === 1) return `Starts ${time(event.startsAt)}`;
  if (day.index === day.total) return `Ends ${time(event.endsAt)}`;
  return "All day";
}

/** The times for a whole event: "9:00 AM to 11:00 AM", "Starts 9:00 AM, ends 3:00 PM", "All day". */
export function formatTimes(startsAt: Date, endsAt: Date, allDay: boolean): string {
  if (allDay) return "All day";
  if (eventDays(startsAt, endsAt).length === 1) return formatTimeRange(startsAt, endsAt);
  return `Starts ${time(startsAt)}, ends ${time(endsAt)}`;
}

/** "Saturday, November 14, 2026" or "Saturday, November 14 to Monday, November 16, 2026". */
export function formatLongDates(startsAt: Date, endsAt: Date): string {
  const days = eventDays(startsAt, endsAt);
  const full = (d: Date) =>
    formatManila(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (days.length === 1) return full(startsAt);

  const last = days[days.length - 1].date;
  const sameYear = manilaDateParts(startsAt).year === manilaDateParts(last).year;
  const first = sameYear
    ? formatManila(startsAt, { weekday: "long", month: "long", day: "numeric" })
    : full(startsAt);
  return `${first} to ${full(last)}`;
}

/** Compact range for announcements and share cards: "Nov 14", "Nov 14–16", "Nov 30 – Dec 2". */
export function formatShortDateRange(startsAt: Date, endsAt: Date): string {
  const days = eventDays(startsAt, endsAt);
  const monthDay = (d: Date) => formatManila(d, { month: "short", day: "numeric" });
  if (days.length === 1) return monthDay(startsAt);

  const last = days[days.length - 1].date;
  const a = manilaDateParts(startsAt);
  const b = manilaDateParts(last);
  if (a.year !== b.year) {
    const withYear = (d: Date) => formatManila(d, { month: "short", day: "numeric", year: "numeric" });
    return `${withYear(startsAt)} – ${withYear(last)}`;
  }
  if (a.month !== b.month) return `${monthDay(startsAt)} – ${monthDay(last)}`;
  return `${monthDay(startsAt)}–${b.day}`;
}

/** "November 2026" */
export function formatMonthHeading(date: Date): string {
  return formatManila(date, { month: "long", year: "numeric" });
}

/** Groups items under Manila month headings, keeping the order they were given in. */
export function groupByMonth<T>(items: T[], dateOf: (item: T) => Date): [string, T[]][] {
  const months = new Map<string, T[]>();
  for (const item of items) {
    const heading = formatMonthHeading(dateOf(item));
    months.set(heading, [...(months.get(heading) ?? []), item]);
  }
  return [...months];
}
