import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";
import { getPrivacyContact } from "@/lib/events/public";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CAMAC - San Fernando handles prayer requests and visits to this site.",
};

// The short privacy page (brief §6.7), written for RA 10173 as standard practice. Not legal
// advice. Keep it in step with what the code does: if retention or access changes, change this.
export default async function PrivacyPage() {
  const contact = await getPrivacyContact();

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
        <h1 className="font-heading text-4xl font-bold tracking-tight">Privacy</h1>

        <div className="flex flex-col gap-6 text-lg leading-relaxed">
          <section className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Prayer requests</h2>
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

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Asking for removal</h2>
            <p>
              To have your request removed or corrected, or to ask what we hold about you, contact{" "}
              {contact ?? "any church leader at a Sunday service"}.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Visiting this site</h2>
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
