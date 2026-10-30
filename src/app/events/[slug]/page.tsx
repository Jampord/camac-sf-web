import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeftIcon, QrCodeIcon } from "lucide-react";
import { DateBlock } from "@/components/date-block";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { posterImageUrl } from "@/lib/cloudinary";
import { getPublishedEventBySlug } from "@/lib/events/public";
import { SHARE_CARD_SIZE, shareCardPath } from "@/lib/events/share-card";
import {
  describeRepeat,
  nextOccurrence,
  occurrences,
  type Series,
} from "@/lib/events/recurrence";
import { formatManila } from "@/lib/time";
import { AddToCalendar } from "./add-to-calendar";
import { CopyAnnouncement } from "./copy-announcement";
import { OpenBeacon } from "./open-beacon";
import { ShareButton } from "./share-button";

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
  const title = event.cancelledAt ? `Cancelled: ${event.title}` : event.title;
  // Weekly events never name a specific date: link previews are cached (brief §6.3).
  const description =
    event.recurrence === "WEEKLY"
      ? `${describeRepeat(event)}, ${formatTimes(event.startsAt, event.endsAt, event.allDay)} at ${event.venue}.`
      : `${formatLongDates(event.startsAt, event.endsAt)}. ${formatTimes(event.startsAt, event.endsAt, event.allDay)} at ${event.venue}.`;
  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/events/${event.slug}`,
      // Relative URLs are made absolute by Next: the production domain on Vercel.
      images: [
        { url: shareCardPath(event.slug, event.updatedAt), ...SHARE_CARD_SIZE, alt: title },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const event = await findEvent((await params).slug);
  if (!event) notFound();
  const cancelled = event.cancelledAt !== null;
  const weekly = event.recurrence === "WEEKLY";

  return (
    <>
      <OpenBeacon slug={event.slug} />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          All events
          <InlinePending />
        </Link>

        {cancelled && (
          <div role="note" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-xl font-bold text-destructive">This event is cancelled</p>
            {event.cancelNote && <p className="mt-1 text-lg font-medium">{event.cancelNote}</p>}
          </div>
        )}
        {/* Depends on the current time, so it renders per request; the rest stays cached. */}
        <Suspense>
          <EndedNotice series={event} />
        </Suspense>

        <div className="flex gap-4">
          {/* A weekly event has no single date; its next date is under "When". */}
          {!weekly && <DateBlock date={event.startsAt} />}
          <h1
            className={`font-heading pt-1 text-3xl leading-tight font-bold tracking-tight sm:text-4xl ${cancelled ? "text-muted-foreground line-through" : ""}`}
          >
            {event.title}
          </h1>
        </div>

        {event.posterUrl && (
          // Tapping opens the full image, so the poster's small print stays readable.
          <a href={event.posterUrl} target="_blank" rel="noopener" className="w-fit self-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary resizes it; next/image would resize twice */}
            <img
              src={posterImageUrl(event.posterUrl, "f_auto,q_auto,w_800")}
              srcSet={[480, 800, 1200]
                .map((w) => `${posterImageUrl(event.posterUrl!, `f_auto,q_auto,w_${w}`)} ${w}w`)
                .join(", ")}
              sizes="(min-width: 42rem) 40rem, 100vw"
              alt={`Poster for ${event.title}`}
              className="max-h-[70vh] w-auto rounded-lg border object-contain"
            />
          </a>
        )}

        <dl className="grid gap-4 border-y py-5 text-lg sm:grid-cols-[8rem_1fr] sm:gap-x-6">
          <Detail label="When">
            {weekly ? (
              <>
                <span className="block font-semibold">{describeRepeat(event)}</span>
                <span className="block">{formatTimes(event.startsAt, event.endsAt, event.allDay)}</span>
                {event.recurrenceUntil && (
                  <span className="block text-muted-foreground">Until {longDate(event.recurrenceUntil)}</span>
                )}
                <Suspense>
                  <UpcomingWeeks series={event} />
                </Suspense>
              </>
            ) : (
              <>
                <span className="block">{formatLongDates(event.startsAt, event.endsAt)}</span>
                <span className="block">{formatTimes(event.startsAt, event.endsAt, event.allDay)}</span>
              </>
            )}
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

        <Suspense>
          <AddToCalendar event={event} slug={event.slug} />
        </Suspense>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Nothing to announce once it's cancelled, but sharing the page still tells people. */}
          {!cancelled && (
            <CopyAnnouncement
              slug={event.slug}
              event={{
                title: event.title,
                description: event.description,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                allDay: event.allDay,
                venue: event.venue,
                attire: event.attire,
                contactPerson: event.contactPerson,
                recurrence: event.recurrence,
              }}
            />
          )}
          <ShareButton title={event.title} slug={event.slug} />
        </div>

        {/* For bulletins, the church door and slides (brief §6.6). */}
        <Link
          href={`/events/${event.slug}/qr`}
          className="flex w-fit items-center gap-2 rounded-md py-2 font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <QrCodeIcon className="size-5" aria-hidden />
          Print a QR code for this event
          <InlinePending />
        </Link>
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

const longDate = (date: Date) =>
  formatManila(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

/** Next date, plus upcoming skipped weeks so members don't show up to an empty church. */
async function UpcomingWeeks({ series }: { series: Series }) {
  await connection();
  const now = new Date();
  const next = nextOccurrence(series, now);
  const soon = new Date(now.getTime() + 13 * 7 * 24 * 60 * 60 * 1000);
  const skipped = occurrences(series, now, soon, { includeSkipped: true }).filter((o) => o.skipped);

  return (
    <>
      {next && <span className="mt-2 block">Next: {longDate(next.startsAt)}</span>}
      {skipped.map((o) => (
        <span key={o.startsAt.getTime()} className="block font-medium text-destructive">
          Not on {longDate(o.startsAt)}
        </span>
      ))}
    </>
  );
}

/** One-off events end once; a weekly series ends when it has no dates left. */
async function EndedNotice({ series }: { series: Series }) {
  await connection();
  if (nextOccurrence(series, new Date())) return null;
  return (
    <div role="note" className="rounded-lg border bg-muted p-4">
      <p className="text-lg font-semibold">This event has ended</p>
    </div>
  );
}
