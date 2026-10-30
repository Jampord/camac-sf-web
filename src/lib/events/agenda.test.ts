import { describe, expect, it } from "vitest";
import { buildAgenda, liveStatus, type AgendaEvent } from "./agenda";

// Friday, Oct 30, 2026, 10:00 AM Manila = 02:00 UTC.
const now = new Date("2026-10-30T02:00:00Z");
const at = (iso: string) => new Date(iso);

const event = (id: string, extra: Partial<AgendaEvent> = {}): AgendaEvent => ({
  id,
  startsAt: at("2026-11-02T01:00:00Z"), // Mon Nov 2, 9:00 AM
  endsAt: at("2026-11-02T03:00:00Z"),
  allDay: false,
  recurrence: "NONE",
  recurrenceUntil: null,
  skipDates: [],
  ...extra,
});

// Sunday Service: Sundays 9:00 AM to 12:00 PM, first one Oct 4.
const sundays = event("sunday", {
  startsAt: at("2026-10-04T01:00:00Z"),
  endsAt: at("2026-10-04T04:00:00Z"),
  recurrence: "WEEKLY",
});

describe("buildAgenda", () => {
  it("puts the next 7 days in this week, weekly services included", () => {
    const { thisWeek } = buildAgenda([event("special"), sundays], now);
    expect(thisWeek.map((e) => e.event.id)).toEqual(["sunday", "special"]); // Sun Nov 1, Mon Nov 2
  });

  it("lists only special events after this week", () => {
    const later = event("anniversary", {
      startsAt: at("2026-11-29T01:00:00Z"),
      endsAt: at("2026-11-29T04:00:00Z"),
    });
    const agenda = buildAgenda([later, sundays], now);
    expect(agenda.later.map((e) => e.event.id)).toEqual(["anniversary"]);
  });

  it("summarizes each weekly service once, with its upcoming skipped weeks", () => {
    const skipped = { ...sundays, skipDates: [at("2026-11-21T16:00:00Z")] }; // Sun Nov 22
    const { weekly } = buildAgenda([skipped, event("special")], now);
    expect(weekly).toHaveLength(1);
    expect(weekly[0].event.id).toBe("sunday");
    expect(weekly[0].skipped).toEqual([at("2026-11-22T01:00:00Z")]);
  });

  it("drops a weekly service that has ended", () => {
    const ended = { ...sundays, recurrenceUntil: at("2026-10-20T00:00:00Z") };
    const agenda = buildAgenda([ended], now);
    expect(agenda.weekly).toEqual([]);
    expect(agenda.thisWeek).toEqual([]);
  });

  it("shows a multi-day event on each of its days, split across the week boundary", () => {
    // Thu Nov 5 to Sat Nov 7: Nov 5 is in this week (Oct 30 to Nov 5), the rest is later.
    const retreat = event("retreat", {
      startsAt: at("2026-11-05T01:00:00Z"),
      endsAt: at("2026-11-07T07:00:00Z"),
    });
    const agenda = buildAgenda([retreat], now);
    expect(agenda.thisWeek.map((e) => e.day.index)).toEqual([1]);
    expect(agenda.later.map((e) => e.day.index)).toEqual([2, 3]);
  });
});

describe("liveStatus", () => {
  const entryFor = (e: AgendaEvent) => buildAgenda([e], now).thisWeek[0];

  it("is happening now between start and end", () => {
    const service = event("now", { startsAt: at("2026-10-30T01:00:00Z"), endsAt: at("2026-10-30T04:00:00Z") });
    expect(liveStatus(entryFor(service), now)).toEqual({ kind: "now" });
  });

  it("starts soon within 3 hours, in minutes or hours", () => {
    const in45 = event("a", { startsAt: at("2026-10-30T02:45:00Z"), endsAt: at("2026-10-30T04:00:00Z") });
    const in2h = event("b", { startsAt: at("2026-10-30T04:10:00Z"), endsAt: at("2026-10-30T05:00:00Z") });
    const in1h = event("c", { startsAt: at("2026-10-30T03:00:00Z"), endsAt: at("2026-10-30T05:00:00Z") });
    expect(liveStatus(entryFor(in45), now)).toEqual({ kind: "soon", label: "Starts in 45 minutes" });
    expect(liveStatus(entryFor(in2h), now)).toEqual({ kind: "soon", label: "Starts in 2 hours" });
    expect(liveStatus(entryFor(in1h), now)).toEqual({ kind: "soon", label: "Starts in 1 hour" });
    const in1m = event("d", { startsAt: at("2026-10-30T02:01:00Z"), endsAt: at("2026-10-30T03:00:00Z") });
    expect(liveStatus(entryFor(in1m), now)).toEqual({ kind: "soon", label: "Starts in 1 minute" });
  });

  it("is nothing special further out", () => {
    const tonight = event("x", { startsAt: at("2026-10-30T11:00:00Z"), endsAt: at("2026-10-30T12:00:00Z") });
    expect(liveStatus(entryFor(tonight), now)).toBeNull();
  });

  it("is happening now on today's day of a multi-day event", () => {
    const camp = event("camp", { startsAt: at("2026-10-29T01:00:00Z"), endsAt: at("2026-10-31T07:00:00Z") });
    expect(liveStatus(entryFor(camp), now)).toEqual({ kind: "now" });
  });

  it("is happening now all day for an all-day event today", () => {
    const fair = event("fair", {
      allDay: true,
      startsAt: at("2026-10-29T16:00:00Z"), // Oct 30, 12:00 AM Manila
      endsAt: at("2026-10-30T16:00:00Z"),
    });
    expect(liveStatus(entryFor(fair), now)).toEqual({ kind: "now" });
  });
});
