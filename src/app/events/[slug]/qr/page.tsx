import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { QrSheet, QrSheetSkeleton } from "@/components/qr-sheet";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { eventAddress } from "@/lib/events/address";
import { getChurchAddress, getPublishedEventBySlug } from "@/lib/events/public";
import { describeRepeat } from "@/lib/events/recurrence";
import { cn } from "@/lib/utils";

// Printable QR page for an event (brief §6.6).

export const metadata: Metadata = {
  title: "Print QR code",
  robots: { index: false }, // a tool page, not something to find in search
};

export default function QrPage({ params }: PageProps<"/events/[slug]/qr">) {
  // The URL's slug and the site's address are request data, so the sheet renders inside the
  // boundary; the placeholder has the sheet's proportions so nothing jumps.
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6 print:block print:max-w-none print:p-0">
      <Suspense fallback={<QrSheetSkeleton />}>
        {params.then(({ slug }) => (
          <EventQrSheet slug={slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function EventQrSheet({ slug }: { slug: string }) {
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  const cancelled = event.cancelledAt !== null;
  const address = eventAddress(event, await getChurchAddress());
  const when =
    event.recurrence === "WEEKLY" ? describeRepeat(event) : formatLongDates(event.startsAt, event.endsAt);

  return (
    <QrSheet
      url={`${origin}/events/${slug}`}
      label={`Printable QR code for ${event.title}`}
      scanText="Scan for details and to add it to your calendar"
      pngHref={`/events/${slug}/qr.png`}
      back={{ href: `/events/${slug}`, label: "Back to event" }}
    >
      {cancelled && (
        <span className="rounded-[1cqw] bg-[#d42027] px-[2.5cqw] py-[0.6cqw] text-[4cqw] font-bold text-white">
          Cancelled
        </span>
      )}
      <h1
        className={cn(
          "leading-tight font-bold text-balance",
          event.title.length > 32 ? "text-[6.5cqw]" : "text-[8.5cqw]",
          cancelled && "line-through",
        )}
      >
        {event.title}
      </h1>
      <p className="text-[4.6cqw] font-bold text-[#801214]">{when}</p>
      <p className="text-[4.2cqw]">
        {formatTimes(event.startsAt, event.endsAt, event.allDay)}, {event.venue}
      </p>
      {address && <p className="text-[3.6cqw] text-[#5f5f5f]">{address}</p>}
    </QrSheet>
  );
}
