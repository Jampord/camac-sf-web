import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

// Logo mark + typed name, set as one tight block like the logo lockup: charcoal "CAMAC" with
// red "San Fernando" directly under it at the same width. `children` sits before the toggle.
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src="/camac-mark.png"
            alt=""
            width={447}
            height={418}
            priority
            className="h-11 w-auto"
          />
          <span className="flex flex-col">
            <span className="text-2xl leading-[0.85] font-extrabold tracking-tight">CAMAC</span>
            <span className="text-[0.56rem] leading-none font-semibold tracking-[0.16em] text-sunday uppercase">
              San Fernando
            </span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
