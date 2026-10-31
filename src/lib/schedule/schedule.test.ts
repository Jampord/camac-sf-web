import { describe, expect, it } from "vitest";
import type { Series } from "@/lib/events/recurrence";
import { occurrenceOn, parseScheduleDate, upcomingDates } from "./dates";
import { NAMES_MAX, parseAssignments } from "./input";
import { getService, rolesOf, SERVICES } from "./roles";

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
const sundayService = getService("sunday")!;

describe("the role list", () => {
  it("has the roles the church asked for", () => {
    expect(rolesOf(sundayService).map((role) => role.label)).toEqual([
      "Service Leader",
      "Worship Leader",
      "Devotional Leader",
      "Keyboard",
      "Guitar",
      "Bass",
      "Drums",
      "Backup Singers",
      "Teacher",
      "Assistant Teacher",
      "Dishwashers",
      "Setup",
      "Cleanup",
    ]);
    expect(rolesOf(getService("prayer")!).map((role) => role.label)).toEqual([
      "Exhorter",
      "Leader",
    ]);
  });

  it("uses each key once, since assignments are saved by date and key", () => {
    const keys = SERVICES.flatMap((service) => rolesOf(service).map((role) => role.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("doesn't know other services", () => {
    expect(getService("bible-study")).toBeUndefined();
  });
});

describe("upcomingDates", () => {
  it("lists the next 8 weeks in Manila dates, soonest first", () => {
    const dates = upcomingDates(sunday, manila("2026-11-01T06:00"));
    expect(dates).toHaveLength(8);
    expect(dates[0].date).toBe("2026-11-01");
    expect(dates[7].date).toBe("2026-12-20");
  });

  it("keeps a service listed until it has ended", () => {
    expect(upcomingDates(sunday, manila("2026-11-01T11:00"))[0].date).toBe("2026-11-01");
    expect(upcomingDates(sunday, manila("2026-11-01T12:01"))[0].date).toBe("2026-11-08");
  });

  it("marks skipped weeks instead of hiding them", () => {
    const series = { ...sunday, skipDates: [manila("2026-11-08T00:00")] };
    const dates = upcomingDates(series, manila("2026-11-01T06:00"));
    expect(dates.slice(0, 2).map((d) => d.skipped)).toEqual([false, true]);
  });

  it("uses the Manila date for a service early in the morning", () => {
    const early = {
      ...sunday,
      startsAt: manila("2026-11-01T05:00"),
      endsAt: manila("2026-11-01T06:00"),
    };
    expect(upcomingDates(early, manila("2026-11-01T04:00"))[0].date).toBe("2026-11-01");
  });
});

describe("parseScheduleDate", () => {
  it("gives the Manila midnight of a real date", () => {
    expect(parseScheduleDate("2026-11-08")).toEqual(manila("2026-11-08T00:00"));
  });

  it("rejects anything else", () => {
    for (const value of ["2026-02-31", "2026-13-01", "2026-11-08T09:00", "tomorrow", ""]) {
      expect(parseScheduleDate(value)).toBeNull();
    }
  });
});

describe("occurrenceOn", () => {
  it("finds a date the service happens on", () => {
    expect(occurrenceOn(sunday, "2026-11-08")?.startsAt).toEqual(manila("2026-11-08T09:00"));
  });

  it("refuses a day the service doesn't happen", () => {
    expect(occurrenceOn(sunday, "2026-11-09")).toBeNull();
  });

  it("refuses a skipped week, so nobody gets assigned to it", () => {
    const series = { ...sunday, skipDates: [manila("2026-11-08T00:00")] };
    expect(occurrenceOn(series, "2026-11-08")).toBeNull();
  });

  it("refuses a date after the series ended", () => {
    const series = { ...sunday, recurrenceUntil: manila("2026-11-08T23:59") };
    expect(occurrenceOn(series, "2026-11-15")).toBeNull();
  });

  it("refuses a value that isn't a date", () => {
    expect(occurrenceOn(sunday, "not-a-date")).toBeNull();
  });
});

describe("parseAssignments", () => {
  const form = (values: Record<string, string>) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) data.set(key, value);
    return data;
  };
  const names = (result: ReturnType<typeof parseAssignments>, role: string) =>
    result.ok ? result.assignments.find((a) => a.role === role)?.names : undefined;

  it("trims names and keeps several in one slot", () => {
    const result = parseAssignments(sundayService, form({ dishwashers: "  Ana, Ben " }));
    expect(names(result, "dishwashers")).toBe("Ana, Ben");
  });

  it("returns blank slots too, so clearing a name removes it", () => {
    const result = parseAssignments(sundayService, form({ keyboard: "   " }));
    expect(names(result, "keyboard")).toBe("");
    expect(names(result, "drums")).toBe("");
  });

  it("ignores fields that aren't this service's roles", () => {
    const result = parseAssignments(sundayService, form({ exhorter: "Ana", other: "Ben" }));
    expect(names(result, "exhorter")).toBeUndefined();
    expect(names(result, "other")).toBeUndefined();
  });

  it("refuses names that are too long, saying which role", () => {
    const result = parseAssignments(sundayService, form({ bass: "x".repeat(NAMES_MAX + 1) }));
    expect(result).toEqual({ ok: false, message: `Bass must be ${NAMES_MAX} characters or fewer.` });
  });
});
