import { rolesOf, type ScheduleService } from "./roles";

// Validates a date's schedule form. Names are free text and any slot can be left blank.

export const NAMES_MAX = 200;

export type ParsedAssignments =
  | { ok: true; assignments: { role: string; names: string }[] }
  | { ok: false; message: string };

/** Only reads this service's roles, so a forged field can't save anything else. */
export function parseAssignments(service: ScheduleService, formData: FormData): ParsedAssignments {
  const assignments = [];
  for (const role of rolesOf(service)) {
    const value = formData.get(role.key);
    const names = typeof value === "string" ? value.trim() : "";
    if (names.length > NAMES_MAX) {
      return { ok: false, message: `${role.label} must be ${NAMES_MAX} characters or fewer.` };
    }
    assignments.push({ role: role.key, names });
  }
  return { ok: true, assignments };
}
