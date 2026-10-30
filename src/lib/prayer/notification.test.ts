import { describe, expect, it } from "vitest";
import { NOTIFICATION_SUBJECT, notificationText } from "./notification";

// The brief's promise: "only 'New prayer request' and a link". It takes nothing but the link, so
// a request's text, a name or a contact can't end up in an email by accident.
describe("the prayer notification email", () => {
  it("says only that a request came in, and links to the inbox", () => {
    expect(NOTIFICATION_SUBJECT).toBe("New prayer request");
    expect(notificationText("https://example.test/admin/prayer")).toBe(
      "A new prayer request came in. Sign in to read it:\nhttps://example.test/admin/prayer",
    );
    expect(notificationText.length).toBe(1);
  });
});
