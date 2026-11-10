import type { ScheduleService } from "./roles";

// One date's schedule as plain text for the Messenger group chat: the service and date, then
// each group with its filled roles. Blank roles are left out, like on the page.

export function scheduleText(
  service: ScheduleService,
  dateLabel: string,
  names: Record<string, string>,
): string {
  const groups = service.groups.flatMap((group) => {
    const lines = group.roles.flatMap((role) =>
      names[role.key] ? [`${role.label}: ${names[role.key]}`] : [],
    );
    return lines.length > 0 ? [[group.label, ...lines].join("\n")] : [];
  });
  return [`${service.title} · ${dateLabel}`, ...groups].join("\n\n");
}
