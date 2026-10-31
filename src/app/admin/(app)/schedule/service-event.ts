import "server-only";
import { db } from "@/lib/db";
import type { ScheduleService } from "@/lib/schedule/roles";

/** The weekly event a service follows. Null if it was deleted or cancelled: no dates to schedule. */
export function findServiceEvent(service: ScheduleService) {
  return db.event.findFirst({
    where: { slug: service.slug, deletedAt: null, cancelledAt: null },
    select: {
      startsAt: true,
      endsAt: true,
      recurrence: true,
      recurrenceUntil: true,
      skipDates: true,
    },
  });
}
