"use client";

import { useSyncExternalStore } from "react";
import { Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Opens the phone's share sheet (brief §6.3). It shares just the title and link, so Messenger
// and Facebook build their own preview from the share card; the full text is what
// "Copy announcement" is for. Browsers without a share sheet (most desktops) don't show it.

const canShare = () => typeof navigator.share === "function";
const noop = () => () => {};

export function ShareButton({ title, slug }: { title: string; slug: string }) {
  // Read after hydration: the server can't know, and guessing would cause a mismatch.
  const supported = useSyncExternalStore(noop, canShare, () => false);
  if (!supported) return null;

  async function share() {
    try {
      await navigator.share({ title, url: `${window.location.origin}/events/${slug}` });
    } catch {
      // Closing the share sheet rejects too; there's nothing to tell the user either way.
    }
  }

  return (
    <Button size="lg" variant="outline" className="w-full text-base sm:w-fit" onClick={share}>
      <Share2Icon aria-hidden />
      Share
    </Button>
  );
}
