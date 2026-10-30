"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/theme";

// Which icon shows is decided by CSS (`dark:`), not React state, so the server and the
// browser render the same markup and there's no hydration mismatch.
export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Private browsing: the switch still works for this page view.
    }
  }

  return (
    <Button variant="ghost" size="icon-lg" onClick={toggle} aria-label="Switch light or dark mode">
      <MoonIcon className="size-5 dark:hidden" aria-hidden />
      <SunIcon className="hidden size-5 dark:block" aria-hidden />
    </Button>
  );
}
