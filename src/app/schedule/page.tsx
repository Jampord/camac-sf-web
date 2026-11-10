import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signOut } from "@/auth";
import { CopyButton } from "@/components/copy-button";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { EventListSkeleton } from "@/components/skeletons";
import { SubmitButton } from "@/components/submit-button";
import { getMember, type Member } from "@/lib/dal";
import { SCHEDULE_WEEKS, type ScheduleDate } from "@/lib/schedule/dates";
import { loadUpcomingSchedule, type Assignment } from "@/lib/schedule/load";
import { scheduleText } from "@/lib/schedule/messenger";
import type { ScheduleService } from "@/lib/schedule/roles";
import { formatManila } from "@/lib/time";

export const metadata: Metadata = {
  title: "Serving schedule",
  // Behind sign-in anyway; keep the sign-in prompt out of search results too.
  robots: { index: false },
};

// Who serves at the regular services, for members and admins. The link can be shared openly:
// volunteers' names only show after Google sign-in, for people on the list.

export default function SchedulePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Serving schedule
          </h1>
          <p className="text-xl">Who&apos;s serving in the next {SCHEDULE_WEEKS} weeks.</p>
        </div>
        <Suspense fallback={<EventListSkeleton />}>
          <MemberSchedule />
        </Suspense>
      </main>
    </>
  );
}

async function MemberSchedule() {
  // Check access before touching the database.
  const member = await getMember();
  if (!member) return <SignInPrompt />;

  const { services, assignments } = await loadUpcomingSchedule(new Date());
  return (
    <>
      {services.map(({ service, dates }) => (
        <ServiceSchedule key={service.key} service={service} dates={dates} assignments={assignments} />
      ))}
      <SignedInFooter member={member} />
    </>
  );
}

function SignInPrompt() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <p className="font-heading text-2xl font-semibold">Sign in with Google to see the schedule.</p>
      <p className="text-lg text-muted-foreground">
        It&apos;s only for church members on the list. If you can&apos;t get in, ask a church admin
        to add you.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/schedule" });
        }}
      >
        <SubmitButton size="lg" className="h-14 w-full text-lg">
          Sign in with Google
        </SubmitButton>
      </form>
    </div>
  );
}

function ServiceSchedule({
  service,
  dates,
  assignments,
}: {
  service: ScheduleService;
  dates: ScheduleDate[];
  assignments: Assignment[];
}) {
  return (
    <section aria-label={service.title} className="flex flex-col gap-4">
      <SectionHeading>{service.title}</SectionHeading>
      {dates.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">
          This service isn&apos;t on the calendar right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {dates.map((date, index) => (
            <li key={date.date}>
              <ServiceDay
                service={service}
                date={date}
                assignments={assignments}
                // The next date starts open; the rest are a tap away.
                open={index === 0}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ServiceDay({
  service,
  date,
  assignments,
  open,
}: {
  service: ScheduleService;
  date: ScheduleDate;
  assignments: Assignment[];
  open: boolean;
}) {
  const label = formatManila(date.startsAt, { weekday: "long", month: "long", day: "numeric" });

  if (date.skipped) {
    return (
      <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-muted-foreground">
        <span className="text-lg line-through">{label}</span>
        <span>No service</span>
      </div>
    );
  }

  const names: Record<string, string> = Object.fromEntries(
    assignments.filter((row) => row.date === date.date).map((row) => [row.role, row.names]),
  );
  const groups = service.groups
    .map((group) => ({
      label: group.label,
      roles: group.roles.flatMap((role) =>
        names[role.key] ? [{ label: role.label, names: names[role.key] }] : [],
      ),
    }))
    .filter((group) => group.roles.length > 0);

  return (
    <details open={open} className="group rounded-2xl border bg-card">
      <summary className="font-heading flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-xl font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {label}
        <span className="font-sans text-base font-normal text-muted-foreground group-open:hidden">Show</span>
      </summary>
      <div className="flex flex-col gap-4 border-t px-4 py-4">
        {groups.length === 0 ? (
          <p className="text-muted-foreground">Not scheduled yet.</p>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <h3 className="font-bold">{group.label}</h3>
                <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-1">
                  {group.roles.map((role) => (
                    <div key={role.label} className="contents">
                      <dt className="text-muted-foreground">{role.label}</dt>
                      <dd className="font-medium">{role.names}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <CopyButton
              variant="outline"
              size="lg"
              className="h-14 w-full text-lg"
              label="Copy for Messenger"
              what="schedule"
              text={scheduleText(service, label, names)}
            />
          </>
        )}
      </div>
    </details>
  );
}

function SignedInFooter({ member }: { member: Member }) {
  return (
    <footer className="mt-auto flex flex-wrap items-center gap-4 border-t pt-6 text-sm">
      <span>
        Signed in as <strong>{member.name ?? member.email}</strong>
      </span>
      {member.isAdmin && (
        <Link href="/admin/schedule" className="font-medium underline underline-offset-4">
          Edit the schedule
        </Link>
      )}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/schedule" });
        }}
      >
        <SubmitButton variant="outline">Sign out</SubmitButton>
      </form>
    </footer>
  );
}
