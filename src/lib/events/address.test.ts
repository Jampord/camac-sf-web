import { describe, expect, it } from "vitest";
import { eventAddress, fullLocation, mapsUrl } from "./address";

const church = "12 Example St, San Fernando, La Union";

describe("eventAddress", () => {
  it("uses the church address for church events", () => {
    expect(eventAddress({ atChurchVenue: true, venueAddress: null }, church)).toBe(church);
  });

  it("prefers the event's own address when it has one", () => {
    expect(eventAddress({ atChurchVenue: true, venueAddress: " Fellowship hall, 14 Example St " }, church)).toBe(
      "Fellowship hall, 14 Example St",
    );
    expect(eventAddress({ atChurchVenue: false, venueAddress: "Camp Resort, Bauang" }, church)).toBe(
      "Camp Resort, Bauang",
    );
  });

  it("has none for other venues without an address, or before the church address is set", () => {
    expect(eventAddress({ atChurchVenue: false, venueAddress: null }, church)).toBeNull();
    expect(eventAddress({ atChurchVenue: false, venueAddress: "  " }, church)).toBeNull();
    expect(eventAddress({ atChurchVenue: true, venueAddress: null }, null)).toBeNull();
  });
});

describe("fullLocation", () => {
  it("joins the venue name and address", () => {
    expect(fullLocation("Church", church)).toBe(`Church, ${church}`);
  });

  it("doesn't repeat a venue name the address already starts with", () => {
    expect(fullLocation("Camp Resort", "Camp Resort, Bauang")).toBe("Camp Resort, Bauang");
  });

  it("is just the venue without an address", () => {
    expect(fullLocation("Pastor's home", null)).toBe("Pastor's home");
  });
});

describe("mapsUrl", () => {
  it("searches Google Maps for the address", () => {
    const url = new URL(mapsUrl("12 Example St, San Fernando"));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("12 Example St, San Fernando");
  });
});
