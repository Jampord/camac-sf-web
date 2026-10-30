import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Designed by the Braille Institute for low-vision readers; many members are older (brief §6.2).
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  // Next's built-in metrics table doesn't include this font yet, so it can't size-match an
  // automatic fallback (it logs "Failed to find font override values"). Name our own instead.
  adjustFontFallback: false,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "CAMAC - San Fernando Events",
    template: "%s · CAMAC - San Fernando",
  },
  description: "Events and announcements for CAMAC - San Fernando.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script adds `dark` to <html> before React hydrates; that's expected.
    <html lang="en" className={`${atkinson.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        {/* In the root layout so a toast survives navigation (e.g. "Event deleted" -> list). */}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
