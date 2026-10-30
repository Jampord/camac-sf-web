import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

// Shared chrome for signed-in admin pages. The (app) route group keeps /admin/sign-in outside
// it. This layout is static so it prerenders; each page checks access with requireAdmin()
// inside its own <Suspense> boundary.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader />
      <nav aria-label="Admin" className="border-b bg-muted">
        <div className="mx-auto flex w-full max-w-2xl gap-6 px-4 py-2 text-sm font-medium">
          <Link href="/admin" className="py-1 hover:text-primary">
            Events
          </Link>
          <Link href="/admin/events/new" className="py-1 hover:text-primary">
            New event
          </Link>
          <Link href="/admin/events/deleted" className="py-1 hover:text-primary">
            Recently deleted
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </>
  );
}
