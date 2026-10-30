import Link from "next/link";
import { DateBlock } from "@/components/date-block";
import { EventStatusBadge } from "@/components/event-status-badge";
import { RowPending } from "@/components/link-pending";
import {
  eventDays,
  formatShortDateRange,
  formatTimes,
  groupByMonth,
  isSameManilaDay,
} from "@/lib/events/format";
import { describeRepeat } from "@/lib/events/recurrence";
import { formatStatCounts, type StatTotals } from "@/lib/events/stats";
import { eventStatus } from "@/lib/events/status";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export type ListedEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  recurrence: "NONE" | "WEEKLY";
  venue: string;
  publishedAt: Date | null;
  cancelledAt: Date | null;
  deletedAt: Date | null;
  ministry: { name: string } | null;
};

/** Events grouped under Manila month headings, in the order given. */
export function EventList({
  events,
  now,
  stats,
}: {
  events: ListedEvent[];
  now: Date;
  stats: Map<string, StatTotals>;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groupByMonth(events, (event) => event.startsAt).map(([heading, monthEvents]) => (
        // ids can't contain spaces: aria-labelledby treats a space as a separator between ids.
        <section key={heading} aria-labelledby={`admin-month-${slugify(heading)}`}>
          <h2 id={`admin-month-${slugify(heading)}`} className="mb-2 text-lg font-bold">
            {heading}
          </h2>
          <ul className="flex flex-col divide-y border-y">
            {monthEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                today={isSameManilaDay(event.startsAt, now)}
                stats={stats.get(event.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EventRow({
  event,
  today,
  stats = { VIEW: 0, COPY: 0, SHARE: 0 },
}: {
  event: ListedEvent;
  today: boolean;
  stats?: StatTotals;
}) {
  const status = eventStatus(event);
  const cancelled = status === "cancelled";

  // The whole row is the link: a big tap target, and the title is its accessible name.
  return (
    <li>
      <Link
        href={`/admin/events/${event.id}`}
        className="relative -mx-2 flex gap-4 rounded-lg px-2 py-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <DateBlock date={event.startsAt} today={today} />
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn("font-semibold", cancelled && "text-muted-foreground line-through")}>
              {event.title}
            </h3>
            <EventStatusBadge status={status} />
          </div>
          {event.recurrence === "WEEKLY" && (
            <p className="text-sm font-medium">{describeRepeat(event)}</p>
          )}
          {/* Admins see each event once; multi-day ones show their date range. */}
          {eventDays(event.startsAt, event.endsAt).length > 1 && (
            <p className="text-sm font-medium">{formatShortDateRange(event.startsAt, event.endsAt)}</p>
          )}
          <p className="text-sm">{formatTimes(event.startsAt, event.endsAt, event.allDay)}</p>
          <p className="text-sm text-muted-foreground">{event.venue}</p>
          <p className="text-sm text-muted-foreground">{event.ministry?.name ?? "Church-wide"}</p>
          {/* Drafts can't be opened by anyone yet. */}
          {status !== "draft" && <p className="text-sm font-medium">{formatStatCounts(stats)}</p>}
        </div>
        <RowPending />
      </Link>
    </li>
  );
}
