import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { purgeDate } from "@/lib/events/status";
import { formatManila } from "@/lib/time";
import { buttonClass, formatEventStart } from "../../ui";
import { restoreEvent } from "../actions";

export const metadata: Metadata = { title: "Recently deleted" };

export default function DeletedEventsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Recently deleted</h1>
      <p className="text-muted">Deleted events are removed for good 30 days after deletion.</p>
      <Suspense fallback={<p>Loading…</p>}>
        <DeletedEvents />
      </Suspense>
    </>
  );
}

async function DeletedEvents() {
  const [, events] = await Promise.all([
    requireAdmin(),
    db.event.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, title: true, startsAt: true, deletedAt: true },
    }),
  ]);

  if (events.length === 0) return <p>Nothing here.</p>;

  return (
    <ul className="flex flex-col divide-y border-y">
      {events.map((event) => (
        <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-col">
            <span className="font-semibold">{event.title}</span>
            <span className="text-base text-muted">
              {formatEventStart(event.startsAt)} · removed for good on{" "}
              {formatManila(purgeDate(event.deletedAt!), { month: "short", day: "numeric" })}
            </span>
          </div>
          <form action={restoreEvent.bind(null, event.id)}>
            <button type="submit" className={buttonClass}>
              Restore
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
