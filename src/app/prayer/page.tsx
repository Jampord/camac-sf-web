import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";
import { PrayerForm } from "./prayer-form";

export const metadata: Metadata = {
  title: "Send a prayer request",
  description: "Send a prayer request to the CAMAC - San Fernando prayer team. No sign-in needed.",
};

// Public prayer request form (brief §6.7). No login, and a name is optional.
export default function PrayerPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="-ml-1 flex w-fit items-center gap-1 rounded-md py-2 pr-2 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
          All events
          <InlinePending />
        </Link>
        <h1 className="font-heading text-4xl font-bold tracking-tight">Send a prayer request</h1>
        <PrayerForm />
      </main>
    </>
  );
}
