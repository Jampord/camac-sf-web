"use client";

import { CopyButton } from "@/components/copy-button";
import { announcementText, type AnnouncementEvent } from "@/lib/events/announcement";
import { recordStat } from "@/lib/events/stats";

// Copies the ready-to-paste announcement (brief §6.3). The link is built from the address the
// page is open on, so it is right on production, previews and localhost alike, without the
// query strings a shared link can pick up (e.g. Facebook's ?fbclid=).

export function CopyAnnouncement({ event, slug }: { event: AnnouncementEvent; slug: string }) {
  return (
    <CopyButton
      variant="outline"
      size="lg"
      className="w-full text-base sm:w-fit"
      label="Copy announcement"
      what="announcement"
      text={() => announcementText(event, `${window.location.origin}/events/${slug}`)}
      // Counted on the tap: when the browser blocks copying, they copy it by hand instead.
      onCopy={() => recordStat(slug, "COPY")}
    />
  );
}
