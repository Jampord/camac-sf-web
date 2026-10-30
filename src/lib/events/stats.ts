// Open / Copy / Share counts (brief §6.4). Only the event, the type and the time are stored:
// no cookies, no IPs, no user agents.

export const STAT_TYPES = ["VIEW", "COPY", "SHARE"] as const;
export type StatType = (typeof STAT_TYPES)[number];

// Crawlers don't run the beacon's JavaScript, so this is only a backstop. Messenger's and
// Facebook's in-app browsers ("FBAN", "FB_IAB") are real people and must not match.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|whatsapp|headless|lighthouse|preview/i;

export function isBot(userAgent: string): boolean {
  return userAgent.trim() === "" || BOT_PATTERN.test(userAgent);
}

export type StatTotals = Record<StatType, number>;

/** "Opened 34 times · Copied 6 · Shared 4" for admins (brief §6.4). */
export function formatStatCounts({ VIEW, COPY, SHARE }: StatTotals): string {
  const opened =
    VIEW === 0 ? "Not opened yet" : VIEW === 1 ? "Opened once" : `Opened ${VIEW} times`;
  return [opened, COPY > 0 && `Copied ${COPY}`, SHARE > 0 && `Shared ${SHARE}`]
    .filter(Boolean)
    .join(" · ");
}

/** Totals per event from db.eventStat.groupBy({ by: ["eventId", "type"], _count: true }). */
export function totalsByEvent(
  rows: { eventId: string; type: StatType; _count: number }[],
): Map<string, StatTotals> {
  const totals = new Map<string, StatTotals>();
  for (const { eventId, type, _count } of rows) {
    const t = totals.get(eventId) ?? { VIEW: 0, COPY: 0, SHARE: 0 };
    t[type] += _count;
    totals.set(eventId, t);
  }
  return totals;
}

/** The stat type from a beacon's JSON body, or null if it isn't one we record. */
export function parseStatType(body: unknown): StatType | null {
  const type = (body as { type?: unknown } | null)?.type;
  return STAT_TYPES.find((t) => t === type) ?? null;
}

/**
 * Records a stat from the browser. sendBeacon survives the page closing (e.g. tapping Share,
 * which can switch apps); fetch with keepalive covers browsers without it. Never throws.
 */
export function recordStat(slug: string, type: StatType): void {
  const url = `/api/events/${slug}/stats`;
  const body = JSON.stringify({ type });
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
    void fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // Counting is best-effort; it must never break the page.
  }
}
