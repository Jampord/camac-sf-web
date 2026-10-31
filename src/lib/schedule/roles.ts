// Who serves at each regular service. The list lives in code on purpose: it rarely changes, and
// changing a role is a small edit. Keys are saved with each assignment, so renaming a label is
// safe but changing a key loses what was entered under it.

export type ScheduleRole = { key: string; label: string; several?: boolean };
export type RoleGroup = { label: string; roles: ScheduleRole[] };
export type ScheduleService = {
  key: string;
  slug: string; // the seeded weekly event it follows; slugs never change
  title: string;
  groups: RoleGroup[];
};

export const SERVICES: ScheduleService[] = [
  {
    key: "sunday",
    slug: "sunday-service",
    title: "Sunday Service",
    groups: [
      {
        label: "Sunday service",
        roles: [{ key: "service-leader", label: "Service Leader" }],
      },
      {
        label: "Music Team",
        roles: [
          { key: "worship-leader", label: "Worship Leader" },
          { key: "devotional-leader", label: "Devotional Leader" },
          { key: "keyboard", label: "Keyboard" },
          { key: "guitar", label: "Guitar" },
          { key: "bass", label: "Bass" },
          { key: "drums", label: "Drums" },
          { key: "backup-singers", label: "Backup Singers", several: true },
        ],
      },
      {
        label: "Sunday School",
        roles: [
          { key: "teacher", label: "Teacher" },
          { key: "assistant-teacher", label: "Assistant Teacher" },
        ],
      },
      {
        label: "After service",
        roles: [
          { key: "dishwashers", label: "Dishwashers", several: true },
          { key: "setup", label: "Setup", several: true },
          { key: "cleanup", label: "Cleanup", several: true },
        ],
      },
    ],
  },
  {
    key: "prayer",
    slug: "prayer-meeting",
    title: "Prayer Meeting",
    groups: [
      {
        label: "Prayer Meeting",
        roles: [
          { key: "exhorter", label: "Exhorter" },
          { key: "prayer-leader", label: "Leader" },
        ],
      },
    ],
  },
];

export function getService(key: string): ScheduleService | undefined {
  return SERVICES.find((service) => service.key === key);
}

export function rolesOf(service: ScheduleService): ScheduleRole[] {
  return service.groups.flatMap((group) => group.roles);
}
