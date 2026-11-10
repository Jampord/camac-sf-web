import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeftIcon } from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { getPrivacyContact } from "@/lib/events/public";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How CAMAC - San Fernando handles prayer requests, the serving schedule and visits to this site.",
};

const FALLBACK_CONTACT = "any church leader at a Sunday service";

/** Read per request, not at build time: the build has no database to read it from (CI). */
async function ContactName() {
  await connection();
  return (await getPrivacyContact()) ?? FALLBACK_CONTACT;
}

// The short privacy page (brief §6.7), written for RA 10173 as standard practice. Not legal
// advice. Keep it in step with what the code does: if retention or access changes, change this.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/prayer"
          className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          Prayer request form
          <InlinePending />
        </Link>
        <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">Privacy</h1>

        <div className="flex flex-col gap-10 text-lg leading-relaxed">
          <section className="flex flex-col gap-3">
            <SectionHeading className="text-2xl">Prayer requests</SectionHeading>
            <p>
              <strong>What we keep:</strong> your request, and your name and contact details if you
              choose to give them. You can stay anonymous.
            </p>
            <p>
              <strong>Who can read it:</strong> only the church&apos;s prayer team. Notification
              emails say that a new request came in, without its contents. The person who maintains
              this website can technically reach the database, and has committed not to read
              prayer requests.
            </p>
            <p>
              <strong>How long we keep it:</strong> it&apos;s deleted automatically after one year,
              unless the prayer team keeps it as a testimony.
            </p>
            <p>
              <strong>Sharing:</strong> nothing is shared with the congregation today. If you tick
              the sharing box, we save that choice in case the church adds a prayer wall.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading className="text-2xl">Serving schedule</SectionHeading>
            <p>
              <strong>What we keep:</strong> the names an admin enters for each serving role, and
              for each member who can see the schedule, their Google email address and the name an
              admin gave them.
            </p>
            <p>
              <strong>Who can see it:</strong> only members and admins, after signing in with
              Google. The schedule isn&apos;t public. Signing in only checks that your email is on
              the list; we don&apos;t save anything else from your Google account. A cookie keeps
              you signed in on that device for up to 30 days, or until you sign out.
            </p>
            <p>
              <strong>How long we keep it:</strong> each week&apos;s schedule is deleted
              automatically a year after its date. Your email stays on the member list until an
              admin removes it.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading className="text-2xl">Asking for removal</SectionHeading>
            <p>
              To have your request removed or corrected, to be taken off the schedule or the member
              list, or to ask what we hold about you, contact{" "}
              <Suspense fallback={FALLBACK_CONTACT}>
                <ContactName />
              </Suspense>
              .
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading className="text-2xl">Visiting this site</SectionHeading>
            <p>
              We count how many times each event is opened, copied and shared, with no cookies and
              nothing that identifies you. To stop spam on the prayer form, we briefly keep a
              scrambled version of your internet address and delete it within a day.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
