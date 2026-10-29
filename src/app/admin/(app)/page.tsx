import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { eventStatus } from "@/lib/events/status";
import { buttonClass, formatEventStart, primaryButtonClass, StatusBadge } from "./ui";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Events</h1>
        <Link href="/admin/events/new" className={primaryButtonClass}>
          New event
        </Link>
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <AdminHome />
      </Suspense>
    </>
  );
}

async function AdminHome() {
  // The query starts alongside the access check; requireAdmin() redirects before anything renders.
  const [admin, events] = await Promise.all([
    requireAdmin(),
    db.event.findMany({
      where: { deletedAt: null },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        venue: true,
        publishedAt: true,
        cancelledAt: true,
        deletedAt: true,
        ministry: { select: { name: true } },
      },
    }),
  ]);
  const now = new Date();
  const upcoming = events.filter((event) => event.endsAt >= now);
  const past = events.filter((event) => event.endsAt < now).reverse();

  return (
    <>
      {/* Build step 3: metric panel (brief §3) goes here. */}
      <EventList events={upcoming} empty="No upcoming events yet." />

      {past.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">Past events ({past.length})</summary>
          <div className="mt-3">
            <EventList events={past} empty="" />
          </div>
        </details>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-4 border-t pt-6 text-base">
        <span>
          Signed in as <strong>{admin.name ?? admin.email}</strong>
          {admin.canViewPrayer && " · prayer team"}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className={buttonClass}>
            Sign out
          </button>
        </form>
      </footer>
    </>
  );
}

type ListedEvent = {
  id: string;
  title: string;
  startsAt: Date;
  venue: string;
  publishedAt: Date | null;
  cancelledAt: Date | null;
  deletedAt: Date | null;
  ministry: { name: string } | null;
};

function EventList({ events, empty }: { events: ListedEvent[]; empty: string }) {
  if (events.length === 0) return <p className="text-muted">{empty}</p>;

  return (
    <ul className="flex flex-col divide-y border-y">
      {events.map((event) => (
        <li key={event.id}>
          <Link href={`/admin/events/${event.id}`} className="flex flex-col gap-1 py-3 hover:bg-muted/10">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{event.title}</span>
              <StatusBadge status={eventStatus(event)} />
            </span>
            <span className="text-base text-muted">
              {formatEventStart(event.startsAt)} · {event.venue} ·{" "}
              {event.ministry?.name ?? "Church-wide"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
