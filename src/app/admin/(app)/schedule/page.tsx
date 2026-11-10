import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { InlinePending } from "@/components/link-pending";
import { requireAdmin } from "@/lib/dal";
import type { ScheduleDate } from "@/lib/schedule/dates";
import { loadUpcomingSchedule, type Assignment } from "@/lib/schedule/load";
import { rolesOf, type ScheduleService } from "@/lib/schedule/roles";
import { formatManila } from "@/lib/time";

export const metadata: Metadata = { title: "Serving schedule" };

// Who serves on each date: admins edit it here, members read it at /schedule. Volunteers' names
// must never reach a public page, so both need sign-in.

export default function SchedulePage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Serving schedule</h1>
        <p className="text-muted-foreground">
          Members see it at{" "}
          <Link href="/schedule" className="font-medium underline underline-offset-4">
            /schedule
          </Link>{" "}
          after signing in. Add them under Members.
        </p>
      </div>
      <Suspense fallback={<ScheduleSkeleton />}>
        <Services />
      </Suspense>
    </>
  );
}

async function Services() {
  // Check access before touching the database.
  await requireAdmin();
  const { services, assignments } = await loadUpcomingSchedule(new Date());

  return services.map(({ service, dates }) => (
    <ServiceDates key={service.key} service={service} dates={dates} assignments={assignments} />
  ));
}

function ServiceDates({
  service,
  dates,
  assignments,
}: {
  service: ScheduleService;
  dates: ScheduleDate[];
  assignments: Assignment[];
}) {
  const roles = rolesOf(service);
  const roleKeys = new Set(roles.map((role) => role.key));
  const filled = ({ date }: ScheduleDate) =>
    assignments.filter((row) => roleKeys.has(row.role) && row.date === date).length;

  return (
    <section aria-label={service.title} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{service.title}</h2>
      {dates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
          This service isn&apos;t on the calendar right now.
        </p>
      ) : (
        <ul className="flex flex-col divide-y border-y">
          {dates.map((date) => {
            const label = formatManila(date.startsAt, {
              weekday: "long",
              month: "short",
              day: "numeric",
            });
            return (
              <li key={date.date}>
                {date.skipped ? (
                  <div className="flex min-h-12 items-center justify-between gap-3 py-2 text-muted-foreground">
                    <span className="line-through">{label}</span>
                    <span className="text-sm">No service</span>
                  </div>
                ) : (
                  <Link
                    href={`/admin/schedule/${service.key}/${date.date}`}
                    className="flex min-h-12 items-center justify-between gap-3 py-2 font-medium outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="flex items-center gap-2">
                      {label}
                      <InlinePending />
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filled(date)} of {roles.length} filled
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ScheduleSkeleton() {
  return (
    <div role="status" aria-label="Loading schedule" className="flex flex-col gap-3 motion-safe:animate-pulse">
      <div className="h-7 w-48 rounded-md bg-foreground/10" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 w-full rounded-md bg-foreground/10" />
      ))}
    </div>
  );
}
