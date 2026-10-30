import { describe, expect, it } from "vitest";
import { announcementText, type AnnouncementEvent } from "./announcement";

const link = "https://camac-sf-web.vercel.app/events/church-anniversary";

// 9:00 AM Manila = 01:00 UTC.
const anniversary: AnnouncementEvent = {
  title: "43rd Church Anniversary",
  description: "Our theme is “Rooting & Reaching”.\n\nTara na, celebrate tayo!",
  startsAt: new Date("2026-08-30T01:00:00Z"),
  endsAt: new Date("2026-08-30T04:00:00Z"),
  allDay: false,
  venue: "Church",
  attire: "Smart casual",
  contactPerson: "Church office",
  recurrence: "NONE",
};

describe("announcementText", () => {
  it("follows the volunteer's format for a one-off event", () => {
    expect(announcementText(anniversary, link)).toBe(
      [
        "Join us for 43rd Church Anniversary on Sunday, August 30, 2026 at 9:00 AM.",
        "",
        "Venue: Church",
        "Attire: Smart casual",
        "Contact: Church office",
        "",
        "Our theme is “Rooting & Reaching”.",
        "",
        "Tara na, celebrate tayo!",
        "",
        `Details and add to calendar: ${link}`,
      ].join("\n"),
    );
  });

  it("leaves out attire, contact and description when they're not set", () => {
    const bare = { ...anniversary, attire: null, contactPerson: null, description: null };
    expect(announcementText(bare, link)).toBe(
      [
        "Join us for 43rd Church Anniversary on Sunday, August 30, 2026 at 9:00 AM.",
        "",
        "Venue: Church",
        "",
        `Details and add to calendar: ${link}`,
      ].join("\n"),
    );
  });

  it("treats blank optional fields as not set", () => {
    const blank = { ...anniversary, attire: "  ", contactPerson: "", description: "\n" };
    expect(announcementText(blank, link)).not.toMatch(/Attire|Contact/);
    expect(announcementText(blank, link)).toContain("Venue: Church\n\nDetails");
  });

  it("drops the time for an all-day event", () => {
    const allDay = { ...anniversary, allDay: true };
    expect(announcementText(allDay, link)).toMatch(
      /^Join us for 43rd Church Anniversary on Sunday, August 30, 2026\.\n/,
    );
  });

  it("gives the date range for a multi-day event", () => {
    const camp = {
      ...anniversary,
      title: "Youth Camp",
      startsAt: new Date("2026-11-14T01:00:00Z"),
      endsAt: new Date("2026-11-16T07:00:00Z"),
    };
    expect(announcementText(camp, link)).toMatch(
      /^Join us for Youth Camp from Saturday, November 14 to Monday, November 16, 2026\.\n/,
    );
  });

  it("gives the weekly pattern, never a date, for a recurring event", () => {
    // Wednesday 6:30 PM Manila = 10:30 UTC.
    const prayer = {
      ...anniversary,
      title: "Prayer Meeting",
      startsAt: new Date("2026-11-04T10:30:00Z"),
      endsAt: new Date("2026-11-04T12:00:00Z"),
      recurrence: "WEEKLY" as const,
    };
    expect(announcementText(prayer, link)).toMatch(
      /^Join us for Prayer Meeting every Wednesday at 6:30 PM\.\n/,
    );
    expect(announcementText({ ...prayer, allDay: true }, link)).toMatch(
      /^Join us for Prayer Meeting every Wednesday\.\n/,
    );
  });

  it("uses the Manila date, not the UTC one", () => {
    // 8:00 PM UTC on Aug 29 is 4:00 AM on Aug 30 in Manila.
    const early = { ...anniversary, startsAt: new Date("2026-08-29T20:00:00Z") };
    expect(announcementText(early, link)).toContain("on Sunday, August 30, 2026 at 4:00 AM.");
  });
});
