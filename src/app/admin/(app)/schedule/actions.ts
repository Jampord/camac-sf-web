"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { occurrenceOn } from "@/lib/schedule/dates";
import { parseAssignments } from "@/lib/schedule/input";
import { getService } from "@/lib/schedule/roles";
import { manilaInputToUtc } from "@/lib/time";
import { findServiceEvent } from "./service-event";

// Server Actions can be called by a direct POST, so this checks requireAdmin() itself.

export type ScheduleFormState = { saved?: boolean; message?: string };

const GONE = "This date is no longer on the calendar. Go back to the schedule to see the latest.";

export async function saveAssignments(
  serviceKey: string,
  date: string,
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  await requireAdmin();

  const service = getService(serviceKey);
  if (!service) return { message: GONE };
  // Checked again here: the week may have been skipped since the form was opened.
  const event = await findServiceEvent(service);
  if (!event || !occurrenceOn(event, date)) return { message: GONE };

  const parsed = parseAssignments(service, formData);
  if (!parsed.ok) return { message: parsed.message };

  const day = manilaInputToUtc(date);
  await db.$transaction(
    parsed.assignments.map(({ role, names }) =>
      names
        ? db.servingAssignment.upsert({
            where: { date_role: { date: day, role } },
            create: { date: day, role, names },
            update: { names },
          })
        : db.servingAssignment.deleteMany({ where: { date: day, role } }),
    ),
  );
  refresh();
  return { saved: true };
}
