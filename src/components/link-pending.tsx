"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

// Shows that a tapped link is loading, for pages that can't appear instantly (e.g. an event
// page, which looks its event up before sending anything so a missing one is a real 404).
// Always rendered and only faded in, so nothing shifts; the short delay keeps fast
// navigations from flickering. Must sit inside a <Link>.

/** Fills a row link (which must be `relative`) with a tint and a spinner at its right edge. */
export function RowPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-end rounded-[inherit] bg-foreground/5 pr-3 text-primary transition-opacity",
        pending ? "opacity-100 delay-150" : "opacity-0",
      )}
    >
      <Spinner className="size-5" />
    </span>
  );
}

/** A spinner the size of the text, next to a short link like "Past events". */
export function InlinePending() {
  const { pending } = useLinkStatus();
  return (
    <Spinner
      className={cn("size-[1em] transition-opacity", pending ? "opacity-100 delay-150" : "opacity-0")}
    />
  );
}
