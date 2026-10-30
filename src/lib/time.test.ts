import { describe, expect, it } from "vitest";
import {
  formatManila,
  isManilaInput,
  manilaDateParts,
  manilaInputToUtc,
  manilaWeekday,
  utcToManilaInput,
} from "./time";

describe("manilaInputToUtc", () => {
  it("treats datetime-local input as Manila time (UTC+8)", () => {
    expect(manilaInputToUtc("2027-04-10T09:00").toISOString()).toBe("2027-04-10T01:00:00.000Z");
  });

  it("crosses back to the previous UTC day for early-morning Manila times", () => {
    expect(manilaInputToUtc("2027-01-01T06:30").toISOString()).toBe("2026-12-31T22:30:00.000Z");
  });

  it("treats a date-only input as Manila midnight", () => {
    expect(manilaInputToUtc("2026-11-14").toISOString()).toBe("2026-11-13T16:00:00.000Z");
  });

  it("rejects malformed input", () => {
    expect(() => manilaInputToUtc("14/11/2026")).toThrow();
    expect(() => manilaInputToUtc("2026-13-40")).toThrow();
  });
});

describe("isManilaInput", () => {
  it("accepts datetime-local values and rejects anything else", () => {
    expect(isManilaInput("2027-04-10T09:00")).toBe(true);
    expect(isManilaInput("")).toBe(false);
    expect(isManilaInput("tomorrow")).toBe(false);
  });
});

describe("manilaDateParts", () => {
  it("returns the Manila calendar date, not the UTC one", () => {
    // 2026-11-30T17:00Z is already Dec 1 in Manila.
    expect(manilaDateParts(new Date("2026-11-30T17:00:00Z"))).toEqual({
      year: 2026,
      month: 12,
      day: 1,
    });
  });
});

describe("utcToManilaInput", () => {
  it("renders a UTC instant as a Manila datetime-local value", () => {
    expect(utcToManilaInput(new Date("2026-12-31T22:30:00Z"))).toBe("2027-01-01T06:30");
  });

  it("round-trips with manilaInputToUtc", () => {
    expect(utcToManilaInput(manilaInputToUtc("2027-04-10T19:45"))).toBe("2027-04-10T19:45");
  });
});

describe("manilaWeekday", () => {
  it("returns the Manila day of the week, with Sunday as 0", () => {
    // Sat 2026-11-21 16:30 UTC is Sun Nov 22, 00:30 in Manila.
    expect(manilaWeekday(new Date("2026-11-21T16:30:00Z"))).toBe(0);
    expect(manilaWeekday(new Date("2026-11-20T01:00:00Z"))).toBe(5);
  });
});

describe("formatManila", () => {
  it("formats in Manila time regardless of the server time zone", () => {
    const text = formatManila(new Date("2026-11-15T01:00:00Z"), {
      hour: "numeric",
      minute: "2-digit",
    });
    expect(text).toMatch(/9:00/);
  });
});
