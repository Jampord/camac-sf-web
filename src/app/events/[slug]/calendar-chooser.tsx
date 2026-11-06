"use client";

import { CalendarPlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// One big "Add to calendar" button at the top of the event page; the choice of calendar comes
// after the tap, so the top of the page stays at two buttons.

export function CalendarChooser({
  googleUrl,
  icsUrl,
  weekly,
  className,
}: {
  googleUrl: string;
  icsUrl: string;
  weekly: boolean;
  className?: string;
}) {
  const choice = cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 w-full text-lg");

  return (
    <Dialog>
      <DialogTrigger className={className}>
        <CalendarPlusIcon className="size-6" aria-hidden />
        Add to calendar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Which calendar do you use?</DialogTitle>
          {weekly && (
            <DialogDescription className="text-base">
              Adds every coming week, not just the next one.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <a href={googleUrl} target="_blank" rel="noopener" className={choice}>
            Google Calendar
          </a>
          {/* iPhones open .ics files straight into "Add to Calendar". */}
          <a href={icsUrl} className={choice}>
            iPhone or other calendar
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
