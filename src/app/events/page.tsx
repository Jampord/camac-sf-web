import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { EventListSkeleton } from "@/components/skeletons";
import { Agenda } from "./agenda";

export const metadata: Metadata = {
  title: "Upcoming events",
  description: "What's on at CAMAC - San Fernando: this week, every week, and the months ahead.",
};

// The full agenda (brief §6.2). It was the home page until the landing page took over "/";
// shared links still point at /events/<slug> and keep working.
export default function EventsPage({ searchParams }: PageProps<"/events">) {
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
    </>
  );
}
