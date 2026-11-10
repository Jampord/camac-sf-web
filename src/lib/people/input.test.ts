import { describe, expect, it } from "vitest";
import { NAME_MAX, parsePersonForm } from "./input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parsePersonForm", () => {
  it("lowercases and trims the email, and keeps the name", () => {
    expect(parsePersonForm(form({ email: "  Juan.Cruz@Example.com ", name: " Juan " }))).toEqual({
      ok: true,
      data: { email: "juan.cruz@example.com", name: "Juan", access: "member", canManagePeople: false },
    });
  });

  it("treats a blank or missing name as none", () => {
    expect(parsePersonForm(form({ email: "a@example.com", name: "  " }))).toMatchObject({
      ok: true,
      data: { name: null },
    });
    expect(parsePersonForm(form({ email: "a@example.com" }))).toMatchObject({
      ok: true,
      data: { name: null },
    });
  });

  it("asks for an email when it's blank", () => {
    expect(parsePersonForm(form({ email: " " }))).toEqual({
      ok: false,
      errors: { email: "Enter the email they use for Google." },
    });
  });

  it("rejects something that isn't an email", () => {
    expect(parsePersonForm(form({ email: "juan" }))).toEqual({
      ok: false,
      errors: { email: "That doesn't look like an email address." },
    });
  });

  it("rejects a name that's too long", () => {
    expect(parsePersonForm(form({ email: "a@example.com", name: "x".repeat(NAME_MAX + 1) }))).toEqual({
      ok: false,
      errors: { name: `Name must be ${NAME_MAX} characters or fewer.` },
    });
  });

  it("reads the access level and the people-manager checkbox", () => {
    expect(
      parsePersonForm(form({ email: "a@example.com", access: "prayer", canManagePeople: "on" })),
    ).toMatchObject({ ok: true, data: { access: "prayer", canManagePeople: true } });
  });

  it("treats a form without an access choice as adding a member", () => {
    expect(parsePersonForm(form({ email: "a@example.com" }))).toMatchObject({
      ok: true,
      data: { access: "member", canManagePeople: false },
    });
  });

  it("rejects an access level that doesn't exist", () => {
    expect(parsePersonForm(form({ email: "a@example.com", access: "owner" }))).toEqual({
      ok: false,
      errors: { access: "Choose what they can do." },
    });
  });
});
