import { manilaDateParts, manilaMidnight, utcToManilaInput } from "@/lib/time";
import { eventDays } from "./format";
import { nextOccurrence, type Series } from "./recurrence";

// Add to calendar (brief §6.5): an .ics file (RFC 5545) and a Google Calendar link.
// Weekly events add the whole series, starting from the next date rather than the first one,
// so nobody's calendar fills with past Sundays.
// - .ics: times are Manila wall-clock (TZID=Asia/Manila), skipped weeks are EXDATEs.
// - Google: the link only documents RRULE in `recur`, so skipped weeks can't be left out
//   there; the event page lists them ("Not on …").

export type CalendarEvent = Series & {
  slug: string;
  title: string;
  description: string | null;
  venue: string;
  allDay: boolean;
  cancelledAt: Date | null;
  updatedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000; // Manila has no daylight saving, so every day is 24h

/** "20261129T090000": Manila wall-clock time. */
const manilaStamp = (date: Date) => utcToManilaInput(date).replace(/[-:]/g, "") + "00";
/** "20261129T010000Z": UTC. */
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
/** "20261129": the Manila calendar date. */
const dateStamp = (date: Date) => {
  const { year, month, day } = manilaDateParts(date);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
};

/** The dates to add: the next occurrence (whole series for weekly), or null once it's over. */
function upcoming(event: CalendarEvent, now: Date) {
  const next = nextOccurrence(event, now);
  if (!next) return null;
  const days = eventDays(next.startsAt, next.endsAt);
  // All-day ends are exclusive in both formats: the day after the last day.
  const endDate = new Date(days[days.length - 1].date.getTime() + DAY_MS);
  const rule =
    event.recurrence === "WEEKLY"
      ? `FREQ=WEEKLY${event.recurrenceUntil ? `;UNTIL=${utcStamp(event.recurrenceUntil)}` : ""}`
      : null;
  return { startsAt: next.startsAt, endsAt: next.endsAt, endDate, rule };
}

function details(event: CalendarEvent, url: string): string {
  const description = event.description?.trim();
  return `${description ? `${description}\n\n` : ""}Details: ${url}`;
}

// --- .ics ---

const escapeText = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Splits a line into 75-byte pieces (RFC 5545 §3.1), never inside a UTF-8 character. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The .ics file for an event, or null once it (or its whole series) is over. */
export function icsFile(event: CalendarEvent, url: string, now: Date): string | null {
  const when = upcoming(event, now);
  if (!when) return null;

  const timing = event.allDay
    ? [`DTSTART;VALUE=DATE:${dateStamp(when.startsAt)}`, `DTEND;VALUE=DATE:${dateStamp(when.endDate)}`]
    : [
        `DTSTART;TZID=Asia/Manila:${manilaStamp(when.startsAt)}`,
        `DTEND;TZID=Asia/Manila:${manilaStamp(when.endsAt)}`,
      ];

  // A skipped week's date is its Manila midnight; the excluded start is that day at the
  // series' usual time.
  const timeOfDay = event.startsAt.getTime() - manilaMidnight(event.startsAt).getTime();
  const skipped = when.rule
    ? event.skipDates
        .map((day) => new Date(day.getTime() + timeOfDay))
        .filter((start) => start >= when.startsAt)
        .map((start) =>
          event.allDay
            ? `EXDATE;VALUE=DATE:${dateStamp(start)}`
            : `EXDATE;TZID=Asia/Manila:${manilaStamp(start)}`,
        )
    : [];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CAMAC San Fernando//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // The Philippines has no daylight saving: one fixed rule.
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Manila",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0800",
    "TZOFFSETTO:+0800",
    "TZNAME:PHT",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    // Same UID on every download, so re-adding updates the event instead of duplicating it.
    // Slugs never change once an event is created (src/lib/slug.ts).
    `UID:${event.slug}@camac-sf-web`,
    `DTSTAMP:${utcStamp(now)}`,
    `LAST-MODIFIED:${utcStamp(event.updatedAt)}`,
    `SEQUENCE:${Math.max(0, Math.floor((event.updatedAt.getTime() - Date.UTC(2026, 0, 1)) / 1000))}`,
    ...timing,
    ...(when.rule ? [`RRULE:${when.rule}`] : []),
    ...skipped,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.venue)}`,
    `DESCRIPTION:${escapeText(details(event, url))}`,
    `URL:${url}`,
    ...(event.cancelledAt ? ["STATUS:CANCELLED"] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

// --- Google Calendar ---

/** An "add to Google Calendar" link, or null once the event (or its series) is over. */
export function googleCalendarUrl(event: CalendarEvent, url: string, now: Date): string | null {
  const when = upcoming(event, now);
  if (!when) return null;

  const dates = event.allDay
    ? `${dateStamp(when.startsAt)}/${dateStamp(when.endDate)}`
    : `${utcStamp(when.startsAt)}/${utcStamp(when.endsAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: details(event, url),
    location: event.venue,
    ctz: "Asia/Manila",
  });
  if (when.rule) params.set("recur", `RRULE:${when.rule}`);
  return `https://calendar.google.com/calendar/render?${params}`;
}
