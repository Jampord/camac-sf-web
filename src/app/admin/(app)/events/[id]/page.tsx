import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateBlock } from "@/components/date-block";
import { EventStatusBadge } from "@/components/event-status-badge";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { eventStatus } from "@/lib/events/status";
import { utcToManilaInput } from "@/lib/time";
import { updateEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Edit event" };

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  // params is request data, so it's read inside the boundary; the layout around it still
  // prerenders (Next 16 Cache Components).
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      {params.then(({ id }) => (
        <EditEvent id={id} />
      ))}
    </Suspense>
  );
}

async function EditEvent({ id }: { id: string }) {
  // Check access before touching the database.
  await requireAdmin();
  const [event, ministries] = await Promise.all([
    db.event.findFirst({ where: { id, deletedAt: null } }),
    db.ministry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!event) notFound();

  return (
    <>
      <div className="flex gap-4">
        <DateBlock date={event.startsAt} />
        <div className="flex min-w-0 flex-col gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">
              {event.title}
            </h1>
            <EventStatusBadge status={eventStatus(event)} />
          </div>
          <p className="text-sm text-muted-foreground">
            Link: <code className="break-all text-foreground">/events/{event.slug}</code>
            <br />
            The link stays the same when you edit, so shared posts keep working.
          </p>
        </div>
      </div>

      {/* Milestone 5: publish, cancel and delete go here. */}

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
