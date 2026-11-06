import type { Metadata } from "next";
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Send a prayer request
          </h1>
          <p className="text-xl leading-relaxed">
            The church&apos;s prayer team prays over every request. You don&apos;t need to sign in,
            and you can leave your name out.
          </p>
        </div>
        <PrayerForm />
      </main>
    </>
  );
}
