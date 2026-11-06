import { describe, expect, it } from "vitest";
import { landingAgenda } from "./landing";

// Friday, Oct 30, 2026, 10:00 AM Manila = 02:00 UTC.
const now = new Date("2026-10-30T02:00:00Z");
const at = (iso: string) => new Date(iso);

const event = (id: string, startsAt: string, endsAt: string, extra = {}) => ({
  id,
  startsAt: at(startsAt),
  endsAt: at(endsAt),
  allDay: false,
  recurrence: "NONE" as "NONE" | "WEEKLY",
  recurrenceUntil: null,
  skipDates: [],
  cancelledAt: null as Date | null,
  ...extra,
});

// Prayer Meeting: Wednesdays 6:30 PM. Sunday Service: Sundays 9:00 AM. Created in that order.
const prayer = event("prayer", "2026-10-07T10:30:00Z", "2026-10-07T12:00:00Z", { recurrence: "WEEKLY" });
const sunday = event("sunday", "2026-10-04T01:00:00Z", "2026-10-04T04:00:00Z", { recurrence: "WEEKLY" });

describe("landingAgenda", () => {
  it("lists the weekly services Sunday first", () => {
    const { services } = landingAgenda([prayer, sunday], now);
    expect(services.map((s) => s.id)).toEqual(["sunday", "prayer"]);
  });

  it("leaves out a cancelled weekly service", () => {
    const { services } = landingAgenda([{ ...prayer, cancelledAt: at("2026-10-20T00:00:00Z") }, sunday], now);
    expect(services.map((s) => s.id)).toEqual(["sunday"]);
  });

  it("shows only the next three special events, soonest first, never the weekly ones", () => {
    const specials = [
      event("christmas", "2026-12-20T09:00:00Z", "2026-12-20T11:00:00Z"),
      event("thanksgiving", "2026-11-29T01:00:00Z", "2026-11-29T04:00:00Z"),
      event("fellowship", "2026-11-03T10:00:00Z", "2026-11-03T12:00:00Z"),
      event("new-year", "2026-12-31T12:00:00Z", "2026-12-31T16:00:00Z"),
    ];
    const { comingUp } = landingAgenda([sunday, prayer, ...specials], now);
    expect(comingUp.map((e) => e.event.id)).toEqual(["fellowship", "thanksgiving", "christmas"]);
  });

  it("shows a multi-day event once, and skips cancelled events", () => {
    const camp = event("camp", "2026-12-04T00:00:00Z", "2026-12-06T07:00:00Z"); // Fri to Sun
    const cancelled = event("cancelled", "2026-11-10T10:00:00Z", "2026-11-10T12:00:00Z", {
      cancelledAt: at("2026-10-20T00:00:00Z"),
    });
    const { comingUp } = landingAgenda([camp, cancelled], now);
    expect(comingUp.map((e) => [e.event.id, e.day.index])).toEqual([["camp", 1]]);
  });
});
