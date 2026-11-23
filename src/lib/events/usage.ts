import type { StatType } from "./stats";

// Usage totals for the admin home (brief §6.4). "Shared" = a one-off, published event with at
// least one open in the period; weekly series are left out (they'd be opened anyway and would
// inflate the average).

export const USAGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the rolling period that ends now. */
export function usageSince(now: Date): Date {
  return new Date(now.getTime() - USAGE_DAYS * DAY_MS);
}

export type UsageEvent = {
  id: string;
  recurrence: "NONE" | "WEEKLY";
  publishedAt: Date | null;
};

/** Stats already limited to the period and grouped, e.g. from db.eventStat.groupBy. */
export type StatCount = { eventId: string; type: StatType; count: number };

export type UsageTotals = {
  eventsShared: number;
  averageOpens: number; // one decimal
  copies: number;
  shares: number;
};

export function usageTotals(events: UsageEvent[], counts: StatCount[]): UsageTotals {
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
  return { eventsShared: shared.length, averageOpens, copies, shares };
}
