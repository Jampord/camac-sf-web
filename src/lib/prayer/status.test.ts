import { describe, expect, it } from "vitest";
import { STATUS_LABELS, isPrayerStatus, sortForInbox, statusMoves } from "./status";

describe("statusMoves", () => {
  it("moves forward one step, with a way back for a mistaken tap", () => {
    expect(statusMoves("NEW")).toEqual([{ to: "PRAYED", label: "Mark as prayed" }]);
    expect(statusMoves("PRAYED")).toEqual([
      { to: "ANSWERED", label: "Mark as answered" },
      { to: "NEW", label: "Back to new" },
    ]);
    expect(statusMoves("ANSWERED")).toEqual([{ to: "PRAYED", label: "Back to prayed" }]);
  });

  it("labels every status", () => {
    expect(STATUS_LABELS).toEqual({ NEW: "New", PRAYED: "Prayed", ANSWERED: "Answered" });
  });
});

describe("isPrayerStatus", () => {
  it("accepts only the three statuses", () => {
    expect(isPrayerStatus("PRAYED")).toBe(true);
    expect(isPrayerStatus("prayed")).toBe(false);
    expect(isPrayerStatus("DELETED")).toBe(false);
    expect(isPrayerStatus(null)).toBe(false);
  });
});

describe("sortForInbox", () => {
  const at = (day: number) => new Date(`2026-11-${String(day).padStart(2, "0")}T00:00:00Z`);

  it("puts new requests first, then newest first within each status", () => {
    const sorted = sortForInbox([
      { id: "prayed-new", status: "PRAYED" as const, createdAt: at(9) },
      { id: "new-old", status: "NEW" as const, createdAt: at(1) },
      { id: "answered", status: "ANSWERED" as const, createdAt: at(10) },
      { id: "new-recent", status: "NEW" as const, createdAt: at(5) },
      { id: "prayed-old", status: "PRAYED" as const, createdAt: at(2) },
    ]);
    expect(sorted.map((r) => r.id)).toEqual([
      "new-recent",
      "new-old",
      "prayed-new",
      "prayed-old",
      "answered",
    ]);
  });
});
