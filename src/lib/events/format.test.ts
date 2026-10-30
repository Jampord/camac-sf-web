import { describe, expect, it } from "vitest";
import {
  eventDays,
  formatDayTimes,
  formatLongDates,
  formatMonthHeading,
  formatShortDateRange,
  formatTimeRange,
  formatTimes,
  groupByMonth,
  isSameManilaDay,
} from "./format";

describe("groupByMonth", () => {
  it("groups by Manila month in the given order", () => {
    const items = [
      { id: "a", at: new Date("2026-11-20T01:00:00Z") },
      { id: "b", at: new Date("2026-11-30T17:00:00Z") }, // Dec 1 in Manila
      { id: "c", at: new Date("2026-12-05T01:00:00Z") },
    ];
    const grouped = groupByMonth(items, (item) => item.at).map(([month, group]) => [
      month,
      group.map((item) => item.id),
    ]);
    expect(grouped).toEqual([
      ["November 2026", ["a"]],
      ["December 2026", ["b", "c"]],
    ]);
  });
});

// 9:00 AM Manila = 01:00 UTC.
const fri9am = new Date("2026-11-20T01:00:00Z");

describe("formatTimeRange", () => {
  it("shows start and end time for a same-day event", () => {
    expect(formatTimeRange(fri9am, new Date("2026-11-20T03:00:00Z"))).toBe("9:00 AM to 11:00 AM");
  });

  it("shows a single time when start equals end", () => {
    expect(formatTimeRange(fri9am, fri9am)).toBe("9:00 AM");
  });

  it("adds the end date for a multi-day event", () => {
    expect(formatTimeRange(fri9am, new Date("2026-11-22T07:00:00Z"))).toBe(
      "9:00 AM to Sun, Nov 22, 3:00 PM",
    );
  });
});

describe("isSameManilaDay", () => {
  it("compares Manila calendar days, not UTC ones", () => {
    // 23:30 UTC on the 19th is already 7:30 AM on the 20th in Manila.
    expect(isSameManilaDay(new Date("2026-11-19T23:30:00Z"), fri9am)).toBe(true);
    expect(isSameManilaDay(new Date("2026-11-19T15:00:00Z"), fri9am)).toBe(false);
  });
});

describe("formatMonthHeading", () => {
  it("uses the Manila month", () => {
    // Nov 30, 17:00 UTC is Dec 1 in Manila.
    expect(formatMonthHeading(new Date("2026-11-30T17:00:00Z"))).toBe("December 2026");
  });
});

// Manila time is UTC+8, so "Nov 14, 9:00 AM Manila" is 01:00 UTC that day.
const manila = (isoLocal: string) => new Date(`${isoLocal}+08:00`);

describe("eventDays", () => {
  it("is one day for a same-day event", () => {
    const days = eventDays(manila("2026-11-14T09:00"), manila("2026-11-14T11:00"));
    expect(days.map((d) => [d.index, d.total])).toEqual([[1, 1]]);
  });

  it("lists every Manila day a multi-day event spans, at Manila midnight", () => {
    const days = eventDays(manila("2026-11-14T09:00"), manila("2026-11-16T15:00"));
    expect(days).toEqual([
      { date: manila("2026-11-14T00:00"), index: 1, total: 3 },
      { date: manila("2026-11-15T00:00"), index: 2, total: 3 },
      { date: manila("2026-11-16T00:00"), index: 3, total: 3 },
    ]);
  });

  it("doesn't count the next day when an event ends exactly at midnight", () => {
    const days = eventDays(manila("2026-11-14T20:00"), manila("2026-11-15T00:00"));
    expect(days).toHaveLength(1);
  });

  it("handles all-day events stored as midnight to 11:59 PM", () => {
    const days = eventDays(manila("2026-11-30T00:00"), manila("2026-12-02T23:59"));
    expect(days.map((d) => d.index)).toEqual([1, 2, 3]);
  });
});

describe("formatDayTimes", () => {
  const start = manila("2026-11-14T09:00");
  const end = manila("2026-11-16T15:00");

  it("says what's true on each day of a timed multi-day event", () => {
    const [first, middle, last] = eventDays(start, end);
    expect(formatDayTimes({ startsAt: start, endsAt: end, allDay: false }, first)).toBe("Starts 9:00 AM");
    expect(formatDayTimes({ startsAt: start, endsAt: end, allDay: false }, middle)).toBe("All day");
    expect(formatDayTimes({ startsAt: start, endsAt: end, allDay: false }, last)).toBe("Ends 3:00 PM");
  });

  it("is 'All day' for all-day events and the time range for single-day ones", () => {
    const [day] = eventDays(start, manila("2026-11-14T11:00"));
    expect(formatDayTimes({ startsAt: start, endsAt: end, allDay: true }, day)).toBe("All day");
    expect(
      formatDayTimes({ startsAt: start, endsAt: manila("2026-11-14T11:00"), allDay: false }, day),
    ).toBe("9:00 AM to 11:00 AM");
  });
});

describe("formatTimes", () => {
  it("covers single-day, all-day and multi-day events", () => {
    const start = manila("2026-11-14T09:00");
    expect(formatTimes(start, manila("2026-11-14T11:00"), false)).toBe("9:00 AM to 11:00 AM");
    expect(formatTimes(start, manila("2026-11-16T15:00"), false)).toBe("Starts 9:00 AM, ends 3:00 PM");
    expect(formatTimes(manila("2026-11-14T00:00"), manila("2026-11-16T23:59"), true)).toBe("All day");
  });
});

describe("formatLongDates", () => {
  it("is one date for a single day and a range otherwise", () => {
    expect(formatLongDates(manila("2026-11-14T09:00"), manila("2026-11-14T11:00"))).toBe(
      "Saturday, November 14, 2026",
    );
    expect(formatLongDates(manila("2026-11-14T09:00"), manila("2026-11-16T15:00"))).toBe(
      "Saturday, November 14 to Monday, November 16, 2026",
    );
    expect(formatLongDates(manila("2026-12-31T00:00"), manila("2027-01-01T23:59"))).toBe(
      "Thursday, December 31, 2026 to Friday, January 1, 2027",
    );
  });
});

describe("formatShortDateRange", () => {
  it("compacts ranges the way the announcements will (brief §6.1)", () => {
    expect(formatShortDateRange(manila("2026-11-14T09:00"), manila("2026-11-14T11:00"))).toBe("Nov 14");
    expect(formatShortDateRange(manila("2026-11-14T09:00"), manila("2026-11-16T15:00"))).toBe("Nov 14–16");
    expect(formatShortDateRange(manila("2026-11-30T09:00"), manila("2026-12-02T15:00"))).toBe(
      "Nov 30 – Dec 2",
    );
    expect(formatShortDateRange(manila("2026-12-30T09:00"), manila("2027-01-02T15:00"))).toBe(
      "Dec 30, 2026 – Jan 2, 2027",
    );
  });
});
