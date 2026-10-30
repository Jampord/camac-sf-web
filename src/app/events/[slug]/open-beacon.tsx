"use client";

import { useEffect, useRef } from "react";
import { recordStat } from "@/lib/events/stats";

// Counts an open once the page has loaded in a real browser (brief §6.4). Link-preview crawlers
// fetch the HTML but don't run this. No deduping: every visit counts.

export function OpenBeacon({ slug }: { slug: string }) {
  // Development's Strict Mode runs effects twice; one page view is one open.
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    recordStat(slug, "VIEW");
  }, [slug]);

  return null;
}
