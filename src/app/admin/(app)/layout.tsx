import Link from "next/link";

// Shared chrome for signed-in admin pages. Static, so it prerenders; each page checks access
// with requireAdmin() inside its own <Suspense> boundary.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <nav className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-base">
          <Link href="/admin" className="font-bold">
            CAMAC Admin
          </Link>
          <Link href="/admin/events/new" className="underline-offset-4 hover:underline">
            New event
          </Link>
          <Link href="/admin/events/deleted" className="underline-offset-4 hover:underline">
            Recently deleted
          </Link>
          <Link href="/" className="ml-auto underline-offset-4 hover:underline">
            Public site
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
