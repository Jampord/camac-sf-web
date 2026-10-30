import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, DownloadIcon } from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { PrintButton } from "@/components/print-button";
import { buttonVariants } from "@/components/ui/button";
import { qrSvg, shortUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";

// A printable QR sheet (brief §6.6): half an A4 (A5) for bulletins and the church door, plus the
// plain PNG for slides. Every size on the sheet is a share of its width (cqw), so the screen
// preview is a scaled copy of what prints. Always black on white, even in dark mode.
// `children` is the sheet's heading; use cqw sizes there too.

export async function QrSheet({
  url,
  label,
  scanText,
  pngHref,
  back,
  children,
}: {
  /** The full address the code opens. */
  url: string;
  /** Names the sheet for screen readers. */
  label: string;
  /** The line under the code saying why to scan it. */
  scanText: string;
  pngHref: string;
  back: { href: string; label: string };
  children: React.ReactNode;
}) {
  const svg = await qrSvg(url);

  return (
    <>
      {/* Half an A4, portrait. Only the sheet prints. */}
      <style>{`@page { size: A5 portrait; margin: 10mm; }`}</style>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={back.href}
          className="-ml-1 flex items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          {back.label}
          <InlinePending />
        </Link>
        <div className="flex flex-wrap gap-3">
          <a
            href={pngHref}
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
        aria-label={label}
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

        <div className="mt-[6cqw] flex flex-col items-center gap-[1.5cqw]">{children}</div>

        {/* Generated here from our own URL, not user input. */}
        <div
          className="mt-auto w-[68cqw] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-[1.5cqw] text-[3.6cqw] font-semibold">{scanText}</p>
        <p className="mt-[0.5cqw] text-[3.4cqw] break-all text-[#5f5f5f]">{shortUrl(url)}</p>
      </article>
    </>
  );
}

/** Stands in for the sheet while it loads, at the same proportions so nothing jumps. */
export function QrSheetSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="aspect-[148/210] w-full max-w-[148mm] rounded-lg bg-foreground/10 motion-safe:animate-pulse"
    />
  );
}
