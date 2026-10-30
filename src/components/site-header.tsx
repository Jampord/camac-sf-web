import Image from "next/image";
import Link from "next/link";

// Logo mark + typed name, echoing the logo lockup: charcoal "CAMAC", red "San Fernando".
// `children` is the right-hand side (e.g. admin actions).
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src="/camac-mark.png"
            alt=""
            width={447}
            height={418}
            priority
            className="h-11 w-auto"
          />
          <span className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight">CAMAC</span>
            <span className="mt-1 text-sm font-medium tracking-[0.18em] text-sunday uppercase">
              San Fernando
            </span>
          </span>
        </Link>
        {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
