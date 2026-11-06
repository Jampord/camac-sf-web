import { cn } from "@/lib/utils";

// A section title on the public pages: the heading serif with a thin gold rule under it, as in
// the Warm design. The rule is as wide as the words, not the page.
export function SectionHeading({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-heading self-start border-b-2 border-gold pb-2 text-3xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h2>
  );
}
