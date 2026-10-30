import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { QrSheet, QrSheetSkeleton } from "@/components/qr-sheet";

// Printable QR page for the prayer request form (brief §6.6), for the church door and bulletins.
// Shows nothing private: it only points at the public form.

export const metadata: Metadata = {
  title: "Print prayer request QR code",
  robots: { index: false }, // a tool page, not something to find in search
};

export default function PrayerQrPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-6 print:block print:max-w-none print:p-0">
      {/* The site's address is request data, so the sheet renders inside the boundary. */}
      <Suspense fallback={<QrSheetSkeleton />}>
        <PrayerQrSheet />
      </Suspense>
    </main>
  );
}

async function PrayerQrSheet() {
  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;

  return (
    <QrSheet
      url={`${origin}/prayer`}
      label="Printable QR code for the prayer request form"
      scanText="Scan to send your request. You can stay anonymous."
      pngHref="/prayer/qr.png"
      back={{ href: "/prayer", label: "Back to the form" }}
    >
      <h1 className="text-[8.5cqw] leading-tight font-bold text-balance">
        Send a prayer request
      </h1>
      <p className="text-[4.6cqw] font-bold text-[#801214]">Our prayer team would love to pray for you</p>
    </QrSheet>
  );
}
