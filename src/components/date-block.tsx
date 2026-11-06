import { cn } from "@/lib/utils";
import { formatManila, manilaDateParts, manilaWeekday } from "@/lib/time";

// The wall-calendar date: a big day number over a short weekday. Sundays are printed in red,
// like the Filipino store calendars (and the "San Fernando" red of the logo).
// Shared by the admin list and, in build step 2, the public agenda.
export function DateBlock({
  date,
  today = false,
  inverted = false,
}: {
  date: Date;
  today?: boolean;
  /** On a filled background (e.g. "Happening now"): inherit the text color, no red, no tint. */
  inverted?: boolean;
}) {
  if (inverted) {
    return (
      <div className="flex w-16 shrink-0 flex-col items-center py-1.5">
        <span className="text-4xl leading-none font-bold tracking-tight tabular-nums">
          {manilaDateParts(date).day}
        </span>
        <span className="mt-1 text-sm font-medium">{formatManila(date, { weekday: "short" })}</span>
      </div>
    );
  }
  const sunday = manilaWeekday(date) === 0;

  return (
    // A small card, like a page torn from a wall calendar, with the day in the heading serif.
    <div
      className={cn(
        "flex w-16 shrink-0 flex-col items-center rounded-xl border bg-card py-1.5",
        today && "border-accent-foreground/30 bg-accent",
      )}
    >
      <span
        className={cn(
          "font-heading text-4xl leading-none font-semibold tabular-nums",
          sunday ? "text-sunday" : "text-primary",
        )}
      >
        {manilaDateParts(date).day}
      </span>
      <span className={cn("mt-1 text-sm font-medium", sunday ? "text-sunday" : "text-muted-foreground")}>
        {formatManila(date, { weekday: "short" })}
      </span>
      {today && <span className="text-xs font-semibold text-accent-foreground">Today</span>}
    </div>
  );
}
