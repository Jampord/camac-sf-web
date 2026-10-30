import { getPublishedEventBySlug } from "@/lib/events/public";
import { qrPng } from "@/lib/qr";

// Plain QR PNG for projector slides (brief §6.6): just the code, big enough to scale down.

export async function GET(request: Request, ctx: RouteContext<"/events/[slug]/qr.png">) {
  const { slug } = await ctx.params;
  if (!(await getPublishedEventBySlug(slug))) return new Response("Not found", { status: 404 });

  const png = await qrPng(`${new URL(request.url).origin}/events/${slug}`, 1024);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${slug}-qr.png"`,
      // The link never changes (slugs are permanent), so neither does the code.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
