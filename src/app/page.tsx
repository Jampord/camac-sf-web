import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Agenda } from "./agenda";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight">Upcoming events</h1>
          {/* One tap to past events (brief §6.2). */}
          <Link href="/past" className={buttonVariants({ variant: "outline" })}>
            Past events
          </Link>
        </div>
        {/* The filter comes from the URL (?ministry=youth), which is request data, so the
            agenda renders inside the boundary while the header and title prerender. */}
        <Suspense fallback={<p className="text-muted-foreground">Loading events…</p>}>
          {searchParams.then(({ ministry }) => (
            <Agenda ministry={typeof ministry === "string" ? ministry : undefined} />
          ))}
        </Suspense>
      </main>
      <footer className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-muted-foreground">
        <Link href="/admin" className="underline underline-offset-4 hover:text-foreground">
          Admin sign-in
        </Link>
      </footer>
    </>
  );
}
