import { db } from "@/lib/db";
import { USAGE_DAYS, usageSince, usageTotals } from "@/lib/events/usage";

// Admin home usage totals (brief §6.4). Callers must have checked requireAdmin() already.

export async function UsagePanel({ now }: { now: Date }) {
  const since = usageSince(now);
  const [events, counts] = await Promise.all([
    db.event.findMany({
      where: { deletedAt: null },
      select: { id: true, recurrence: true, publishedAt: true },
    }),
    db.eventStat.groupBy({
      by: ["eventId", "type"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
  ]);
  const usage = usageTotals(
    events,
    counts.map((c) => ({ eventId: c.eventId, type: c.type, count: c._count })),
  );

  return (
    <section aria-labelledby="usage-heading" className="flex flex-col gap-4 rounded-lg border p-4">
      <h2 id="usage-heading" className="text-lg font-bold">
        Last {USAGE_DAYS} days
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Events shared" value={usage.eventsShared} />
        <Stat label="Average opens" value={usage.averageOpens} />
        <Stat label="Copies" value={usage.copies} />
        <Stat label="Shares" value={usage.shares} />
      </dl>
      <p className="text-sm text-muted-foreground">
        Shared = a one-off published event opened at least once in this period. Weekly services
        aren&apos;t counted. Admins&apos; own visits never count.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
