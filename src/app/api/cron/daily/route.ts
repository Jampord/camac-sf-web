import { db } from "@/lib/db";
import { cleanupCutoffs, isCronAuthorized } from "@/lib/retention";

// The daily cleanup (brief §6.7, §6.1), run by Vercel Cron (vercel.json). The response holds only
// counts, never anything from a request.

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const cutoffs = cleanupCutoffs(now);

  const [archived, deleted, purged, hits] = await db.$transaction([
    db.prayerRequest.updateMany({
      where: { archivedAt: null, createdAt: { lt: cutoffs.archivePrayersBefore } },
      data: { archivedAt: now },
    }),
    db.prayerRequest.deleteMany({
      where: { keepAsTestimony: false, createdAt: { lt: cutoffs.deletePrayersBefore } },
    }),
    // Their stats go too (onDelete: Cascade). Public pages already hide soft-deleted events.
    db.event.deleteMany({ where: { deletedAt: { lt: cutoffs.purgeEventsDeletedBefore } } }),
    db.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoffs.deleteRateLimitHitsBefore } } }),
  ]);

  return Response.json({
    prayersArchived: archived.count,
    prayersDeleted: deleted.count,
    eventsPurged: purged.count,
    rateLimitHitsDeleted: hits.count,
  });
}
