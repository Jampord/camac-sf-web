import { Suspense } from "react";
import Link from "next/link";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";
import { EventListSkeleton } from "@/components/skeletons";
import { Agenda } from "./agenda";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Upcoming events</h1>
        {/* The filter comes from the URL (?ministry=youth), which is request data, so the
            agenda renders inside the boundary while the header and title prerender. */}
        <Suspense fallback={<EventListSkeleton filter />}>
          {searchParams.then(({ ministry }) => (
            <Agenda ministry={typeof ministry === "string" ? ministry : undefined} />
          ))}
        </Suspense>
      </main>
      <footer className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-8">
        <Link
          href="/prayer"
          className="flex items-center gap-2 rounded-md text-lg font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Send a prayer request
          <InlinePending />
        </Link>
        <span className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy
          </Link>
          <Link href="/admin" className="underline underline-offset-4 hover:text-foreground">
            Admin sign-in
          </Link>
        </span>
      </footer>
    </>
  );
}
