"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, HandHeartIcon, HouseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The public site's three places. On phones they're a tab bar at the bottom, thumb-reachable and
// always visible (like Messenger's), because many members open one event link and nothing else;
// on wider screens they're links in the header. No hamburger menu: older visitors rarely open one.

const TABS = [
  { href: "/", label: "Home", icon: HouseIcon, matches: (path: string) => path === "/" },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDaysIcon,
    matches: (path: string) => path.startsWith("/events") || path === "/past",
  },
  {
    href: "/prayer",
    label: "Prayer",
    icon: HandHeartIcon,
    matches: (path: string) => path.startsWith("/prayer") || path === "/privacy",
  },
];

/** Header links, shown from tablet width up. */
export function HeaderNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {TABS.map(({ href, label, matches }) => (
        <Link
          key={href}
          href={href}
          aria-current={matches(path) ? "page" : undefined}
          className="rounded-full px-4 py-2 font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** The bottom tab bar, on phones only. globals.css pads the page so it never covers content. */
export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      data-tab-bar
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden print:hidden"
    >
      {TABS.map(({ href, label, icon: Icon, matches }) => (
        <Link
          key={href}
          href={href}
          aria-current={matches(path) ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-sm font-semibold text-muted-foreground outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground",
          )}
        >
          <Icon className="size-7" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
