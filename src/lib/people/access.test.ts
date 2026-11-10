import { describe, expect, it } from "vitest";
import { accessColumns, accessOf } from "./access";

describe("accessOf", () => {
  it("reads the level from the role and prayer access", () => {
    expect(accessOf({ role: "MEMBER", canViewPrayer: false })).toBe("member");
    expect(accessOf({ role: "ADMIN", canViewPrayer: false })).toBe("admin");
    expect(accessOf({ role: "ADMIN", canViewPrayer: true })).toBe("prayer");
  });

  it("never calls a member prayer team, even with a stray flag", () => {
    expect(accessOf({ role: "MEMBER", canViewPrayer: true })).toBe("member");
  });
});

describe("accessColumns", () => {
  it("clears both admin permissions for a member, whatever was ticked", () => {
    expect(accessColumns("member", true)).toEqual({
      role: "MEMBER",
      canViewPrayer: false,
      canManagePeople: false,
    });
  });

  it("gives prayer access only at the prayer-team level", () => {
    expect(accessColumns("admin", false)).toEqual({ role: "ADMIN", canViewPrayer: false, canManagePeople: false });
    expect(accessColumns("prayer", false)).toEqual({ role: "ADMIN", canViewPrayer: true, canManagePeople: false });
  });

  it("keeps managing people separate from prayer access", () => {
    expect(accessColumns("admin", true)).toEqual({ role: "ADMIN", canViewPrayer: false, canManagePeople: true });
  });
});
