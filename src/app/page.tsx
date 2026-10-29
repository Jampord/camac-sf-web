import Link from "next/link";

// Placeholder until the public agenda list lands (build step 2).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-base font-semibold uppercase tracking-wide text-muted">
          CAMAC - San Fernando
        </p>
        <h1 className="mt-1 text-4xl font-bold">Upcoming events</h1>
      </header>

      <p className="text-xl">The church event calendar is coming soon.</p>

      <footer className="mt-auto pt-10 text-base text-muted">
        <Link href="/admin" className="underline underline-offset-4">
          Admin sign-in
        </Link>
      </footer>
    </main>
  );
}
