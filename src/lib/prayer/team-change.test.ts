import { describe, expect, it } from "vitest";
import { TEAM_CHANGE_SUBJECT, teamChangeText } from "./team-change";

describe("the prayer team change email", () => {
  it("names who joined and who added them, and links to the inbox", () => {
    expect(TEAM_CHANGE_SUBJECT).toBe("Someone joined the prayer team");
    expect(teamChangeText("Ana", "Pastor Ben", "https://example.test/admin/prayer")).toBe(
      "Ana was added to the prayer team by Pastor Ben, so they can now read prayer requests.\n\n" +
        "If you didn't expect this, please tell the pastor.\n\n" +
        "The prayer inbox:\nhttps://example.test/admin/prayer",
    );
  });
});
