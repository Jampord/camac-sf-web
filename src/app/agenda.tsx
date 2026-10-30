import Link from "next/link";
import { connection } from "next/server";
import { DateBlock } from "@/components/date-block";
import { InlinePending, RowPending } from "@/components/link-pending";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAgenda,
  liveStatus,
  type AgendaEntry,
  type LiveStatus,
  type WeeklySummary,
} from "@/lib/events/agenda";
import { formatDayTimes, formatTimes, groupByMonth, isSameManilaDay } from "@/lib/events/format";
import { getMinistries, getPublishedEvents, type PublicEvent } from "@/lib/events/public";
import { slugify } from "@/lib/slug";
import { formatManila, manilaWeekday } from "@/lib/time";
import { cn } from "@/lib/utils";
import { MinistryFilter } from "./ministry-filter";

// The public agenda (brief §6.2): this week first, with what's on now and what starts soon
// called out; then each weekly service once; then special events by month. Church-wide events
// (no ministry) show under every filter.

type Entry = AgendaEntry<PublicEvent>;

export async function Agenda({ ministry }: { ministry?: string }) {
  // The event list comes from the cache; "now" and "soon" are decided per request.
  await connection();
  const [events, ministries] = await Promise.all([getPublishedEvents(), getMinistries()]);
  const now = new Date();

  const selected = ministries.find((m) => slugify(m.name) === ministry);
  const shown = events.filter(
    (event) => !selected || event.ministryId === null || event.ministryId === selected.id,
  );
  const { thisWeek, weekly, later } = buildAgenda(shown, now);
  const empty = thisWeek.length === 0 && weekly.length === 0 && later.length === 0;

  return (
    <MinistryFilter
      ministries={ministries.map((m) => ({ name: m.name, slug: slugify(m.name) }))}
      selected={selected ? slugify(selected.name) : undefined}
      aside={
        // One tap to past events (brief §6.2).
        <Link
          href="/past"
          className="ml-auto flex h-11 items-center gap-2 rounded-md font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Past events
          <InlinePending />
        </Link>
      }
    >
      {empty ? (
        <EmptyAgenda ministryName={selected?.name} />
      ) : (
        <>
          <section aria-labelledby="this-week">
            <h2 id="this-week" className="mb-2 text-2xl font-bold tracking-tight">
              This week
            </h2>
            {thisWeek.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {thisWeek.map((entry) => (
                  <AgendaRow key={entryKey(entry)} entry={entry} now={now} />
                ))}
              </ul>
            ) : (
              <p className="text-lg text-muted-foreground">Nothing in the next 7 days.</p>
            )}
          </section>

          {weekly.length > 0 && <EveryWeek series={weekly} />}

          {groupByMonth(later, (entry) => entry.day.date).map(([month, entries]) => (
            <section key={month} aria-labelledby={`month-${slugify(month)}`}>
              {/* Stays pinned while you scroll that month, so you always know where you are. */}
              <h2
                id={`month-${slugify(month)}`}
                className="sticky top-0 z-10 mb-2 bg-background py-2 text-2xl font-bold tracking-tight"
              >
                {month}
              </h2>
              <ul className="flex flex-col gap-1">
                {entries.map((entry) => (
                  <AgendaRow key={entryKey(entry)} entry={entry} now={now} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </MinistryFilter>
  );
}

const entryKey = ({ event, startsAt, day }: Entry) =>
  `${event.id}-${startsAt.getTime()}-${day.index}`;

const rowLink =
  "relative -mx-2 flex gap-4 rounded-lg px-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function AgendaRow({ entry, now }: { entry: Entry; now: Date }) {
  const { event, startsAt, endsAt, day } = entry;
  const cancelled = event.cancelledAt !== null;
  const live = cancelled ? null : liveStatus(entry, now);
  const today = isSameManilaDay(day.date, now);
  const times = formatDayTimes({ startsAt, endsAt, allDay: event.allDay }, day);

  if (live?.kind === "now") return <NowRow entry={entry} />;

  // Weekly services are familiar: one quiet line, so special events stand out.
  if (event.recurrence === "WEEKLY") {
    return (
      <li>
        <Link href={`/events/${event.slug}`} className={cn(rowLink, "py-2 hover:bg-muted")}>
          <DateBlock date={day.date} today={today} />
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <h3 className={cn("text-lg font-semibold", cancelled && "text-muted-foreground line-through")}>
              {event.title}
            </h3>
            <SoonLabel live={live} />
            <p className="text-muted-foreground">
              {cancelled ? "Cancelled" : times}
            </p>
          </div>
          <RowPending />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link href={`/events/${event.slug}`} className={cn(rowLink, "py-4 hover:bg-muted")}>
        <DateBlock date={day.date} today={today} />
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                "text-xl leading-snug font-bold",
                cancelled && "text-muted-foreground line-through",
              )}
            >
              {event.title}
            </h3>
            {cancelled && <Badge variant="destructive">Cancelled</Badge>}
          </div>
          <SoonLabel live={live} />
          {day.total > 1 && (
            <p className="font-semibold text-primary">
              Day {day.index} of {day.total}
            </p>
          )}
          {cancelled && event.cancelNote && <p className="font-medium">{event.cancelNote}</p>}
          <p>{times}</p>
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {event.venue}
            {event.atChurchVenue && (
              <Badge className="bg-accent text-accent-foreground">At the church</Badge>
            )}
          </p>
          <p className="text-muted-foreground">{event.ministry?.name ?? "Church-wide"}</p>
        </div>
        <RowPending />
      </Link>
    </li>
  );
}

/** The one loud thing on the page: whatever is going on right now, filled in maroon. */
function NowRow({ entry }: { entry: Entry }) {
  const { event, endsAt, day } = entry;
  const until = event.allDay
    ? "all day"
    : day.index < day.total
      ? `until ${formatManila(endsAt, { weekday: "short", hour: "numeric", minute: "2-digit" })}`
      : `until ${formatManila(endsAt, { hour: "numeric", minute: "2-digit" })}`;

  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className={cn(
          rowLink,
          "bg-primary py-4 text-primary-foreground hover:bg-primary/90 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <DateBlock date={day.date} inverted />
        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <p className="flex items-start gap-2 font-semibold">
            {/* A slow pulse: the only animation on the page, because it's live. */}
            <span aria-hidden className="relative mt-[0.45em] flex size-2.5 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2.5 rounded-full bg-current" />
            </span>
            Happening now, {until}
          </p>
          <h3 className="text-2xl leading-snug font-bold">{event.title}</h3>
          {day.total > 1 && (
            <p className="font-semibold">
              Day {day.index} of {day.total}
            </p>
          )}
          <p className="opacity-90">{event.venue}</p>
        </div>
        <RowPending />
      </Link>
    </li>
  );
}

function SoonLabel({ live }: { live: LiveStatus }) {
  if (live?.kind !== "soon") return null;
  return (
    <p className="w-fit rounded-md bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
      {live.label}
    </p>
  );
}

/** Each weekly service once, so the months below are left for special events. */
function EveryWeek({ series }: { series: WeeklySummary<PublicEvent>[] }) {
  return (
    <section aria-labelledby="every-week" className="rounded-lg bg-muted p-4">
      <h2 id="every-week" className="mb-2 text-2xl font-bold tracking-tight">
        Every week
      </h2>
      <ul className="flex flex-col">
        {series.map(({ event, skipped }) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.slug}`}
              className={cn(rowLink, "gap-3 py-2 hover:bg-background")}
            >
              {/* Sundays in calendar red, like the dates. */}
              <span
                className={cn(
                  "w-24 shrink-0 pt-0.5 font-semibold",
                  manilaWeekday(event.startsAt) === 0 && "text-sunday",
                )}
              >
                {formatManila(event.startsAt, { weekday: "long" })}s
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-lg font-semibold">{event.title}</span>
                <span className="text-muted-foreground">
                  {formatTimes(event.startsAt, event.endsAt, event.allDay)}, {event.venue}
                </span>
                {/* Skipped weeks stay visible, so nobody turns up to an empty church. */}
                {skipped.map((date) => (
                  <span key={date.getTime()} className="font-medium text-destructive">
                    Not on {formatManila(date, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                ))}
              </span>
              <RowPending />
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
