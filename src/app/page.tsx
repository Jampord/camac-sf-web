import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

// Placeholder until the public agenda list lands (build step 2).
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Upcoming events</h1>
        <p className="text-xl text-muted-foreground">The church calendar is coming soon.</p>
      </main>
      <footer className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-muted-foreground">
        <Link href="/admin" className="underline underline-offset-4 hover:text-foreground">
          Admin sign-in
        </Link>
      </footer>
    </>
  );
}
