import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { eventStatus } from "@/lib/events/status";
import { utcToManilaInput } from "@/lib/time";
import { buttonClass, inputClass, primaryButtonClass, StatusBadge } from "../../ui";
import {
  cancelEvent,
  deleteEvent,
  publishEvent,
  uncancelEvent,
  updateEvent,
} from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Edit event" };

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      {params.then(({ id }) => (
        <EditEvent id={id} />
      ))}
    </Suspense>
  );
}

async function EditEvent({ id }: { id: string }) {
  const [, event, ministries] = await Promise.all([
    requireAdmin(),
    db.event.findFirst({ where: { id, deletedAt: null } }),
    db.ministry.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!event) notFound();

  const status = eventStatus(event);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-base text-muted">
          Link (never changes): <code>/events/{event.slug}</code>
        </p>
        {status === "cancelled" && event.cancelNote && (
          <p className="text-base">Cancellation note: {event.cancelNote}</p>
        )}
      </div>

      <section className="flex flex-wrap items-start gap-3 rounded-lg border p-4">
        {status === "draft" && (
          <form action={publishEvent.bind(null, event.id)}>
            <button type="submit" className={primaryButtonClass}>
              Publish
            </button>
          </form>
        )}

        {status === "published" && (
          <form action={cancelEvent.bind(null, event.id)} className="flex flex-wrap gap-2">
            <input
              name="cancelNote"
              maxLength={200}
              placeholder="Optional note, e.g. Moved to Nov 22"
              aria-label="Cancellation note"
              className={`${inputClass} sm:w-72`}
            />
            <button type="submit" className={buttonClass}>
              Cancel event
            </button>
          </form>
        )}

        {status === "cancelled" && (
          <form action={uncancelEvent.bind(null, event.id)}>
            <button type="submit" className={buttonClass}>
              Undo cancellation
            </button>
          </form>
        )}

        <form action={deleteEvent.bind(null, event.id)} className="ml-auto">
          <button type="submit" className={buttonClass}>
            Delete
          </button>
        </form>

        <p className="basis-full text-base text-muted">
          Already shared? Cancel instead of deleting: the page stays up with a
          &ldquo;Cancelled&rdquo; banner. Deleted events can be restored for 30 days.
        </p>
      </section>

      <EventForm
        action={updateEvent.bind(null, event.id)}
        ministries={ministries}
        submitLabel="Save changes"
        defaults={{
          title: event.title,
          description: event.description ?? "",
          startsAt: utcToManilaInput(event.startsAt),
          endsAt: utcToManilaInput(event.endsAt),
          venue: event.venue,
          atChurchVenue: event.atChurchVenue ? "on" : "",
          ministryId: event.ministryId ?? "",
          contactPerson: event.contactPerson ?? "",
          attire: event.attire ?? "",
        }}
      />
    </>
  );
}
