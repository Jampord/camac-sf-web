import { describe, expect, it } from "vitest";
import { changeProblem, MANAGERS_ONLY, OWN_ACCESS } from "./rules";

const manager = { id: "me", canManagePeople: true };
const admin = { id: "me", canManagePeople: false };
const member = (id = "m1") => ({ id, access: "member" as const });

describe("changeProblem", () => {
  it("stops anyone changing or removing themselves, managers included", () => {
    expect(changeProblem(manager, { id: "me", access: "prayer" }, "admin")).toBe(OWN_ACCESS);
    expect(changeProblem(manager, { id: "me", access: "prayer" })).toBe(OWN_ACCESS);
  });

  it("lets a people manager change or remove anyone else", () => {
    expect(changeProblem(manager, { id: "a2", access: "prayer" }, "member")).toBeNull();
    expect(changeProblem(manager, member(), "prayer")).toBeNull();
    expect(changeProblem(manager, { id: "a2", access: "admin" })).toBeNull();
  });

  it("lets other admins rename and remove members", () => {
    expect(changeProblem(admin, member(), "member")).toBeNull();
    expect(changeProblem(admin, member())).toBeNull();
  });

  it("stops other admins promoting a member", () => {
    expect(changeProblem(admin, member(), "admin")).toBe(MANAGERS_ONLY);
    expect(changeProblem(admin, member(), "prayer")).toBe(MANAGERS_ONLY);
  });

  it("stops other admins changing or removing an admin", () => {
    expect(changeProblem(admin, { id: "a2", access: "admin" }, "admin")).toBe(MANAGERS_ONLY);
    expect(changeProblem(admin, { id: "a2", access: "prayer" })).toBe(MANAGERS_ONLY);
  });
});
