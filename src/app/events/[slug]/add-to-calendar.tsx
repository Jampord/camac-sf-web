import { headers } from "next/headers";
import { connection } from "next/server";
import { CalendarPlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/events/calendar";
import { cn } from "@/lib/utils";

// "Add to calendar" (brief §6.5): Google Calendar, or the .ics file for iPhone and the rest.
// Gone once the event has ended or is cancelled; a weekly series adds all its coming weeks.
// Depends on the current time, so it renders per request inside <Suspense>.

export async function AddToCalendar({ event, slug }: { event: CalendarEvent; slug: string }) {
  await connection();
  if (event.cancelledAt) return null;

  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  const google = googleCalendarUrl(event, `${origin}/events/${slug}`, new Date());
  if (!google) return null; // ended

  const weekly = event.recurrence === "WEEKLY";
  const button = cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full text-base sm:w-fit");

  return (
    <section aria-labelledby="add-to-calendar" className="flex flex-col gap-3">
      <h2 id="add-to-calendar" className="text-xl font-bold">
        Add to your calendar
      </h2>
      {weekly && (
        <p className="-mt-2 text-muted-foreground">
          Adds every coming week, not just the next one.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a href={google} target="_blank" rel="noopener" className={button}>
          <CalendarPlusIcon aria-hidden />
          Google Calendar
        </a>
        {/* iPhones open .ics files straight into "Add to Calendar". */}
        <a href={`/events/${slug}/calendar.ics`} className={button}>
          <CalendarPlusIcon aria-hidden />
          iPhone or other calendar
        </a>
      </div>
    </section>
  );
}
