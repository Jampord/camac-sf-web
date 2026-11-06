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

// Copies text to paste into Messenger or Facebook. Some in-app browsers (e.g. Messenger's) block
// the clipboard; then the text opens selected in a dialog to copy by hand.

export function CopyButton({
  text,
  onCopy,
  label,
  what,
  ...buttonProps
}: {
  /** A function builds it on the tap, for what's only known in the browser (e.g. the page's address). */
  text: string | (() => string);
  /** Called on every tap, even when the text has to be copied by hand. */
  onCopy?: () => void;
  label: string;
  /** Names the text in messages: "Announcement copied", "Copy the announcement". */
  what: string;
} & Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
  const [copied, setCopied] = useState(false);
  const [manualText, setManualText] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    const value = typeof text === "function" ? text() : text;
    onCopy?.();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${capitalize(what)} copied`, { description: "Paste it into Messenger or Facebook." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setManualText(value);
    }
  }

  return (
    <>
      <Button {...buttonProps} onClick={copy}>
        {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        {copied ? "Copied" : label}
      </Button>

      <Dialog open={manualText !== null} onOpenChange={(open) => !open && setManualText(null)}>
        <DialogContent initialFocus={textRef} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Copy the {what}</DialogTitle>
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
            aria-label={`${capitalize(what)} text`}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
