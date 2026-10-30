import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

// Our own 404 so it follows the site's light/dark toggle (Next's default only follows the OS).
// Most visitors land here from a shared link to an event that isn't published (yet).
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold tracking-tight">This page isn&apos;t available</h1>
        <p className="text-lg text-muted-foreground">
          The event may not be published yet, or the link may be incomplete.
        </p>
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          See upcoming events
        </Link>
      </main>
    </>
  );
}
