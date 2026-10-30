import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, DownloadIcon } from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { buttonVariants } from "@/components/ui/button";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { getPublishedEventBySlug } from "@/lib/events/public";
import { describeRepeat } from "@/lib/events/recurrence";
import { qrSvg, shortUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { PrintButton } from "./print-button";

// Printable QR page (brief §6.6): half an A4 (A5) for bulletins and the church door, plus the
// plain PNG for slides. Every size on the sheet is a share of its width (cqw), so the screen
// preview is a scaled copy of what prints. Always black on white, even in dark mode.

export const metadata: Metadata = {
  title: "Print QR code",
  robots: { index: false }, // a tool page, not something to find in search
};

export default function QrPage({ params }: PageProps<"/events/[slug]/qr">) {
  // The URL's slug and the site's address are request data, so the sheet renders inside the
  // boundary; the placeholder has the sheet's proportions so nothing jumps.
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6 print:block print:max-w-none print:p-0">
      <Suspense
        fallback={
          <div
            role="status"
            aria-label="Loading"
            className="aspect-[148/210] w-full max-w-[148mm] rounded-lg bg-foreground/10 motion-safe:animate-pulse"
          />
        }
      >
        {params.then(({ slug }) => (
          <QrSheet slug={slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function QrSheet({ slug }: { slug: string }) {
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  const url = `${origin}/events/${slug}`;
  const svg = await qrSvg(url);
  const cancelled = event.cancelledAt !== null;
  const when =
    event.recurrence === "WEEKLY" ? describeRepeat(event) : formatLongDates(event.startsAt, event.endsAt);

  return (
    <>
      {/* Half an A4, portrait. Only the sheet prints. */}
      <style>{`@page { size: A5 portrait; margin: 10mm; }`}</style>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/events/${slug}`}
          className="-ml-1 flex items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          Back to event
          <InlinePending />
        </Link>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/events/${slug}/qr.png`}
            download
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-base")}
          >
            <DownloadIcon aria-hidden />
            PNG for slides
          </a>
          <PrintButton />
        </div>
      </div>
      <p className="-mt-3 w-full text-muted-foreground print:hidden">
        Prints on half an A4 (A5). To fit two on one A4, choose 2 pages per sheet when printing.
      </p>

      <article
        aria-label={`Printable QR code for ${event.title}`}
        className="@container flex aspect-[148/210] w-full max-w-[148mm] flex-col items-center rounded-lg bg-white p-[7cqw] text-center text-[#333333] shadow-[0_0_0_1px_rgb(0_0_0/0.12)] print:aspect-auto print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="flex items-center gap-[2.5cqw]">
          <Image src="/camac-mark.png" alt="" width={447} height={418} className="h-[11cqw] w-auto" />
          <span className="flex flex-col text-left">
            <span className="text-[7cqw] leading-[0.85] font-extrabold tracking-tight">CAMAC</span>
            <span className="text-[2.6cqw] leading-none font-semibold tracking-[0.16em] text-[#d42027]">
              SAN FERNANDO
            </span>
          </span>
        </div>

        <div className="mt-[6cqw] flex flex-col items-center gap-[1.5cqw]">
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
        </div>

        {/* Generated here from our own URL, not user input. */}
        <div
          className="mt-auto w-[68cqw] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-[1.5cqw] text-[3.6cqw] font-semibold">Scan for details and to add it to your calendar</p>
        <p className="mt-[0.5cqw] text-[3.4cqw] break-all text-[#5f5f5f]">{shortUrl(url)}</p>
      </article>
    </>
  );
}
