import { DateBlock } from "@/components/date-block";
import { EventStatusBadge } from "@/components/event-status-badge";
import { formatMonthHeading, formatTimeRange, isSameManilaDay } from "@/lib/events/format";
import { eventStatus } from "@/lib/events/status";
import { cn } from "@/lib/utils";

export type ListedEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  publishedAt: Date | null;
  cancelledAt: Date | null;
  deletedAt: Date | null;
  ministry: { name: string } | null;
};

/** Events grouped under Manila month headings, in the order given. */
export function EventList({ events, now }: { events: ListedEvent[]; now: Date }) {
  const months = new Map<string, ListedEvent[]>();
  for (const event of events) {
    const heading = formatMonthHeading(event.startsAt);
    months.set(heading, [...(months.get(heading) ?? []), event]);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...months].map(([heading, monthEvents]) => (
        <section key={heading} aria-labelledby={`month-${heading}`}>
          <h2 id={`month-${heading}`} className="mb-2 text-lg font-bold">
            {heading}
          </h2>
          <ul className="flex flex-col divide-y border-y">
            {monthEvents.map((event) => (
              <EventRow key={event.id} event={event} today={isSameManilaDay(event.startsAt, now)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EventRow({ event, today }: { event: ListedEvent; today: boolean }) {
  const status = eventStatus(event);
  const cancelled = status === "cancelled";

  // Milestone 4 turns each row into a link to the event's edit page.
  return (
    <li className="flex gap-4 py-3">
      <DateBlock date={event.startsAt} today={today} />
      <div className="flex min-w-0 flex-col gap-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className={cn("font-semibold", cancelled && "text-muted-foreground line-through")}>
            {event.title}
          </h3>
          <EventStatusBadge status={status} />
        </div>
        <p className="text-sm">{formatTimeRange(event.startsAt, event.endsAt)}</p>
        <p className="text-sm text-muted-foreground">{event.venue}</p>
        <p className="text-sm text-muted-foreground">{event.ministry?.name ?? "Church-wide"}</p>
      </div>
    </li>
  );
}
