import { describe, expect, it } from "vitest";
import { parseEventForm } from "./input";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = {
  title: "  Youth Camp ",
  description: "",
  startsAt: "2027-04-10T09:00",
  endsAt: "2027-04-12T15:00",
  venue: "Camp Resort, La Union",
  ministryId: "",
  contactPerson: "Ate Joy 0917 000 0000",
  attire: "",
};

describe("parseEventForm", () => {
  it("parses a valid form, converting Manila input to UTC", () => {
    expect(parseEventForm(form(valid))).toEqual({
      success: true,
      data: {
        title: "Youth Camp",
        description: null,
        startsAt: new Date("2027-04-10T01:00:00Z"),
        endsAt: new Date("2027-04-12T07:00:00Z"),
        allDay: false,
        recurrence: "NONE",
        recurrenceUntil: null,
        venue: "Camp Resort, La Union",
        atChurchVenue: false,
        ministryId: null,
        contactPerson: "Ate Joy 0917 000 0000",
        attire: null,
        posterUrl: null,
      },
    });
  });

  it("reads the at-church-venue checkbox", () => {
    const result = parseEventForm(form({ ...valid, atChurchVenue: "on" }));
    expect(result.success && result.data.atChurchVenue).toBe(true);
  });

  it("treats a missing ministry as Church-wide", () => {
    const data = form(valid);
    data.delete("ministryId");
    const result = parseEventForm(data);
    expect(result.success && result.data.ministryId).toBeNull();
  });

  it("reports required fields and keeps what was typed", () => {
    const result = parseEventForm(form({ ...valid, title: " ", venue: "", startsAt: "" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.errors).sort()).toEqual(["startsAt", "title", "venue"]);
    expect(result.values.contactPerson).toBe(valid.contactPerson);
  });

  it("rejects an end before the start", () => {
    const result = parseEventForm(form({ ...valid, endsAt: "2027-04-10T08:00" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors).toEqual({ endsAt: "The end must be after the start." });
  });

  it("rejects malformed dates", () => {
    const result = parseEventForm(form({ ...valid, startsAt: "April 10" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.startsAt).toMatch(/valid/);
  });

  describe("all-day events", () => {
    const allDay = { ...valid, allDay: "on", startsAt: "2027-04-10", endsAt: "2027-04-12" };

    it("runs from Manila midnight on the first day to 11:59 PM on the last", () => {
      const result = parseEventForm(form(allDay));
      expect(result.success && result.data).toMatchObject({
        allDay: true,
        startsAt: new Date("2027-04-09T16:00:00Z"), // Apr 10, 12:00 AM Manila
        endsAt: new Date("2027-04-12T15:59:00Z"), // Apr 12, 11:59 PM Manila
      });
    });

    it("allows a single day (same start and end date)", () => {
      const result = parseEventForm(form({ ...allDay, endsAt: "2027-04-10" }));
      expect(result.success).toBe(true);
    });

    it("uses only the date part if a time was sent anyway", () => {
      const result = parseEventForm(form({ ...allDay, startsAt: "2027-04-10T09:00" }));
      expect(result.success && result.data.startsAt).toEqual(new Date("2027-04-09T16:00:00Z"));
    });

    it("rejects an end date before the start date", () => {
      const result = parseEventForm(form({ ...allDay, endsAt: "2027-04-09" }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors).toEqual({ endsAt: "The end date must be on or after the start date." });
    });

    it("rejects malformed dates", () => {
      const result = parseEventForm(form({ ...allDay, endsAt: "Sunday" }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors.endsAt).toBe("Enter a valid date.");
    });
  });

  describe("weekly events", () => {
    const weekly = {
      ...valid,
      startsAt: "2027-04-11T09:00",
      endsAt: "2027-04-11T12:00",
      recurrence: "WEEKLY",
      recurrenceUntil: "",
    };

    it("reads the repeat choice, with no end date by default", () => {
      const result = parseEventForm(form(weekly));
      expect(result.success && result.data).toMatchObject({
        recurrence: "WEEKLY",
        recurrenceUntil: null,
      });
    });

    it("stores 'repeat until' as the end of that Manila day", () => {
      const result = parseEventForm(form({ ...weekly, recurrenceUntil: "2027-06-27" }));
      expect(result.success && result.data.recurrenceUntil).toEqual(
        new Date("2027-06-27T15:59:00Z"),
      );
    });

    it("ignores 'repeat until' for events that don't repeat", () => {
      const result = parseEventForm(
        form({ ...weekly, recurrence: "NONE", recurrenceUntil: "2027-06-27" }),
      );
      expect(result.success && result.data.recurrenceUntil).toBeNull();
    });

    it("treats a missing repeat choice as not repeating", () => {
      const data = form(weekly);
      data.delete("recurrence");
      const result = parseEventForm(data);
      expect(result.success && result.data.recurrence).toBe("NONE");
    });

    it("requires a weekly event to start and end on the same day", () => {
      const result = parseEventForm(form({ ...weekly, endsAt: "2027-04-12T12:00" }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors).toEqual({ endsAt: "A weekly event has to end on the day it starts." });
    });

    it("rejects a 'repeat until' date before the first date", () => {
      const result = parseEventForm(form({ ...weekly, recurrenceUntil: "2027-04-01" }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors).toEqual({ recurrenceUntil: "Pick a date on or after the first date." });
    });

    it("rejects unknown repeat choices", () => {
      const result = parseEventForm(form({ ...weekly, recurrence: "DAILY" }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors.recurrence).toBe("Pick how often it repeats.");
    });
  });
});
