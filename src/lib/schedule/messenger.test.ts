import { describe, expect, it } from "vitest";
import { scheduleText } from "./messenger";
import type { ScheduleService } from "./roles";

const SERVICE: ScheduleService = {
  key: "sunday",
  slug: "sunday-service",
  title: "Sunday Service",
  groups: [
    { label: "Sunday service", roles: [{ key: "leader", label: "Service Leader" }] },
    {
      label: "Music Team",
      roles: [
        { key: "worship", label: "Worship Leader" },
        { key: "keyboard", label: "Keyboard" },
      ],
    },
    { label: "After service", roles: [{ key: "cleanup", label: "Cleanup", several: true }] },
  ],
};

describe("scheduleText", () => {
  it("lists each group with its filled roles, in the form's order", () => {
    expect(
      scheduleText(SERVICE, "Sunday, November 9", {
        keyboard: "Ana",
        leader: "Juan",
        worship: "Maria",
        cleanup: "Youth group",
      }),
    ).toBe(
      [
        "Sunday Service · Sunday, November 9",
        "",
        "Sunday service",
        "Service Leader: Juan",
        "",
        "Music Team",
        "Worship Leader: Maria",
        "Keyboard: Ana",
        "",
        "After service",
        "Cleanup: Youth group",
      ].join("\n"),
    );
  });

  it("leaves out blank roles and groups with nobody in them", () => {
    expect(scheduleText(SERVICE, "Sunday, November 9", { keyboard: "Ana" })).toBe(
      "Sunday Service · Sunday, November 9\n\nMusic Team\nKeyboard: Ana",
    );
  });

  it("ignores names under roles this service doesn't have", () => {
    expect(scheduleText(SERVICE, "Sunday, November 9", { exhorter: "Pedro" })).toBe(
      "Sunday Service · Sunday, November 9",
    );
  });
});
