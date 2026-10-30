import { describe, expect, it } from "vitest";
import { cleanupCutoffs, isCronAuthorized } from "./retention";

const DAY = 86_400_000;
const now = new Date("2026-11-30T18:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);

describe("cleanupCutoffs", () => {
  it("archives prayers at 60 days and deletes them at a year", () => {
    const cutoffs = cleanupCutoffs(now);
    expect(cutoffs.archivePrayersBefore).toEqual(ago(60));
    expect(cutoffs.deletePrayersBefore).toEqual(ago(365));
  });

  it("purges soft-deleted events after their 30 days", () => {
    expect(cleanupCutoffs(now).purgeEventsDeletedBefore).toEqual(ago(30));
  });

  it("keeps rate-limit rows only for the hour they count toward", () => {
    // The job runs daily, so an hour's cutoff means no row lives past about a day (see /privacy).
    expect(cleanupCutoffs(now).deleteRateLimitHitsBefore).toEqual(new Date(now.getTime() - 3_600_000));
  });
});

describe("isCronAuthorized", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isCronAuthorized("Bearer s3cret-value", "s3cret-value")).toBe(true);
    expect(isCronAuthorized("Bearer wrong-value!", "s3cret-value")).toBe(false);
    expect(isCronAuthorized("s3cret-value", "s3cret-value")).toBe(false);
    expect(isCronAuthorized(null, "s3cret-value")).toBe(false);
  });

  it("refuses everyone when no secret is configured", () => {
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
    expect(isCronAuthorized(null, undefined)).toBe(false);
  });
});
