"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

// One dropdown instead of a wall of chips: on a phone it opens the system picker, which older
// members already know, and it keeps the events on the first screen (brief §6.2).
// While the filtered list loads, the list underneath dims and a spinner shows by the dropdown.

export function MinistryFilter({
  ministries,
  selected,
  aside,
  children,
}: {
  ministries: { name: string; slug: string }[];
  selected?: string;
  /** Shown at the end of the filter row, e.g. the "Past events" link. */
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      {/* Works without JavaScript too: the form submits ?ministry=… to the home page. */}
      <form action="/" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <label className="flex items-center gap-3 font-medium">
          Ministry
          <select
            // Re-mounts when the URL's filter changes (e.g. the Back button), so it never shows
            // a stale choice.
            key={selected ?? ""}
            name="ministry"
            defaultValue={selected ?? ""}
            onChange={(e) => {
              const slug = e.target.value;
              startTransition(() => router.push(slug ? `/?ministry=${slug}` : "/", { scroll: false }));
            }}
            className="h-11 min-w-0 max-w-[14rem] rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All events</option>
            {ministries.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
          <Spinner
            className={cn("text-primary transition-opacity", pending ? "opacity-100" : "opacity-0")}
          />
        </label>
        <noscript>
          <button type="submit" className="h-11 rounded-lg border px-4 font-medium">
            Show
          </button>
        </noscript>
        {aside}
      </form>
      <div
        aria-busy={pending}
        className={cn("flex flex-col gap-8 transition-opacity", pending && "opacity-50")}
      >
        {children}
      </div>
    </>
  );
}
