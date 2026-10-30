import { formatManila } from "@/lib/time";
import { eventDays, formatLongDates } from "./format";

// "Copy announcement" text (brief §6.3), modelled on the volunteer's own posts: a plain "Join us"
// sentence, then the details her poster would normally carry (a Messenger paste has no poster),
// then her description as she wrote it, then the link. No emoji; she doesn't use them.

export type AnnouncementEvent = {
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  venue: string;
  attire: string | null;
  contactPerson: string | null;
  recurrence: "NONE" | "WEEKLY";
};

const time = (date: Date) => formatManila(date, { hour: "numeric", minute: "2-digit" });

/** "on Sunday, August 30, 2026 at 9:00 AM", "from … to …", or "every Wednesday at 6:30 PM". */
function when(event: AnnouncementEvent): string {
  const at = event.allDay ? "" : ` at ${time(event.startsAt)}`;
  if (event.recurrence === "WEEKLY") {
    // The pattern, never a date: a copied announcement gets reposted long after it's made.
    return `every ${formatManila(event.startsAt, { weekday: "long" })}${at}`;
  }
  if (eventDays(event.startsAt, event.endsAt).length > 1) {
    return `from ${formatLongDates(event.startsAt, event.endsAt)}`;
  }
  return `on ${formatLongDates(event.startsAt, event.endsAt)}${at}`;
}

/** Ready-to-paste announcement for Messenger or a Facebook caption. */
export function announcementText(event: AnnouncementEvent, link: string): string {
  const details = [
    `Venue: ${event.venue}`,
    event.attire?.trim() && `Attire: ${event.attire.trim()}`,
    event.contactPerson?.trim() && `Contact: ${event.contactPerson.trim()}`,
  ].filter(Boolean);

  return [
    `Join us for ${event.title} ${when(event)}.`,
    details.join("\n"),
    event.description?.trim(),
    `Details and add to calendar: ${link}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
