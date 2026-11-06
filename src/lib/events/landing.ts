import { manilaWeekday } from "@/lib/time";
import { buildAgenda, type AgendaEntry, type AgendaEvent } from "./agenda";

// What the landing page shows from the calendar: the regular services for the welcome (when do
// you meet?), and the next few special events for "Coming up" (what's different this month?).
// Weekly services appear only in the welcome, so nothing is listed twice.

export const COMING_UP_COUNT = 3;

type LandingEvent = AgendaEvent & { cancelledAt: Date | null };

export function landingAgenda<E extends LandingEvent>(events: E[], now: Date) {
  const { thisWeek, weekly, later } = buildAgenda(events, now);

  const services = weekly
    .map(({ event }) => event)
    .filter((event) => event.cancelledAt === null)
    // Sunday first, like the church's week; then by weekday and time.
    .sort((a, b) => weekOrder(a.startsAt) - weekOrder(b.startsAt));

  const seen = new Set<string>();
  const comingUp: AgendaEntry<E>[] = [];
  for (const entry of [...thisWeek, ...later]) {
    if (comingUp.length === COMING_UP_COUNT) break;
    const { event } = entry;
    // A multi-day event shows once, on its first upcoming day. Cancelled ones stay on /events.
    if (event.recurrence === "WEEKLY" || event.cancelledAt !== null || seen.has(event.id)) continue;
    seen.add(event.id);
    comingUp.push(entry);
  }

  return { services, comingUp };
}

/** Minutes since Sunday midnight, Manila time. */
function weekOrder(date: Date): number {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => Number(time.find((p) => p.type === type)?.value);
  return manilaWeekday(date) * 24 * 60 + part("hour") * 60 + part("minute");
}
