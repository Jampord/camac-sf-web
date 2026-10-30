import { describe, expect, it } from "vitest";
import { eventStatus } from "./status";

const at = new Date("2026-11-01T00:00:00Z");
const none = { publishedAt: null, cancelledAt: null, deletedAt: null };

describe("eventStatus", () => {
  it("is a draft until published", () => {
    expect(eventStatus(none)).toBe("draft");
    expect(eventStatus({ ...none, publishedAt: at })).toBe("published");
  });

  it("is cancelled when a published event is cancelled", () => {
    expect(eventStatus({ ...none, publishedAt: at, cancelledAt: at })).toBe("cancelled");
  });

  it("treats deletion as overriding everything else", () => {
    expect(eventStatus({ publishedAt: at, cancelledAt: at, deletedAt: at })).toBe("deleted");
  });
});
