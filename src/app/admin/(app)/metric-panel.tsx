import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import {
  GOAL_AVERAGE_OPENS,
  GOAL_EVENTS,
  METRIC_START_KEY,
  WINDOW_DAYS,
  metricWindow,
  successMetric,
} from "@/lib/events/metric";
import { formatManila, manilaInputToUtc, utcToManilaInput } from "@/lib/time";
import { setMetricWindowStart } from "./metric-actions";

// Admin home metric panel (brief §3). Callers must have checked requireAdmin() already.

const shortDate = (date: Date) =>
  formatManila(date, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

export async function MetricPanel({ now }: { now: Date }) {
  const setting = await db.setting.findUnique({ where: { key: METRIC_START_KEY } });

  if (!setting) {
    return (
      <section aria-labelledby="metric-heading" className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 id="metric-heading" className="text-lg font-bold">
          Success metric
        </h2>
        <p className="text-muted-foreground">
          The {WINDOW_DAYS / 7}-week measurement starts once admins begin using the app, after
          the pre-launch test. Goal: {GOAL_EVENTS} events shared, averaging {GOAL_AVERAGE_OPENS}+
          opens each.
        </p>
        <StartForm label="Start measuring on" submitLabel="Set start date" />
      </section>
    );
  }

  const window = metricWindow(manilaInputToUtc(setting.value), now);
  const [events, counts] = await Promise.all([
    db.event.findMany({
      where: { deletedAt: null },
      select: { id: true, recurrence: true, publishedAt: true },
    }),
    db.eventStat.groupBy({
      by: ["eventId", "type"],
      where: { createdAt: { gte: window.start, lt: window.end } },
      _count: true,
    }),
  ]);
  const metric = successMetric(
    events,
    counts.map((c) => ({ eventId: c.eventId, type: c.type, count: c._count })),
  );
  const lastDay = new Date(window.end.getTime() - 1);

  return (
    <section aria-labelledby="metric-heading" className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="metric-heading" className="text-lg font-bold">
          Success metric
        </h2>
        {metric.goalMet && (
          <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-semibold text-accent-foreground">
            Goal met
          </span>
        )}
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        {shortDate(window.start)} to {shortDate(lastDay)}
        {" · "}
        {window.state === "upcoming"
          ? "not started yet"
          : window.state === "running"
            ? `day ${window.day} of ${WINDOW_DAYS}`
            : "ended"}
      </p>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Events shared" value={metric.eventsShared} goal={GOAL_EVENTS} />
        <Stat label="Average opens" value={metric.averageOpens} goal={GOAL_AVERAGE_OPENS} />
        <Stat label="Copies" value={metric.copies} />
        <Stat label="Shares" value={metric.shares} />
      </dl>
      <p className="text-sm text-muted-foreground">
        Shared = a one-off published event opened at least once in the window. Weekly services
        aren&apos;t counted. Admins&apos; own visits never count.
      </p>

      <details>
        <summary className="cursor-pointer text-sm font-medium">Change start date</summary>
        <div className="mt-3">
          <StartForm
            label="Start date"
            submitLabel="Save"
            defaultValue={utcToManilaInput(window.start).slice(0, 10)}
          />
        </div>
      </details>
    </section>
  );
}

function Stat({ label, value, goal }: { label: string; value: number; goal?: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">
        {value}
        {goal !== undefined && (
          <span className="text-base font-medium text-muted-foreground"> / {goal}</span>
        )}
      </dd>
    </div>
  );
}

function StartForm({
  label,
  submitLabel,
  defaultValue,
}: {
  label: string;
  submitLabel: string;
  defaultValue?: string;
}) {
  return (
    <form action={setMetricWindowStart} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {label}
        <Input type="date" name="start" required defaultValue={defaultValue} className="w-auto" />
      </label>
      <Button type="submit" variant="outline">
        {submitLabel}
      </Button>
    </form>
  );
}
