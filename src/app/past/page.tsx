import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon } from "lucide-react";
import { DateBlock } from "@/components/date-block";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  eventDays,
  formatShortDateRange,
  formatTimes,
  groupByMonth,
} from "@/lib/events/format";
import { getPublishedEvents, type PublicEvent } from "@/lib/events/public";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Past events",
  description: "Events CAMAC - San Fernando held in the last 12 months.",
};

// Past events (brief §6.2): one tap from the agenda. Phase 3 adds a "Photos" link per event
// to its Facebook album. Weekly series are left out; a year of Sundays would bury the rest.

const MONTHS_BACK = 12;

export default function PastEventsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          Upcoming events
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight">Past events</h1>
          <p className="text-muted-foreground">From the last {MONTHS_BACK} months, newest first.</p>
        </div>
        <Suspense fallback={<p className="text-muted-foreground">Loading events…</p>}>
          <PastList />
        </Suspense>
      </main>
    </>
  );
}

async function PastList() {
  // The event list is cached; which ones count as past depends on the current time.
  await connection();
  const now = new Date();
  const since = new Date(now);
  since.setMonth(since.getMonth() - MONTHS_BACK);

  const past = (await getPublishedEvents())
    .filter((e) => e.recurrence !== "WEEKLY" && e.endsAt < now && e.endsAt >= since)
    .reverse(); // the cache is soonest first; newest first here

  if (past.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
        No past events yet. Events show up here once they&apos;ve ended.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByMonth(past, (e) => e.startsAt).map(([month, events]) => (
        <section key={month} aria-labelledby={`past-${slugify(month)}`}>
          <h2
            id={`past-${slugify(month)}`}
            className="sticky top-0 z-10 bg-background py-2 text-2xl font-bold tracking-tight"
          >
            {month}
          </h2>
          <ul className="flex flex-col divide-y border-y">
            {events.map((event) => (
              <PastRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PastRow({ event }: { event: PublicEvent }) {
  const cancelled = event.cancelledAt !== null;
  const multiDay = eventDays(event.startsAt, event.endsAt).length > 1;

  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className="-mx-2 flex gap-4 rounded-lg px-2 py-4 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <DateBlock date={event.startsAt} />
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
          {multiDay && (
            <p className="font-medium">{formatShortDateRange(event.startsAt, event.endsAt)}</p>
          )}
          <p>{formatTimes(event.startsAt, event.endsAt, event.allDay)}</p>
          <p className="text-muted-foreground">{event.venue}</p>
          <p className="text-muted-foreground">{event.ministry?.name ?? "Church-wide"}</p>
        </div>
      </Link>
    </li>
  );
}
