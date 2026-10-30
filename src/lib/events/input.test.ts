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
        venue: "Camp Resort, La Union",
        atChurchVenue: false,
        ministryId: null,
        contactPerson: "Ate Joy 0917 000 0000",
        attire: null,
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
});
