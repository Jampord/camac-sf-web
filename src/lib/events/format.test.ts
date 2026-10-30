import { describe, expect, it } from "vitest";
import { formatMonthHeading, formatTimeRange, isSameManilaDay } from "./format";

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
