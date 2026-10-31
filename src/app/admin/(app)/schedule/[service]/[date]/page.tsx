import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { occurrenceOn } from "@/lib/schedule/dates";
import { getService, rolesOf } from "@/lib/schedule/roles";
import { formatManila, manilaInputToUtc } from "@/lib/time";
import { findServiceEvent } from "../../service-event";
import { AssignmentForm } from "./assignment-form";

export const metadata: Metadata = { title: "Edit schedule" };

export default function EditSchedulePage({ params }: PageProps<"/admin/schedule/[service]/[date]">) {
  // params is request data, so it's read inside the boundary (Next 16 Cache Components).
  return (
    <Suspense fallback={<FormSkeleton label="Loading schedule" />}>
      {params.then(({ service, date }) => (
        <EditSchedule serviceKey={service} date={date} />
      ))}
    </Suspense>
  );
}

async function EditSchedule({ serviceKey, date }: { serviceKey: string; date: string }) {
  // Check access before touching the database.
  await requireAdmin();
  const service = getService(serviceKey);
  if (!service) notFound();
  const event = await findServiceEvent(service);
  const occurrence = event && occurrenceOn(event, date);
  if (!occurrence) notFound();

  const rows = await db.servingAssignment.findMany({
    where: {
      date: manilaInputToUtc(date),
      role: { in: rolesOf(service).map((role) => role.key) },
    },
    select: { role: true, names: true },
  });

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/admin/schedule" className="w-fit text-sm font-medium underline underline-offset-4">
          Back to the schedule
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{service.title}</h1>
        <p className="text-lg">
          {formatManila(occurrence.startsAt, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <AssignmentForm
        serviceKey={service.key}
        date={date}
        names={Object.fromEntries(rows.map((row) => [row.role, row.names]))}
      />
    </>
  );
}
