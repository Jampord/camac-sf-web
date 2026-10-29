import type { EventStatus } from "@/lib/events/status";
import { formatManila } from "@/lib/time";

export const buttonClass =
  "rounded-lg border-2 border-foreground px-4 py-2 font-semibold disabled:opacity-50";
export const primaryButtonClass =
  "rounded-lg bg-foreground px-4 py-2 font-semibold text-background disabled:opacity-50";
export const inputClass =
  "w-full rounded-lg border-2 border-muted bg-background px-3 py-2 text-foreground";

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: "border-muted text-muted",
  published: "border-green-700 text-green-700 dark:border-green-400 dark:text-green-400",
  cancelled: "border-red-700 text-red-700 dark:border-red-400 dark:text-red-400",
  deleted: "border-muted text-muted line-through",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-sm font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function formatEventStart(startsAt: Date): string {
  return formatManila(startsAt, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
