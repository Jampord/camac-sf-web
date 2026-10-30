import Link from "next/link";
import { connection } from "next/server";
import { DateBlock } from "@/components/date-block";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  eventDays,
  formatDayTimes,
  groupByMonth,
  isSameManilaDay,
  type EventDay,
} from "@/lib/events/format";
import { getMinistries, getPublishedEvents, type PublicEvent } from "@/lib/events/public";
import { slugify } from "@/lib/slug";
import { manilaMidnight } from "@/lib/time";
import { cn } from "@/lib/utils";

// The public agenda (brief §6.2): upcoming events by month, with ministry filter chips.
// Church-wide events (no ministry) show under every filter. Multi-day events appear on every
// day they span, labeled "Day 1 of 3" (brief §6.1).

/** One row of the agenda: an event on one of its days. */
type AgendaEntry = { event: PublicEvent; day: EventDay };

export async function Agenda({ ministry }: { ministry?: string }) {
  // The event list comes from the cache; "upcoming" is decided per request, against now.
  await connection();
  const [events, ministries] = await Promise.all([getPublishedEvents(), getMinistries()]);
  const now = new Date();

  const selected = ministries.find((m) => slugify(m.name) === ministry);
  const today = manilaMidnight(now);
  const entries: AgendaEntry[] = events
    .filter(
      (event) =>
        event.endsAt >= now &&
        (!selected || event.ministryId === null || event.ministryId === selected.id),
    )
    // A retreat that already started shows from today's day onwards.
    .flatMap((event) =>
      eventDays(event.startsAt, event.endsAt)
        .filter((day) => day.date >= today)
        .map((day) => ({ event, day })),
    )
    .sort((a, b) => entryTime(a) - entryTime(b));

  return (
    <>
      <MinistryFilter ministries={ministries} selectedId={selected?.id} />
      {entries.length > 0 ? (
        <AgendaList entries={entries} now={now} />
      ) : (
        <EmptyAgenda ministryName={selected?.name} />
      )}
    </>
  );
}

/** Order within a day: ongoing multi-day events (from midnight) first, then by start time. */
function entryTime({ event, day }: AgendaEntry): number {
  return day.index === 1 ? event.startsAt.getTime() : day.date.getTime();
}

function MinistryFilter({
  ministries,
  selectedId,
}: {
  ministries: { id: string; name: string }[];
  selectedId?: string;
}) {
  const chips = [
    { key: "all", label: "All events", href: "/", active: !selectedId },
    ...ministries.map((m) => ({
      key: m.id,
      label: m.name,
      href: `/?ministry=${slugify(m.name)}`,
      active: m.id === selectedId,
    })),
  ];

  // Chips wrap instead of scrolling sideways: a hidden horizontal scroll is easy to miss.
  return (
    <nav aria-label="Filter by ministry">
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.href}
              scroll={false}
              aria-current={chip.active ? "true" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-full border px-4 font-medium outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                chip.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted",
              )}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AgendaList({ entries, now }: { entries: AgendaEntry[]; now: Date }) {
  return (
    <div className="flex flex-col gap-6">
      {groupByMonth(entries, (entry) => entry.day.date).map(([month, monthEntries]) => (
        <section key={month} aria-labelledby={`month-${slugify(month)}`}>
          {/* Stays pinned while you scroll that month, so you always know where you are. */}
          <h2
            id={`month-${slugify(month)}`}
            className="sticky top-0 z-10 bg-background py-2 text-2xl font-bold tracking-tight"
          >
            {month}
          </h2>
          <ul className="flex flex-col divide-y border-y">
            {monthEntries.map(({ event, day }) => (
              <AgendaRow
                key={`${event.id}-${day.index}`}
                event={event}
                day={day}
                today={isSameManilaDay(day.date, now)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AgendaRow({ event, day, today }: { event: PublicEvent; day: EventDay; today: boolean }) {
  const cancelled = event.cancelledAt !== null;

  // The whole row is the link: a big tap target, and the title is its accessible name.
  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className="-mx-2 flex gap-4 rounded-lg px-2 py-4 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <DateBlock date={day.date} today={today} />
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                "text-xl leading-snug font-semibold",
                cancelled && "text-muted-foreground line-through",
              )}
            >
              {event.title}
            </h3>
            {cancelled && <Badge variant="destructive">Cancelled</Badge>}
          </div>
          {day.total > 1 && (
            <p className="font-semibold text-primary">
              Day {day.index} of {day.total}
            </p>
          )}
          {cancelled && event.cancelNote && <p className="font-medium">{event.cancelNote}</p>}
          <p>{formatDayTimes(event, day)}</p>
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {event.venue}
            {event.atChurchVenue && (
              <Badge className="bg-accent text-accent-foreground">At the church</Badge>
            )}
          </p>
          <p className="text-muted-foreground">{event.ministry?.name ?? "Church-wide"}</p>
        </div>
      </Link>
    </li>
  );
}

function EmptyAgenda({ ministryName }: { ministryName?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
      <p className="text-xl font-semibold">
        {ministryName ? `No upcoming ${ministryName} events` : "No upcoming events yet"}
      </p>
      <p className="text-muted-foreground">
        New events are posted here and on the church Facebook page.
      </p>
      {ministryName && (
        <Link href="/" scroll={false} className={buttonVariants({ variant: "outline" })}>
          Show all events
        </Link>
      )}
    </div>
  );
}
