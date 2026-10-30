import { describe, expect, it } from "vitest";
import { slugBase, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("makes ministry names URL-safe", () => {
    expect(slugify("Sunday School")).toBe("sunday-school");
    expect(slugify("Church Ministry Team (CMT)")).toBe("church-ministry-team-cmt");
    expect(slugify("Women's")).toBe("womens");
  });
});

const april2027 = new Date("2027-04-10T01:00:00Z");

describe("slugBase", () => {
  it("joins the title with the Manila year and month", () => {
    expect(slugBase("Youth Camp", april2027)).toBe("youth-camp-2027-04");
  });

  it("strips accents, apostrophes, emoji and punctuation", () => {
    expect(slugBase("Women's Fellowship: Sto. Niño 🎉", april2027)).toBe(
      "womens-fellowship-sto-nino-2027-04",
    );
  });

  it("uses the Manila month when UTC is still in the previous month", () => {
    // 2027-04-30T17:00Z is May 1, 01:00 in Manila.
    expect(slugBase("Retreat", new Date("2027-04-30T17:00:00Z"))).toBe("retreat-2027-05");
  });

  it("falls back to 'event' for titles with no usable characters", () => {
    expect(slugBase("🙏🙏", april2027)).toBe("event-2027-04");
  });

  it("caps very long titles without leaving a trailing dash", () => {
    const slug = slugBase("a ".repeat(100), april2027);
    expect(slug).toMatch(/^[a-z0-9-]+-2027-04$/);
    expect(slug).not.toContain("--");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", async () => {
    expect(await uniqueSlug("youth-camp-2027-04", async () => false)).toBe("youth-camp-2027-04");
  });

  it("adds a numeric suffix on collision", async () => {
    const taken = new Set(["youth-camp-2027-04", "youth-camp-2027-04-2"]);
    expect(await uniqueSlug("youth-camp-2027-04", async (s) => taken.has(s))).toBe(
      "youth-camp-2027-04-3",
    );
  });
});
