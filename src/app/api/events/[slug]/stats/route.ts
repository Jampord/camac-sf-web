import { getAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { isBot, parseStatType } from "@/lib/events/stats";

// Receives the open beacon and Copy/Share clicks (brief §6.4). Bots and signed-in admins are
// answered the same as everyone else but not counted, so the page never needs to know.

const NO_CONTENT = () => new Response(null, { status: 204 });

export async function POST(request: Request, ctx: RouteContext<"/api/events/[slug]/stats">) {
  const type = parseStatType(await request.json().catch(() => null));
  if (!type) return new Response("Unknown stat type", { status: 400 });

  if (isBot(request.headers.get("user-agent") ?? "")) return NO_CONTENT();
  if (await getAdmin()) return NO_CONTENT();

  const event = await db.event.findFirst({
    where: { slug: (await ctx.params).slug, publishedAt: { not: null }, deletedAt: null },
    select: { id: true },
  });
  if (!event) return new Response("Not found", { status: 404 });

  await db.eventStat.create({ data: { eventId: event.id, type } });
  return NO_CONTENT();
}
