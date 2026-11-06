import { describe, expect, it } from "vitest";
import { NAME_MAX, parseMemberForm } from "./input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseMemberForm", () => {
  it("lowercases and trims the email, and keeps the name", () => {
    expect(parseMemberForm(form({ email: "  Juan.Cruz@Example.com ", name: " Juan " }))).toEqual({
      ok: true,
      data: { email: "juan.cruz@example.com", name: "Juan" },
    });
  });

  it("treats a blank or missing name as none", () => {
    expect(parseMemberForm(form({ email: "a@example.com", name: "  " }))).toMatchObject({
      ok: true,
      data: { name: null },
    });
    expect(parseMemberForm(form({ email: "a@example.com" }))).toMatchObject({
      ok: true,
      data: { name: null },
    });
  });

  it("asks for an email when it's blank", () => {
    expect(parseMemberForm(form({ email: " " }))).toEqual({
      ok: false,
      errors: { email: "Enter the email they use for Google." },
    });
  });

  it("rejects something that isn't an email", () => {
    expect(parseMemberForm(form({ email: "juan" }))).toEqual({
      ok: false,
      errors: { email: "That doesn't look like an email address." },
    });
  });

  it("rejects a name that's too long", () => {
    expect(parseMemberForm(form({ email: "a@example.com", name: "x".repeat(NAME_MAX + 1) }))).toEqual({
      ok: false,
      errors: { name: `Name must be ${NAME_MAX} characters or fewer.` },
    });
  });
});
