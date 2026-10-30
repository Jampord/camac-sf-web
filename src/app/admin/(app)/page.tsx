import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { EventList } from "./event-list";

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
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AdminHome />
      </Suspense>
    </>
  );
}

async function AdminHome() {
  // Check access before touching the database.
  const admin = await requireAdmin();
  const events = await db.event.findMany({
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
  });

  // An event counts as upcoming until it has ended, so a multi-day retreat stays listed
  // while it's happening.
  const now = new Date();
  const upcoming = events.filter((event) => event.endsAt >= now);
  const past = events.filter((event) => event.endsAt < now).reverse();

  return (
    <>
      {upcoming.length > 0 ? (
        <EventList events={upcoming} now={now} />
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
            <EventList events={past} now={now} />
          </div>
        </details>
      )}

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
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </footer>
    </>
  );
}
