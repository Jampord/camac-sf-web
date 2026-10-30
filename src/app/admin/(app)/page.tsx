import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { InlinePending } from "@/components/link-pending";
import { EventListSkeleton } from "@/components/skeletons";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { nextOccurrence } from "@/lib/events/recurrence";
import { totalsByEvent } from "@/lib/events/stats";
import { ChurchAddress } from "./church-address";
import { EventList } from "./event-list";
import { MetricPanel } from "./metric-panel";
import { PrivacyContact } from "./privacy-contact";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Events</h1>
        <Link href="/admin/events/new" className={buttonVariants()}>
          New event
        </Link>
      </div>
      <Suspense fallback={<EventListSkeleton />}>
        <AdminHome />
      </Suspense>
    </>
  );
}

async function AdminHome() {
  // Check access before touching the database.
  const admin = await requireAdmin();
  const statRows = db.eventStat.groupBy({ by: ["eventId", "type"], _count: true });
  const events = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      recurrence: true,
      recurrenceUntil: true,
      skipDates: true,
      venue: true,
      publishedAt: true,
      cancelledAt: true,
      deletedAt: true,
      ministry: { select: { name: true } },
    },
  });

  // Upcoming = has a date that hasn't ended: a multi-day retreat stays listed while it's on,
  // and a weekly series is listed once, under its next week.
  const now = new Date();
  const listed = events.map((event) => {
    const next = nextOccurrence(event, now);
    return { ...event, ...(next && { startsAt: next.startsAt, endsAt: next.endsAt }), upcoming: !!next };
  });
  const upcoming = listed
    .filter((event) => event.upcoming)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = listed.filter((event) => !event.upcoming).reverse();
  const stats = totalsByEvent(await statRows); // all-time counts per event

  // Only the prayer team learns this exists, or how many there are.
  const newPrayers = admin.canViewPrayer
    ? await db.prayerRequest.count({ where: { status: "NEW", archivedAt: null } })
    : 0;

  return (
    <>
      {admin.canViewPrayer && (
        <Link
          href="/admin/prayer"
          className="flex items-center justify-between gap-3 rounded-lg border p-4 font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span>Prayer requests</span>
          <span className="flex items-center gap-2">
            <InlinePending />
            <span className={newPrayers > 0 ? "text-primary" : "font-normal text-muted-foreground"}>
              {newPrayers > 0 ? `${newPrayers} new` : "None new"}
            </span>
          </span>
        </Link>
      )}

      <MetricPanel now={now} />

      {upcoming.length > 0 ? (
        <EventList events={upcoming} now={now} stats={stats} />
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
          <p className="font-semibold">No upcoming events</p>
          <p className="text-muted-foreground">
            Add the next service, fellowship or outing. It stays a draft until you publish it.
          </p>
          <Link href="/admin/events/new" className={buttonVariants({ variant: "outline" })}>
            New event
          </Link>
        </div>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer font-semibold">Past events ({past.length})</summary>
          <div className="mt-4">
            <EventList events={past} now={now} stats={stats} />
          </div>
        </details>
      )}

      <ChurchAddress />
      <PrivacyContact />

      <footer className="mt-auto flex flex-wrap items-center gap-4 border-t pt-6 text-sm">
        <span>
          Signed in as <strong>{admin.name ?? admin.email}</strong>
          {admin.canViewPrayer && ", prayer team"}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <SubmitButton variant="outline">Sign out</SubmitButton>
        </form>
      </footer>
    </>
  );
}
