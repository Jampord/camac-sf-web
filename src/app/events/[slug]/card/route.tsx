import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { posterImageUrl } from "@/lib/cloudinary";
import { formatLongDates, formatTimes } from "@/lib/events/format";
import { getPublishedEventBySlug } from "@/lib/events/public";
import { describeRepeat } from "@/lib/events/recurrence";
import { SHARE_CARD_SIZE, shareCardVersion } from "@/lib/events/share-card";

// The 1200x630 link-preview card (brief §6.3), always generated: Canva posters are usually
// portrait and Facebook would crop them. With a poster, it sits on the left, padded (never
// cropped) to the card's height; without one, the card is the church's own branding.

// Light-theme colors from globals.css. Satori can't read CSS variables.
const MAROON = "#801214";
const RED = "#d42027";
const TEXT = "#333333";
const MUTED_TEXT = "#5f5f5f";
const MUTED_BG = "#f4f4f4";

const POSTER_WIDTH = 473; // 3:4 at the card's full height, which fits most Canva posters

// Read once per server instance. Satori only takes TTF/OTF/WOFF, not the site's web font.
const assets = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/AtkinsonHyperlegibleNext-Regular.ttf")),
  readFile(join(process.cwd(), "assets/fonts/AtkinsonHyperlegibleNext-Bold.ttf")),
  readFile(join(process.cwd(), "public/camac-mark.png")),
]);

export async function GET(request: Request, ctx: RouteContext<"/events/[slug]/card">) {
  const event = await getPublishedEventBySlug((await ctx.params).slug);
  if (!event) return new Response("Not found", { status: 404 });

  const [regular, bold, mark] = await assets;
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;
  const cancelled = event.cancelledAt !== null;
  const weekly = event.recurrence === "WEEKLY";
  // Weekly cards show the pattern, never a date: previews stay cached for weeks.
  const when = weekly ? describeRepeat(event) : formatLongDates(event.startsAt, event.endsAt);
  const times = formatTimes(event.startsAt, event.endsAt, event.allDay);
  const poster = event.posterUrl
    ? posterImageUrl(
        event.posterUrl,
        `c_pad,w_${POSTER_WIDTH},h_${SHARE_CARD_SIZE.height},b_rgb:${MUTED_BG.slice(1)},f_jpg,q_80`,
      )
    : null;
  // Room for the text shrinks with a poster beside it, so long titles step down a size.
  const titleSize = event.title.length > (poster ? 28 : 40) ? (poster ? 52 : 60) : poster ? 64 : 76;

  const image = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#ffffff",
          fontFamily: "Atkinson",
          color: TEXT,
        }}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser
          <img src={poster} width={POSTER_WIDTH} height={SHARE_CARD_SIZE.height} alt="" />
        ) : (
          <div style={{ display: "flex", width: 24, height: "100%", background: MAROON }} />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: poster ? "48px 56px" : "56px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
            <img src={markSrc} width={86} height={80} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 0.9 }}>CAMAC</span>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 4, color: RED }}>
                SAN FERNANDO
              </span>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}
          >
            {cancelled && (
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 18px",
                  marginBottom: 16,
                  borderRadius: 8,
                  background: RED,
                  color: "#ffffff",
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 2,
                }}
              >
                CANCELLED
              </span>
            )}
            <span
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.1,
                color: cancelled ? MUTED_TEXT : TEXT,
                textDecoration: cancelled ? "line-through" : "none",
              }}
            >
              {event.title}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 34 }}>
            <span style={{ fontWeight: 700, color: MAROON }}>{when}</span>
            <span>{times}</span>
            <span style={{ color: MUTED_TEXT }}>{event.venue}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: "Atkinson", data: regular, weight: 400, style: "normal" },
        { name: "Atkinson", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  // The current version never changes, so it can be cached for good. An old ?v= now shows
  // today's card, which must not be cached as if it were the old one.
  const current = new URL(request.url).searchParams.get("v") === shareCardVersion(event.updatedAt);
  image.headers.set(
    "Cache-Control",
    current ? "public, max-age=31536000, immutable" : "public, max-age=300",
  );
  return image;
}
