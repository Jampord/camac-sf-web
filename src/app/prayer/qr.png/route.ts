import { qrPng } from "@/lib/qr";

// Plain QR PNG of the prayer request form, for projector slides (brief §6.6).

export async function GET(request: Request) {
  const png = await qrPng(`${new URL(request.url).origin}/prayer`, 1024);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="prayer-request-qr.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
