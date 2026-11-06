import "server-only";
import { db } from "@/lib/db";
import { upcomingDates, type ScheduleDate } from "@/lib/schedule/dates";
import { SERVICES, type ScheduleService } from "@/lib/schedule/roles";
import { manilaInputToUtc, utcToManilaInput } from "@/lib/time";

// The schedule as both the admin and member pages show it. Reads the database, so callers check
// access first.

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

export type ServiceDates = { service: ScheduleService; dates: ScheduleDate[] };
export type Assignment = { date: string; role: string; names: string };

/** Every service's upcoming dates, and what's been entered for them. */
export async function loadUpcomingSchedule(
  now: Date,
): Promise<{ services: ServiceDates[]; assignments: Assignment[] }> {
  const services = await Promise.all(
    SERVICES.map(async (service) => {
      const event = await findServiceEvent(service);
      return { service, dates: event ? upcomingDates(event, now) : [] };
    }),
  );

  // Only rows from the days being listed, whichever service they belong to.
  const days = services.flatMap(({ dates }) => dates.map(({ date }) => manilaInputToUtc(date)));
  const rows = await db.servingAssignment.findMany({
    where: { date: { in: days } },
    select: { date: true, role: true, names: true },
  });

  return {
    services,
    assignments: rows.map((row) => ({
      date: utcToManilaInput(row.date).slice(0, 10),
      role: row.role,
      names: row.names,
    })),
  };
}
