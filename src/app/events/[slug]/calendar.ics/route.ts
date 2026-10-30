import { icsFile } from "@/lib/events/calendar";
import { getPublishedEventBySlug } from "@/lib/events/public";

// The .ics download behind "Add to Apple or other calendar" (brief §6.5). On an iPhone, Safari
// opens it straight into "Add to Calendar"; on Android it opens in the calendar app.

export async function GET(request: Request, ctx: RouteContext<"/events/[slug]/calendar.ics">) {
  const { slug } = await ctx.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const now = new Date();
  const ics = icsFile(event, `${new URL(request.url).origin}/events/${slug}`, now);
  if (!ics) return new Response("This event has ended.", { status: 410 });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      // A weekly series starts from its next date, which moves on every week.
      "Cache-Control": "public, max-age=300",
    },
  });
}
