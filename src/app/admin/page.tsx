import { Suspense } from "react";
import type { Metadata } from "next";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Admin</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <AdminHome />
      </Suspense>
    </main>
  );
}

async function AdminHome() {
  const admin = await requireAdmin();

  return (
    <>
      <p>
        Signed in as <strong>{admin.name ?? admin.email}</strong>
        {admin.canViewPrayer && " · prayer team"}
      </p>
      {/* Build step 1: event list + create/edit/publish/cancel/soft-delete. Step 3: metric panel. */}
      <p className="text-muted">Event management is coming next.</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="rounded-lg border px-4 py-2 font-semibold">
          Sign out
        </button>
      </form>
    </>
  );
}
