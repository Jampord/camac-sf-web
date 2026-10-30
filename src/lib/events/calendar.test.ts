import { describe, expect, it } from "vitest";
import { googleCalendarUrl, icsFile, type CalendarEvent } from "./calendar";

const url = "https://camac-sf-web.vercel.app/events/church-anniversary";
// Friday, Oct 30, 2026, 10:00 AM Manila.
const now = new Date("2026-10-30T02:00:00Z");

const anniversary: CalendarEvent = {
  slug: "church-anniversary",
  title: "43rd Church Anniversary",
  description: "Theme: “Rooting & Reaching”; bring a dish, if you can.",
  venue: "Church",
  startsAt: new Date("2026-11-29T01:00:00Z"), // Sun Nov 29, 9:00 AM Manila
  endsAt: new Date("2026-11-29T04:00:00Z"),
  allDay: false,
  recurrence: "NONE",
  recurrenceUntil: null,
  skipDates: [],
  cancelledAt: null,
  updatedAt: new Date("2026-10-20T05:06:07Z"),
};

// Sundays 9:00 AM to 12:00 PM, first one Oct 4, until Dec 27 (11:59 PM Manila), Nov 22 skipped.
const sundays: CalendarEvent = {
  ...anniversary,
  slug: "sunday-service",
  title: "Sunday Service",
  description: null,
  startsAt: new Date("2026-10-04T01:00:00Z"),
  endsAt: new Date("2026-10-04T04:00:00Z"),
  recurrence: "WEEKLY",
  recurrenceUntil: new Date("2026-12-27T15:59:00Z"),
  skipDates: [new Date("2026-11-21T16:00:00Z")], // Manila midnight of Nov 22
};

const lines = (ics: string) => ics.split("\r\n");

describe("icsFile", () => {
  it("is a calendar with one event, CRLF line endings and Manila times", () => {
    const ics = icsFile(anniversary, url, now)!;
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(lines(ics)).toEqual(
      expect.arrayContaining([
        "BEGIN:VEVENT",
        "UID:church-anniversary@camac-sf-web",
        "DTSTART;TZID=Asia/Manila:20261129T090000",
        "DTEND;TZID=Asia/Manila:20261129T120000",
        "SUMMARY:43rd Church Anniversary",
        "LOCATION:Church",
        `URL:${url}`,
        "END:VEVENT",
      ]),
    );
    expect(ics).toContain("TZID:Asia/Manila");
  });

  it("escapes commas, semicolons and line breaks in text", () => {
    const ics = icsFile({ ...anniversary, description: "Line one\nLine two; a, b" }, url, now)!;
    // Long lines are folded, so unfold before looking.
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:Line one\\nLine two\\; a\\, b\\n\\nDetails: ${url}`);
  });

  it("folds lines longer than 75 bytes, counting UTF-8 bytes", () => {
    const long = { ...anniversary, description: "Salamat sa Diyos ✝ ".repeat(20) };
    for (const line of lines(icsFile(long, url, now)!)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("uses whole dates for all-day events, ending the day after the last day", () => {
    const retreat = {
      ...anniversary,
      allDay: true,
      startsAt: new Date("2026-11-19T16:00:00Z"), // Fri Nov 20, 12:00 AM Manila
      endsAt: new Date("2026-11-22T15:59:00Z"), // Sun Nov 22, 11:59 PM Manila
    };
    const ics = lines(icsFile(retreat, url, now)!);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261120");
    expect(ics).toContain("DTEND;VALUE=DATE:20261123");
  });

  it("adds a weekly series from its next date, with the rule and skipped weeks", () => {
    const ics = lines(icsFile(sundays, url, now)!);
    expect(ics).toContain("DTSTART;TZID=Asia/Manila:20261101T090000"); // next Sunday, not Oct 4
    expect(ics).toContain("DTEND;TZID=Asia/Manila:20261101T120000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20261227T155900Z");
    expect(ics).toContain("EXDATE;TZID=Asia/Manila:20261122T090000");
  });

  it("leaves out UNTIL for a series with no end", () => {
    const ics = lines(icsFile({ ...sundays, recurrenceUntil: null }, url, now)!);
    expect(ics).toContain("RRULE:FREQ=WEEKLY");
  });

  it("marks a cancelled event as cancelled", () => {
    const ics = lines(icsFile({ ...anniversary, cancelledAt: new Date() }, url, now)!);
    expect(ics).toContain("STATUS:CANCELLED");
  });

  it("returns null once the event (or series) is over", () => {
    expect(icsFile(anniversary, url, new Date("2026-12-01T00:00:00Z"))).toBeNull();
    expect(icsFile(sundays, url, new Date("2027-01-01T00:00:00Z"))).toBeNull();
  });
});

describe("googleCalendarUrl", () => {
  const params = (href: string) => new URL(href).searchParams;

  it("pre-fills a one-off event in UTC", () => {
    const p = params(googleCalendarUrl(anniversary, url, now)!);
    expect(p.get("action")).toBe("TEMPLATE");
    expect(p.get("text")).toBe("43rd Church Anniversary");
    expect(p.get("dates")).toBe("20261129T010000Z/20261129T040000Z");
    expect(p.get("location")).toBe("Church");
    expect(p.get("details")).toContain(url);
    expect(p.get("ctz")).toBe("Asia/Manila");
    expect(p.has("recur")).toBe(false);
  });

  it("uses whole dates for all-day events", () => {
    const retreat = {
      ...anniversary,
      allDay: true,
      startsAt: new Date("2026-11-19T16:00:00Z"),
      endsAt: new Date("2026-11-22T15:59:00Z"),
    };
    expect(params(googleCalendarUrl(retreat, url, now)!).get("dates")).toBe("20261120/20261123");
  });

  it("adds a weekly series from its next date with the repeat rule", () => {
    const p = params(googleCalendarUrl(sundays, url, now)!);
    expect(p.get("dates")).toBe("20261101T010000Z/20261101T040000Z");
    expect(p.get("recur")).toBe("RRULE:FREQ=WEEKLY;UNTIL=20261227T155900Z");
  });

  it("returns null once the event is over", () => {
    expect(googleCalendarUrl(anniversary, url, new Date("2026-12-01T00:00:00Z"))).toBeNull();
  });
});
