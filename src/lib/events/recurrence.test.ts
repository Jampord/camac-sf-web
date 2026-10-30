import { describe, expect, it } from "vitest";
import { describeRepeat, nextOccurrence, occurrences, type Series } from "./recurrence";

// Manila time is UTC+8.
const manila = (isoLocal: string) => new Date(`${isoLocal}+08:00`);

// Sunday service, 9:00 AM to 12:00 PM, starting Sunday Nov 1, 2026.
const sunday: Series = {
  startsAt: manila("2026-11-01T09:00"),
  endsAt: manila("2026-11-01T12:00"),
  recurrence: "WEEKLY",
  recurrenceUntil: null,
  skipDates: [],
};

const starts = (list: { startsAt: Date }[]) => list.map((o) => o.startsAt.toISOString());

describe("occurrences", () => {
  it("repeats every 7 days at the same time", () => {
    const list = occurrences(sunday, manila("2026-11-01T00:00"), manila("2026-11-22T23:59"));
    expect(starts(list)).toEqual([
      manila("2026-11-01T09:00").toISOString(),
      manila("2026-11-08T09:00").toISOString(),
      manila("2026-11-15T09:00").toISOString(),
      manila("2026-11-22T09:00").toISOString(),
    ]);
    expect(list[1].endsAt).toEqual(manila("2026-11-08T12:00"));
  });

  it("starts from the first week still going at `from`", () => {
    // Nov 8 at 10 AM: that Sunday's service is still on, so it's included.
    const list = occurrences(sunday, manila("2026-11-08T10:00"), manila("2026-11-15T23:59"));
    expect(starts(list)).toEqual([
      manila("2026-11-08T09:00").toISOString(),
      manila("2026-11-15T09:00").toISOString(),
    ]);
  });

  it("stops after the 'repeat until' date (inclusive)", () => {
    const until = { ...sunday, recurrenceUntil: manila("2026-11-15T23:59") };
    expect(occurrences(until, manila("2026-11-01T00:00"), manila("2026-12-31T00:00"))).toHaveLength(3);
  });

  it("leaves out skipped weeks unless asked to include them", () => {
    const skipping = { ...sunday, skipDates: [manila("2026-11-08T00:00")] };
    const from = manila("2026-11-01T00:00");
    const to = manila("2026-11-15T23:59");
    expect(starts(occurrences(skipping, from, to))).toEqual([
      manila("2026-11-01T09:00").toISOString(),
      manila("2026-11-15T09:00").toISOString(),
    ]);
    const all = occurrences(skipping, from, to, { includeSkipped: true });
    expect(all.map((o) => o.skipped)).toEqual([false, true, false]);
  });

  it("returns a one-off event once, if it's in range", () => {
    const once: Series = { ...sunday, recurrence: "NONE" };
    expect(occurrences(once, manila("2026-10-01T00:00"), manila("2026-12-01T00:00"))).toHaveLength(1);
    expect(occurrences(once, manila("2026-11-02T00:00"), manila("2026-12-01T00:00"))).toHaveLength(0);
  });
});

describe("nextOccurrence", () => {
  it("is the next week not yet over, skipping skipped weeks", () => {
    const skipping = { ...sunday, skipDates: [manila("2026-11-08T00:00")] };
    expect(nextOccurrence(skipping, manila("2026-11-01T13:00"))?.startsAt).toEqual(
      manila("2026-11-15T09:00"),
    );
  });

  it("is the event itself for a one-off event that hasn't ended, however far ahead", () => {
    const farAhead: Series = {
      ...sunday,
      recurrence: "NONE",
      startsAt: manila("2030-01-06T09:00"),
      endsAt: manila("2030-01-06T12:00"),
    };
    expect(nextOccurrence(farAhead, manila("2026-11-01T00:00"))?.startsAt).toEqual(
      manila("2030-01-06T09:00"),
    );
    expect(nextOccurrence(farAhead, manila("2030-01-06T13:00"))).toBeNull();
  });

  it("is null once a series has ended", () => {
    const until = { ...sunday, recurrenceUntil: manila("2026-11-08T23:59") };
    expect(nextOccurrence(until, manila("2026-11-09T00:00"))).toBeNull();
  });
});

describe("describeRepeat", () => {
  it("names the Manila weekday", () => {
    expect(describeRepeat(sunday)).toBe("Every Sunday");
    // Tue 23:30 UTC is already Wednesday in Manila.
    expect(describeRepeat({ ...sunday, startsAt: new Date("2026-11-03T23:30:00Z") })).toBe(
      "Every Wednesday",
    );
  });
});
