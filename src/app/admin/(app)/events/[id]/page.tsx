import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateBlock } from "@/components/date-block";
import { EventStatusBadge } from "@/components/event-status-badge";
import { FormSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { formatStatCounts, totalsByEvent } from "@/lib/events/stats";
import { eventStatus } from "@/lib/events/status";
import { occurrences } from "@/lib/events/recurrence";
import { formatManila, utcToManilaInput } from "@/lib/time";
import { updateEvent } from "../actions";
import { EventForm } from "../event-form";
import { EventActions } from "./event-actions";
import { UpcomingWeeks, type Week } from "./upcoming-weeks";

export const metadata: Metadata = { title: "Edit event" };

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  // params is request data, so it's read inside the boundary; the layout around it still
  // prerenders (Next 16 Cache Components).
  return (
    <Suspense fallback={<FormSkeleton label="Loading event" />}>
      {params.then(({ id }) => (
        <EditEvent id={id} />
      ))}
    </Suspense>
  );
}

async function EditEvent({ id }: { id: string }) {
  // Check access before touching the database.
  await requireAdmin();
  const [event, ministries, statRows] = await Promise.all([
    db.event.findFirst({ where: { id, deletedAt: null } }),
    db.ministry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.eventStat.groupBy({ by: ["eventId", "type"], where: { eventId: id }, _count: true }),
  ]);
  if (!event) notFound();
  const status = eventStatus(event);
  // The public address this request came in on (production, a preview, or localhost).
  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;

  // Weekly events: the next 8 weeks (skipped ones included) for Skip / Bring back.
  const now = new Date();
  const weeks: Week[] =
    event.recurrence === "WEEKLY"
      ? occurrences(event, now, new Date(now.getTime() + 8 * 7 * 86_400_000), {
          includeSkipped: true,
        })
          .slice(0, 8)
          .map((o) => ({
            startsAt: o.startsAt.toISOString(),
            label: formatManila(o.startsAt, { weekday: "long", month: "short", day: "numeric" }),
            skipped: o.skipped,
          }))
      : [];

  return (
    <>
      <div className="flex gap-4">
        <DateBlock date={event.startsAt} />
        <div className="flex min-w-0 flex-col gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">
              {event.title}
            </h1>
            <EventStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Link:{" "}
            {status === "draft" ? (
              <span className="break-all text-foreground">/events/{event.slug}</span>
            ) : (
              <Link
                href={`/events/${event.slug}`}
                className="break-all text-foreground underline underline-offset-4"
              >
                /events/{event.slug}
              </Link>
            )}
            {/* Drafts have no public page, so nothing to scan to yet. */}
            {status !== "draft" && (
              <>
                {" · "}
                <Link
                  href={`/events/${event.slug}/qr`}
                  className="text-foreground underline underline-offset-4"
                >
                  Print QR code
                </Link>
              </>
            )}
            <br />
            The link stays the same when you edit, so shared posts keep working.
          </p>
          {status !== "draft" && (
            <p className="text-sm font-medium">
              {formatStatCounts(totalsByEvent(statRows).get(event.id) ?? { VIEW: 0, COPY: 0, SHARE: 0 })}
            </p>
          )}
          {status !== "draft" && (
            // Facebook and Messenger cache a link's preview; a new share card URL alone isn't
            // picked up until Facebook re-reads the page (brief §6.3).
            <p className="text-sm text-muted-foreground">
              Already posted the link? After saving changes,{" "}
              <a
                href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(`${origin}/events/${event.slug}`)}`}
                target="_blank"
                rel="noopener"
                className="text-foreground underline underline-offset-4"
              >
                refresh the preview on Facebook
              </a>{" "}
              and tap <span className="font-medium text-foreground">Scrape Again</span>.
            </p>
          )}
        </div>
      </div>

      {status === "cancelled" && (
        <div role="note" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="font-semibold text-destructive">This event is cancelled.</p>
          <p className="text-sm">
            {event.cancelNote ?? "Its page shows a Cancelled notice."}
          </p>
        </div>
      )}

      <EventActions id={event.id} status={status} />

      {weeks.length > 0 && <UpcomingWeeks id={event.id} weeks={weeks} />}

      <EventForm
        action={updateEvent.bind(null, event.id)}
        ministries={ministries}
        submitLabel="Save changes"
        defaults={{
          title: event.title,
          description: event.description ?? "",
          // All-day events use date-only pickers, so only the date part is filled in.
          startsAt: utcToManilaInput(event.startsAt).slice(0, event.allDay ? 10 : 16),
          endsAt: utcToManilaInput(event.endsAt).slice(0, event.allDay ? 10 : 16),
          allDay: event.allDay ? "on" : "",
          recurrence: event.recurrence,
          recurrenceUntil: event.recurrenceUntil
            ? utcToManilaInput(event.recurrenceUntil).slice(0, 10)
            : "",
          venue: event.venue,
          atChurchVenue: event.atChurchVenue ? "on" : "",
          ministryId: event.ministryId ?? "",
          contactPerson: event.contactPerson ?? "",
          attire: event.attire ?? "",
          posterUrl: event.posterUrl ?? "",
        }}
      />
    </>
  );
}
