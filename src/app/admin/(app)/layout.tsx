import Link from "next/link";
import { InlinePending } from "@/components/link-pending";
import { SiteHeader } from "@/components/site-header";

// Shared chrome for signed-in admin pages. The (app) route group keeps /admin/sign-in outside
// it. This layout is static so it prerenders; each page checks access with requireAdmin()
// inside its own <Suspense> boundary.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader />
      <nav aria-label="Admin" className="border-b bg-muted">
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-2 text-sm font-medium sm:gap-6">
          {/* Each link shows a small spinner if its page is slow to load. */}
          {[
            ["/admin", "Events"],
            ["/admin/events/new", "New event"],
            ["/admin/events/deleted", "Recently deleted"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 py-1 whitespace-nowrap hover:text-primary">
              {label}
              <InlinePending />
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </>
  );
}
