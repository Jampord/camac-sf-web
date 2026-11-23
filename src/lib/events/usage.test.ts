import { describe, expect, it } from "vitest";
import { usageSince, usageTotals, type StatCount, type UsageEvent } from "./usage";

describe("usageSince", () => {
  it("goes back 30 days from now", () => {
    const now = new Date("2026-11-30T04:00:00Z");
    expect(usageSince(now)).toEqual(new Date("2026-10-31T04:00:00Z"));
  });
});

const oneOff = (id: string, extra: Partial<UsageEvent> = {}): UsageEvent => ({
  id,
  recurrence: "NONE",
  publishedAt: new Date("2026-10-01T00:00:00Z"),
  ...extra,
});

describe("usageTotals", () => {
  it("counts one-off published events with at least one open", () => {
    const events = [oneOff("a"), oneOff("b"), oneOff("c")];
    const counts: StatCount[] = [
      { eventId: "a", type: "VIEW", count: 20 },
      { eventId: "b", type: "VIEW", count: 10 },
      { eventId: "c", type: "COPY", count: 2 }, // copied but never opened: not shared
    ];
    expect(usageTotals(events, counts)).toEqual({
      eventsShared: 2,
      averageOpens: 15,
      copies: 2,
      shares: 0,
    });
  });

  it("leaves out weekly series and drafts", () => {
    const events = [
      oneOff("series", { recurrence: "WEEKLY" }),
      oneOff("draft", { publishedAt: null }),
      oneOff("ok"),
    ];
    const counts: StatCount[] = [
      { eventId: "series", type: "VIEW", count: 100 },
      { eventId: "series", type: "SHARE", count: 9 },
      { eventId: "draft", type: "VIEW", count: 50 },
      { eventId: "ok", type: "VIEW", count: 4 },
      { eventId: "ok", type: "SHARE", count: 1 },
    ];
    const usage = usageTotals(events, counts);
    expect(usage.eventsShared).toBe(1);
    expect(usage.averageOpens).toBe(4);
    expect(usage.shares).toBe(1);
  });

  it("ignores counts for events it wasn't given (e.g. deleted ones)", () => {
    const usage = usageTotals([oneOff("a")], [
      { eventId: "a", type: "VIEW", count: 3 },
      { eventId: "gone", type: "VIEW", count: 30 },
    ]);
    expect(usage.eventsShared).toBe(1);
    expect(usage.averageOpens).toBe(3);
  });

  it("rounds the average to one decimal", () => {
    const usage = usageTotals([oneOff("a"), oneOff("b"), oneOff("c")], [
      { eventId: "a", type: "VIEW", count: 1 },
      { eventId: "b", type: "VIEW", count: 1 },
      { eventId: "c", type: "VIEW", count: 2 },
    ]);
    expect(usage.averageOpens).toBe(1.3);
  });

  it("averages to 0 with nothing shared yet", () => {
    expect(usageTotals([oneOff("a")], [])).toMatchObject({ eventsShared: 0, averageOpens: 0 });
  });
});
