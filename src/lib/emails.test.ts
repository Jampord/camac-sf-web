import { describe, expect, it } from "vitest";
import { parseEmailList } from "./emails";

describe("parseEmailList", () => {
  it("splits on commas and whitespace, lowercases and dedupes", () => {
    expect(parseEmailList(" A@Example.com, b@example.com\nA@example.com ")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("returns an empty list for missing or blank values", () => {
    expect(parseEmailList(undefined)).toEqual([]);
    expect(parseEmailList("  ")).toEqual([]);
  });
});
