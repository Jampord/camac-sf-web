import { Suspense } from "react";
import type { Metadata } from "next";
import { DateBlock } from "@/components/date-block";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { PURGE_AFTER_DAYS, purgeDate } from "@/lib/events/status";
import { formatManila } from "@/lib/time";
import { RestoreButton } from "../restore-button";

export const metadata: Metadata = { title: "Recently deleted" };

export default function DeletedEventsPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Recently deleted</h1>
        <p className="text-muted-foreground">
          Deleted events stay here for {PURGE_AFTER_DAYS} days, then they&apos;re removed for good.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <DeletedEvents />
      </Suspense>
    </>
  );
}

async function DeletedEvents() {
  // Check access before touching the database.
  await requireAdmin();
  const events = await db.event.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, title: true, startsAt: true, deletedAt: true },
  });

  if (events.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-muted-foreground">Nothing here.</p>;
  }

  return (
    <ul className="flex flex-col divide-y border-y">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-4 py-3">
          <DateBlock date={event.startsAt} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-semibold">{event.title}</p>
            <p className="text-sm text-muted-foreground">
              Removed for good on{" "}
              {formatManila(purgeDate(event.deletedAt!), { month: "short", day: "numeric" })}
            </p>
          </div>
          <RestoreButton id={event.id} title={event.title} />
        </li>
      ))}
    </ul>
  );
}
