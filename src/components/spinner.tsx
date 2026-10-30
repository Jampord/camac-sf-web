import { cn } from "@/lib/utils";

// A small ring in the current text color. With reduced motion it fades instead of spinning.
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-r-transparent",
        "motion-safe:animate-spin motion-reduce:animate-pulse",
        className,
      )}
    />
  );
}
