import { manilaMidnight } from "@/lib/time";
import { eventDays, type EventDay } from "./format";
import { nextOccurrence, occurrences, type Series } from "./recurrence";

// How the public agenda is laid out (brief §6.2):
//   - This week: the next 7 days, everything in it, weekly services included.
//   - Every week: each weekly service once, with the weeks it's skipped.
//   - Later: special (one-off) events only, so they aren't buried under Sundays.
// Multi-day events appear on every day they span (brief §6.1).

export type AgendaEvent = Series & { id: string; allDay: boolean };

/** One row of the agenda: one day of one occurrence of an event. */
export type AgendaEntry<E extends AgendaEvent = AgendaEvent> = {
  event: E;
  startsAt: Date;
  endsAt: Date;
  day: EventDay;
};

export type WeeklySummary<E extends AgendaEvent = AgendaEvent> = {
  event: E;
  next: Date;
  skipped: Date[]; // upcoming skipped weeks, by their would-be start time
};

const DAY_MS = 24 * 60 * 60 * 1000; // Manila has no daylight saving, so every day is 24h
const THIS_WEEK_DAYS = 7;
// Skipped weeks are shown this far ahead (brief §6.2: at least 3 months).
const SKIPS_AHEAD_DAYS = 13 * 7;
const NO_LIMIT = new Date(8.64e15);

export function buildAgenda<E extends AgendaEvent>(events: E[], now: Date) {
  const today = manilaMidnight(now);
  const weekEnd = new Date(today.getTime() + THIS_WEEK_DAYS * DAY_MS);

  const entries: AgendaEntry<E>[] = events
    // Weekly services only need this week's dates; one-off events show however far ahead.
    .flatMap((event) =>
      occurrences(event, now, event.recurrence === "WEEKLY" ? weekEnd : NO_LIMIT).map(
        (occurrence) => ({ event, ...occurrence }),
      ),
    )
    // A retreat that already started shows from today's day onwards.
    .flatMap(({ event, startsAt, endsAt }) =>
      eventDays(startsAt, endsAt)
        .filter((day) => day.date >= today)
        .map((day) => ({ event, startsAt, endsAt, day })),
    )
    .sort((a, b) => entryTime(a) - entryTime(b));

  const skipsUntil = new Date(today.getTime() + SKIPS_AHEAD_DAYS * DAY_MS);
  const weekly: WeeklySummary<E>[] = events
    .filter((event) => event.recurrence === "WEEKLY")
    .flatMap((event) => {
      const next = nextOccurrence(event, now);
      if (!next) return []; // the series has ended
      const skipped = occurrences(event, now, skipsUntil, { includeSkipped: true })
        .filter((o) => o.skipped)
        .map((o) => o.startsAt);
      return [{ event, next: next.startsAt, skipped }];
    })
    .sort((a, b) => a.next.getTime() - b.next.getTime());

  return {
    thisWeek: entries.filter((e) => e.day.date < weekEnd),
    weekly,
    later: entries.filter((e) => e.day.date >= weekEnd && e.event.recurrence !== "WEEKLY"),
  };
}

/** Order within a day: ongoing multi-day events (from midnight) first, then by start time. */
function entryTime({ startsAt, day }: AgendaEntry): number {
  return day.index === 1 ? startsAt.getTime() : day.date.getTime();
}

export type LiveStatus = { kind: "now" } | { kind: "soon"; label: string } | null;

const SOON_MS = 3 * 60 * 60 * 1000;

/** "Happening now", "Starts in 45 minutes", or nothing, for one agenda row at `now`. */
export function liveStatus(entry: AgendaEntry, now: Date): LiveStatus {
  const isToday = entry.day.date.getTime() === manilaMidnight(now).getTime();
  if (!isToday) return null;
  if (entry.startsAt <= now && now < entry.endsAt) return { kind: "now" };

  const untilStart = entry.startsAt.getTime() - now.getTime();
  if (entry.day.index !== 1 || entry.event.allDay || untilStart <= 0 || untilStart > SOON_MS) {
    return null;
  }
  const minutes = Math.max(1, Math.round(untilStart / 60_000));
  if (minutes < 60) return { kind: "soon", label: `Starts in ${plural(minutes, "minute")}` };
  return { kind: "soon", label: `Starts in ${plural(Math.round(minutes / 60), "hour")}` };
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
