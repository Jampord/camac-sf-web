"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setWeekSkipped } from "../actions";

export type Week = { startsAt: string; label: string; skipped: boolean };

// The next few weeks of a weekly event, each with Skip / Bring back (brief §6.1 skip dates).
// A skipped week disappears from the public calendar and is listed as "Not on …" on the
// event's page, so members know.
export function UpcomingWeeks({ id, weeks }: { id: string; weeks: Week[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(week: Week) {
    startTransition(async () => {
      const { changed } = await setWeekSkipped(id, week.startsAt, !week.skipped);
      if (!changed) {
        toast.error("This event was changed somewhere else. Reload the page to see the latest.");
      } else if (week.skipped) {
        toast.success(`${week.label} is back on the calendar`);
      } else {
        toast.success(`Skipped ${week.label}`);
      }
    });
  }

  return (
    <section aria-labelledby="upcoming-weeks" className="flex flex-col gap-3">
      <div>
        <h2 id="upcoming-weeks" className="text-xl font-bold">
          Upcoming dates
        </h2>
        <p className="text-sm text-muted-foreground">
          Skip a week when it won&apos;t happen, for example during Holy Week.
        </p>
      </div>
      <ul className="flex flex-col divide-y border-y">
        {weeks.map((week) => (
          <li key={week.startsAt} className="flex items-center justify-between gap-3 py-2">
            <span className={week.skipped ? "text-muted-foreground line-through" : undefined}>
              {week.label}
            </span>
            <Button
              variant={week.skipped ? "outline" : "ghost"}
              disabled={pending}
              onClick={() => toggle(week)}
              aria-label={week.skipped ? `Bring back ${week.label}` : `Skip ${week.label}`}
            >
              {week.skipped ? "Bring back" : "Skip"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
