import { Suspense } from "react";
import type { Metadata } from "next";
import { EventListSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { requireAdmin, type Admin } from "@/lib/dal";
import { db } from "@/lib/db";
import { accessOf, type Access } from "@/lib/people/access";
import { changeProblem } from "@/lib/people/rules";
import { formatManila } from "@/lib/time";
import { PersonForm } from "./person-form";
import { PersonActions } from "./person-actions";

export const metadata: Metadata = { title: "People" };

// Everyone who can sign in (brief §4): the User table is the allowlist, and this page manages
// it. Any admin adds and removes members; people managers handle admins and the prayer team.

export default function PeoplePage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">People</h1>
        <p className="text-muted-foreground">
          Everyone who can sign in with Google. Members see the serving schedule only.
        </p>
      </div>
      <Suspense fallback={<EventListSkeleton rows={4} />}>
        <People />
      </Suspense>
    </>
  );
}

type Person = {
  id: string;
  email: string;
  name: string | null;
  access: Access;
  canManagePeople: boolean;
  createdAt: Date;
};

const SECTIONS: { access: Access; title: string; empty: string }[] = [
  { access: "prayer", title: "Prayer team", empty: "Nobody on the prayer team yet." },
  { access: "admin", title: "Admins", empty: "No other admins." },
  { access: "member", title: "Members", empty: "No members yet." },
];

async function People() {
  // Check access before touching the database.
  const viewer = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true, canViewPrayer: true, canManagePeople: true, createdAt: true },
  });
  const people: Person[] = users.map((user) => ({ ...user, access: accessOf(user) }));

  return (
    <>
      <section aria-labelledby="add-person" className="flex flex-col gap-3">
        <h2 id="add-person" className="text-xl font-bold">
          {viewer.canManagePeople ? "Add a person" : "Add a member"}
        </h2>
        <PersonForm canManagePeople={viewer.canManagePeople} />
      </section>

      {!viewer.canManagePeople && (
        <p className="rounded-xl bg-muted p-4 text-muted-foreground">
          To add or change an admin or the prayer team, ask someone marked &ldquo;Manages
          people&rdquo;.
        </p>
      )}

      {SECTIONS.map(({ access, title, empty }) => (
        <section key={access} aria-labelledby={`${access}-heading`} className="flex flex-col gap-3">
          <h2 id={`${access}-heading`} className="text-xl font-bold">
            {title}
          </h2>
          <PersonList people={people.filter((person) => person.access === access)} viewer={viewer} empty={empty} />
        </section>
      ))}
    </>
  );
}

function PersonList({ people, viewer, empty }: { people: Person[]; viewer: Admin; empty: string }) {
  if (people.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="flex flex-col divide-y border-y">
      {people.map((person) => (
        <li key={person.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <span className="truncate">{person.name ?? person.email}</span>
              {person.id === viewer.id && <Badge variant="secondary">You</Badge>}
              {person.canManagePeople && <Badge variant="outline">Manages people</Badge>}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {person.name && `${person.email} · `}
              Added {formatManila(person.createdAt, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {/* Only where the rules allow: never on your own row; admins' rows only for people managers. */}
          {changeProblem(viewer, person) === null && (
            <PersonActions person={person} viewerCanManagePeople={viewer.canManagePeople} />
          )}
        </li>
      ))}
    </ul>
  );
}
