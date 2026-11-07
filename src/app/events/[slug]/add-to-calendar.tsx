import { headers } from "next/headers";
import { connection } from "next/server";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/events/calendar";
import { CalendarChooser } from "./calendar-chooser";

// "Add to calendar" (brief §6.5): Google Calendar, or the .ics file for iPhone and the rest.
// Gone once the event has ended or is cancelled; a weekly series adds all its coming weeks.
// Depends on the current time, so it renders per request inside <Suspense>.

export async function AddToCalendar({
  event,
  slug,
  className,
}: {
  event: CalendarEvent;
  slug: string;
  className?: string;
}) {
  await connection();
  if (event.cancelledAt) return null;

  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  const google = googleCalendarUrl(event, `${origin}/events/${slug}`, new Date());
  if (!google) return null; // ended

  return (
    <CalendarChooser
      googleUrl={google}
      icsUrl={`/events/${slug}/calendar.ics`}
      weekly={event.recurrence === "WEEKLY"}
      className={className}
    />
  );
}
