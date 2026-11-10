import { Suspense } from "react";
import type { Metadata } from "next";
import { EventListSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { formatManila } from "@/lib/time";
import { MemberForm } from "./member-form";
import { RemoveButton } from "./remove-button";

export const metadata: Metadata = { title: "Members" };

// Members sign in with Google to see the serving schedule, and nothing else. Admins aren't
// listed here: they're managed by the seed script only (brief §4).

export default function MembersPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">
          Members can sign in with Google to see the serving schedule. They can&apos;t see or
          change anything else.
        </p>
      </div>
      <section aria-label="Add a member" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Add a member</h2>
        <MemberForm />
      </section>
      <section aria-label="Members" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Current members</h2>
        <Suspense fallback={<EventListSkeleton rows={2} />}>
          <MemberList />
        </Suspense>
      </section>
    </>
  );
}

async function MemberList() {
  // Check access before touching the database.
  await requireAdmin();
  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (members.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-muted-foreground">No members yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y border-y">
      {members.map((member) => (
        <li key={member.id} className="flex items-center gap-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-semibold">{member.name ?? member.email}</p>
            <p className="truncate text-sm text-muted-foreground">
              {member.name && `${member.email} · `}
              Added {formatManila(member.createdAt, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <RemoveButton id={member.id} label={member.name ?? member.email} />
        </li>
      ))}
    </ul>
  );
}
