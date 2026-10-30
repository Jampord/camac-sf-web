import { describe, expect, it } from "vitest";
import { BODY_MAX, parsePrayerForm } from "./input";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("parsePrayerForm", () => {
  it("needs only the request; the rest is optional and consent defaults to off", () => {
    expect(parsePrayerForm(form({ body: "  Please pray for my mother.  " }))).toEqual({
      kind: "ok",
      data: { body: "Please pray for my mother.", name: null, contact: null, shareConsent: false },
    });
  });

  it("keeps a name, contact and consent when given", () => {
    const result = parsePrayerForm(
      form({ body: "Salamat po", name: " Ana ", contact: " 0917 000 0000 ", shareConsent: "on" }),
    );
    expect(result).toEqual({
      kind: "ok",
      data: { body: "Salamat po", name: "Ana", contact: "0917 000 0000", shareConsent: true },
    });
  });

  it("asks for the request when it's blank", () => {
    const result = parsePrayerForm(form({ body: "   " }));
    expect(result.kind).toBe("invalid");
    expect(result.kind === "invalid" && result.errors.body).toBeTruthy();
  });

  it("rejects text over the limits", () => {
    const result = parsePrayerForm(
      form({ body: "x".repeat(BODY_MAX + 1), name: "x".repeat(121), contact: "x".repeat(201) }),
    );
    expect(result.kind === "invalid" && Object.keys(result.errors).sort()).toEqual([
      "body",
      "contact",
      "name",
    ]);
  });

  it("flags the hidden honeypot field as spam, before anything else", () => {
    expect(parsePrayerForm(form({ body: "", website: "http://spam.example" }))).toEqual({
      kind: "spam",
    });
  });
});
