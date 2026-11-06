import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
  QrCodeIcon,
} from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { posterImageUrl } from "@/lib/cloudinary";
import { eventAddress, fullLocation, mapsUrl } from "@/lib/events/address";
import { getChurchAddress, getPublishedEventBySlug } from "@/lib/events/public";
import { SHARE_CARD_SIZE, shareCardPath } from "@/lib/events/share-card";
import {
  describeRepeat,
  nextOccurrence,
  occurrences,
  type Series,
} from "@/lib/events/recurrence";
import { formatManila } from "@/lib/time";
import { cn } from "@/lib/utils";
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
  const address = eventAddress(event, await getChurchAddress());
  // Calendars and the copied announcement get the venue with its address, so Maps finds it.
  const location = fullLocation(event.venue, address);
  const weekly = event.recurrence === "WEEKLY";

  // The two big buttons under the facts: calendar first, then directions.
  const bigButton = "h-14 flex-1 basis-44 text-lg";

  return (
    <>
      <OpenBeacon slug={event.slug} />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-6">
        {/* What, when and where come first, large: most people open this page from a link in
            the group chat and want only that (UI redesign). The rest is below. */}
        <div className="flex flex-col gap-5">
          <Link
            href="/events"
            className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeftIcon className="size-5" aria-hidden />
            All events
            <InlinePending />
          </Link>

          {cancelled && (
            <div role="note" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-xl font-bold text-destructive">This event is cancelled</p>
              {event.cancelNote && <p className="mt-1 text-lg font-medium">{event.cancelNote}</p>}
            </div>
          )}
          {/* Depends on the current time, so it renders per request; the rest stays cached. */}
          <Suspense>
            <EndedNotice series={event} />
          </Suspense>

          <div className="flex flex-col items-start gap-3">
            <Badge className="bg-accent text-sm text-accent-foreground">
              {event.ministry?.name ?? "Church-wide"}
            </Badge>
            <h1
              className={cn(
                "font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl",
                cancelled && "text-muted-foreground line-through",
              )}
            >
              {event.title}
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            <Fact icon={CalendarDaysIcon}>
              {weekly ? (
                <>
                  <strong className="block text-xl">{describeRepeat(event)}</strong>
                  <Suspense>
                    <UpcomingWeeks series={event} />
                  </Suspense>
                  {event.recurrenceUntil && (
                    <span className="block text-muted-foreground">
                      Until {longDate(event.recurrenceUntil)}
                    </span>
                  )}
                </>
              ) : (
                <strong className="block text-xl">{formatLongDates(event.startsAt, event.endsAt)}</strong>
              )}
            </Fact>
            <Fact icon={ClockIcon}>
              <strong className="block text-xl">
                {formatTimes(event.startsAt, event.endsAt, event.allDay)}
              </strong>
            </Fact>
            <Fact icon={MapPinIcon}>
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-xl">{event.venue}</strong>
                {event.atChurchVenue && (
                  <Badge className="bg-accent text-accent-foreground">At the church</Badge>
                )}
              </span>
              {address && <span className="block text-muted-foreground">{address}</span>}
            </Fact>
          </div>

          <div className="flex flex-wrap gap-3">
            <Suspense>
              <AddToCalendar
                event={{ ...event, venue: location }}
                slug={event.slug}
                className={cn(buttonVariants({ size: "lg" }), bigButton)}
              />
            </Suspense>
            {address && (
              <a
                href={mapsUrl(address)}
                target="_blank"
                rel="noopener"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), bigButton)}
              >
                <MapIcon className="size-6" aria-hidden />
                Open in Maps
              </a>
            )}
          </div>
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
              className="max-h-[70vh] w-auto rounded-xl border object-contain"
            />
          </a>
        )}

        {event.description && (
          // Admins write in their own words (often Taglish); keep their line breaks.
          <p className="text-lg leading-relaxed whitespace-pre-line">{event.description}</p>
        )}

        {(event.attire || event.contactPerson) && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-lg">
            {event.attire && <Detail label="What to wear">{event.attire}</Detail>}
            {event.contactPerson && <Detail label="Contact">{event.contactPerson}</Detail>}
          </dl>
        )}

        {/* Mostly for the announcements volunteer, so it sits below what members need. */}
        <section aria-labelledby="share-heading" className="flex flex-col gap-3 border-t pt-6">
          <h2 id="share-heading" className="text-lg text-muted-foreground">
            Telling others about it?
          </h2>
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
                  venue: location,
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
        </section>

        <Link href="/events" className={cn(buttonVariants({ size: "lg" }), "h-14 w-full text-lg")}>
          See all events
        </Link>
      </main>
    </>
  );
}

/** One line of what, when or where: an icon, then the big text and anything under it. */
function Fact({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_1fr] items-start gap-3 text-lg">
      <Icon className="mt-0.5 size-7 text-primary" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="font-bold">{label}</dt>
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
      {next && <span className="block">Next: {longDate(next.startsAt)}</span>}
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
