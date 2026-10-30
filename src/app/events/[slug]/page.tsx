import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeftIcon } from "lucide-react";
import { DateBlock } from "@/components/date-block";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { getPublishedEventBySlug } from "@/lib/events/public";

// Public event page (brief §6.2). Drafts, deleted events and wrong links are a real 404:
// the event is looked up before anything streams, so Next can still send the 404 status.

// Cache Components needs at least one param at build time. The placeholder is answered with a
// 404 without touching the database, so the build works without one (as in CI). Real slugs
// render on first visit and are then cached until an admin changes an event.
const BUILD_PLACEHOLDER = "__placeholder__";

export function generateStaticParams() {
  return [{ slug: BUILD_PLACEHOLDER }];
}

async function findEvent(slug: string) {
  return slug === BUILD_PLACEHOLDER ? null : getPublishedEventBySlug(slug);
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = await findEvent((await params).slug);
  if (!event) return {};
  return {
    title: event.cancelledAt ? `Cancelled: ${event.title}` : event.title,
    description: `${formatLongDates(event.startsAt, event.endsAt)}. ${formatTimes(event.startsAt, event.endsAt, event.allDay)} at ${event.venue}.`,
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const event = await findEvent((await params).slug);
  if (!event) notFound();
  const cancelled = event.cancelledAt !== null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          All events
        </Link>

        {cancelled && (
          <div role="note" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-xl font-bold text-destructive">This event is cancelled</p>
            {event.cancelNote && <p className="mt-1 text-lg font-medium">{event.cancelNote}</p>}
          </div>
        )}
        {/* Depends on the current time, so it renders per request; the rest stays cached. */}
        <Suspense>
          <EndedNotice endsAt={event.endsAt} />
        </Suspense>

        <div className="flex gap-4">
          <DateBlock date={event.startsAt} />
          <h1
            className={`font-heading pt-1 text-3xl leading-tight font-bold tracking-tight sm:text-4xl ${cancelled ? "text-muted-foreground line-through" : ""}`}
          >
            {event.title}
          </h1>
        </div>

        <dl className="grid gap-4 border-y py-5 text-lg sm:grid-cols-[8rem_1fr] sm:gap-x-6">
          <Detail label="When">
            <span className="block">{formatLongDates(event.startsAt, event.endsAt)}</span>
            <span className="block">{formatTimes(event.startsAt, event.endsAt, event.allDay)}</span>
          </Detail>
          <Detail label="Where">
            <span className="flex flex-wrap items-center gap-2">
              {event.venue}
              {event.atChurchVenue && (
                <Badge className="bg-accent text-accent-foreground">At the church</Badge>
              )}
            </span>
          </Detail>
          <Detail label="Ministry">{event.ministry?.name ?? "Church-wide"}</Detail>
          {event.attire && <Detail label="Attire">{event.attire}</Detail>}
          {event.contactPerson && <Detail label="Contact">{event.contactPerson}</Detail>}
        </dl>

        {event.description && (
          // Admins write in their own words (often Taglish); keep their line breaks.
          <p className="text-lg leading-relaxed whitespace-pre-line">{event.description}</p>
        )}

        {/* Build steps 3-5: Share / Copy announcement, Add to calendar, printable QR. */}
      </main>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:contents">
      <dt className="text-base font-semibold text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

async function EndedNotice({ endsAt }: { endsAt: Date }) {
  await connection();
  if (endsAt >= new Date()) return null;
  return (
    <div role="note" className="rounded-lg border bg-muted p-4">
      <p className="text-lg font-semibold">This event has ended</p>
    </div>
  );
}
