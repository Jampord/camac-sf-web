import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/dal";

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
  const admin = await requireAdmin();

  return (
    <>
      {/* Milestone 3: the event list goes here. Build step 3: metric panel. */}
      <p className="text-muted-foreground">Your events will be listed here.</p>
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
