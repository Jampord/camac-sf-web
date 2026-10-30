import { cn } from "@/lib/utils";

// Loading placeholders shaped like what's coming, so the page feels already there.
// Event rows are blank wall-calendar pages: the maroon header strip of a tear-off calendar
// over an empty day. They pulse gently; with reduced motion they just sit still.

// Text-colored at low opacity, so the bars show on white and on the dark background alike.
const bar = "rounded-md bg-foreground/10";

function CalendarPage() {
  return (
    <div className="flex h-[3.75rem] w-16 shrink-0 flex-col overflow-hidden rounded-lg border">
      <div className="h-2 bg-primary/70" />
      <div className="flex flex-1 items-center justify-center">
        <div className={cn(bar, "h-5 w-7")} />
      </div>
    </div>
  );
}

function RowSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex gap-4 py-3">
      <CalendarPage />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className={cn(bar, "h-6 w-3/5")} />
        {Array.from({ length: lines - 1 }, (_, i) => (
          <div key={i} className={cn(bar, "h-4", i % 2 ? "w-1/3" : "w-1/2")} />
        ))}
      </div>
    </div>
  );
}

/** Stand-in for a list of events (public agenda, past events, admin list). */
export function EventListSkeleton({
  label = "Loading events",
  filter = false,
  rows = 4,
}: {
  label?: string;
  /** Also stand in for the ministry dropdown row above the list. */
  filter?: boolean;
  rows?: number;
}) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-6 motion-safe:animate-pulse">
      {filter && (
        <div className="flex items-center justify-between gap-4">
          <div className={cn(bar, "h-11 w-56")} />
          <div className={cn(bar, "h-5 w-24")} />
        </div>
      )}
      <div className="flex flex-col">
        <div className={cn(bar, "mb-2 h-7 w-32")} />
        {Array.from({ length: rows }, (_, i) => (
          <RowSkeleton key={i} lines={i % 2 ? 2 : 3} />
        ))}
      </div>
    </div>
  );
}

/** Stand-in for an admin form page: a title, then labelled fields. */
export function FormSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="flex gap-4">
        <CalendarPage />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className={cn(bar, "h-8 w-2/3")} />
          <div className={cn(bar, "h-4 w-1/2")} />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className={cn(bar, "h-4 w-20")} />
          <div className={cn(bar, "h-10 w-full")} />
        </div>
      ))}
    </div>
  );
}
