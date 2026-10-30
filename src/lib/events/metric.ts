import type { StatType } from "./stats";

// The MVP success metric (brief §3): over 4 weeks, at least 8 events shared, averaging 15+
// opens each. "Shared" = a one-off, published event with at least one open in the window;
// weekly series are left out (they'd be opened anyway and would inflate the average).

/** Setting row holding the window's first day as a Manila date, e.g. "2026-11-01". */
export const METRIC_START_KEY = "metricWindowStart";
export const WINDOW_DAYS = 28;
export const GOAL_EVENTS = 8;
export const GOAL_AVERAGE_OPENS = 15;
const DAY_MS = 24 * 60 * 60 * 1000; // Manila has no daylight saving, so every day is 24h

export type MetricWindow = {
  start: Date;
  end: Date; // exclusive
  state: "upcoming" | "running" | "ended";
  day: number; // 1-28 while running
};

export function metricWindow(start: Date, now: Date): MetricWindow {
  const end = new Date(start.getTime() + WINDOW_DAYS * DAY_MS);
  const state = now < start ? "upcoming" : now < end ? "running" : "ended";
  const day = Math.floor((now.getTime() - start.getTime()) / DAY_MS) + 1;
  return { start, end, state, day };
}

export type MetricEvent = {
  id: string;
  recurrence: "NONE" | "WEEKLY";
  publishedAt: Date | null;
};

/** Stats already limited to the window and grouped, e.g. from db.eventStat.groupBy. */
export type StatCount = { eventId: string; type: StatType; count: number };

export type SuccessMetric = {
  eventsShared: number;
  averageOpens: number; // one decimal
  copies: number;
  shares: number;
  goalMet: boolean;
};

export function successMetric(events: MetricEvent[], counts: StatCount[]): SuccessMetric {
  const eligible = new Set(
    events.filter((e) => e.recurrence === "NONE" && e.publishedAt !== null).map((e) => e.id),
  );
  const opens = new Map<string, number>();
  let copies = 0;
  let shares = 0;
  for (const { eventId, type, count } of counts) {
    if (!eligible.has(eventId)) continue;
    if (type === "VIEW") opens.set(eventId, (opens.get(eventId) ?? 0) + count);
    if (type === "COPY") copies += count;
    if (type === "SHARE") shares += count;
  }

  const shared = [...opens.values()].filter((n) => n > 0);
  const total = shared.reduce((sum, n) => sum + n, 0);
  const averageOpens = shared.length ? Math.round((total / shared.length) * 10) / 10 : 0;
  return {
    eventsShared: shared.length,
    averageOpens,
    copies,
    shares,
    goalMet: shared.length >= GOAL_EVENTS && averageOpens >= GOAL_AVERAGE_OPENS,
  };
}
