import { describe, expect, it } from "vitest";
import { metricWindow, successMetric, type MetricEvent, type StatCount } from "./metric";

// Nov 1, 2026, 12:00 AM Manila = Oct 31, 16:00 UTC.
const start = new Date("2026-10-31T16:00:00Z");
const DAY = 86_400_000;

describe("metricWindow", () => {
  it("runs 4 weeks from the start date", () => {
    const window = metricWindow(start, new Date(start.getTime() + 3 * DAY));
    expect(window.end).toEqual(new Date(start.getTime() + 28 * DAY));
    expect(window.state).toBe("running");
    expect(window.day).toBe(4);
  });

  it("is upcoming before the start and ended after 28 days", () => {
    expect(metricWindow(start, new Date(start.getTime() - 1)).state).toBe("upcoming");
    expect(metricWindow(start, new Date(start.getTime() + 28 * DAY)).state).toBe("ended");
  });
});

const oneOff = (id: string, extra: Partial<MetricEvent> = {}): MetricEvent => ({
  id,
  recurrence: "NONE",
  publishedAt: new Date("2026-10-01T00:00:00Z"),
  ...extra,
});

describe("successMetric", () => {
  it("counts one-off published events with at least one open", () => {
    const events = [oneOff("a"), oneOff("b"), oneOff("c")];
    const counts: StatCount[] = [
      { eventId: "a", type: "VIEW", count: 20 },
      { eventId: "b", type: "VIEW", count: 10 },
      { eventId: "c", type: "COPY", count: 2 }, // copied but never opened: not shared
    ];
    const metric = successMetric(events, counts);
    expect(metric.eventsShared).toBe(2);
    expect(metric.averageOpens).toBe(15);
    expect(metric.copies).toBe(2);
    expect(metric.shares).toBe(0);
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
    const metric = successMetric(events, counts);
    expect(metric.eventsShared).toBe(1);
    expect(metric.averageOpens).toBe(4);
    expect(metric.shares).toBe(1);
  });

  it("ignores counts for events it wasn't given (e.g. deleted ones)", () => {
    const metric = successMetric([oneOff("a")], [
      { eventId: "a", type: "VIEW", count: 3 },
      { eventId: "gone", type: "VIEW", count: 30 },
    ]);
    expect(metric.eventsShared).toBe(1);
    expect(metric.averageOpens).toBe(3);
  });

  it("reports the goal: at least 8 events averaging 15+ opens", () => {
    const events = Array.from({ length: 8 }, (_, i) => oneOff(`e${i}`));
    const opens = (n: number): StatCount[] =>
      events.map((e) => ({ eventId: e.id, type: "VIEW", count: n }));
    expect(successMetric(events, opens(15)).goalMet).toBe(true);
    expect(successMetric(events, opens(14)).goalMet).toBe(false);
    expect(successMetric(events.slice(0, 7), opens(40)).goalMet).toBe(false);
  });

  it("averages to 0 with nothing shared yet", () => {
    const metric = successMetric([oneOff("a")], []);
    expect(metric).toMatchObject({ eventsShared: 0, averageOpens: 0, goalMet: false });
  });
});
