"use client";

import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { announcementText, type AnnouncementEvent } from "@/lib/events/announcement";

// Copies the ready-to-paste announcement (brief §6.3). The link is built from the address the
// page is open on, so it is right on production, previews and localhost alike, without the
// query strings a shared link can pick up (e.g. Facebook's ?fbclid=).

export function CopyAnnouncement({ event, slug }: { event: AnnouncementEvent; slug: string }) {
  const [copied, setCopied] = useState(false);
  // Set when the browser blocks the clipboard (some in-app browsers, e.g. Messenger's).
  const [manualText, setManualText] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    const text = announcementText(event, `${window.location.origin}/events/${slug}`);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Announcement copied", { description: "Paste it into Messenger or Facebook." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setManualText(text);
    }
  }

  return (
    <>
      <Button size="lg" className="w-full text-base sm:w-fit" onClick={copy}>
        {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        {copied ? "Copied" : "Copy announcement"}
      </Button>

      <Dialog open={manualText !== null} onOpenChange={(open) => !open && setManualText(null)}>
        <DialogContent initialFocus={textRef} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Copy the announcement</DialogTitle>
            <DialogDescription className="text-base">
              This browser won&apos;t copy for you. The text is selected: press and hold it, then
              tap Copy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            ref={textRef}
            readOnly
            value={manualText ?? ""}
            onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
            className="max-h-[50vh] text-base md:text-base"
            aria-label="Announcement text"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
