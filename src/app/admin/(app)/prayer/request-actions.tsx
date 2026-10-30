"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STATUS_LABELS, statusMoves, type PrayerStatus } from "@/lib/prayer/status";
import { deletePrayerRequest, setKeepAsTestimony, setPrayerStatus } from "./actions";

const STALE = "This request was changed by someone else. Reload the page to see the latest.";

// The buttons on one prayer request. Toasts never repeat the request's text: phones show them
// on screen, sometimes over someone's shoulder.
export function RequestActions({
  id,
  status,
  keepAsTestimony,
}: {
  id: string;
  status: PrayerStatus;
  keepAsTestimony: boolean;
}) {
  const [pending, startTransition] = useTransition();
  // Which button is working, so its spinner shows while the others just wait.
  const [running, setRunning] = useState<string | null>(null);
  const busy = (key: string) => pending && running === key;

  function run(key: string, action: () => Promise<{ changed: boolean }>, done: string) {
    setRunning(key);
    startTransition(async () => {
      const { changed } = await action();
      if (changed) toast.success(done);
      else toast.error(STALE);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {statusMoves(status).map(({ to, label }, index) => (
        <Button
          key={to}
          size="lg"
          variant={index === 0 && to !== "NEW" && status !== "ANSWERED" ? "default" : "outline"}
          disabled={pending}
          onClick={() => run(to, () => setPrayerStatus(id, to), `Marked as ${STATUS_LABELS[to].toLowerCase()}`)}
        >
          {busy(to) && <Spinner />}
          {label}
        </Button>
      ))}

      <Button
        size="lg"
        variant="outline"
        disabled={pending}
        aria-pressed={keepAsTestimony}
        onClick={() =>
          run(
            "keep",
            () => setKeepAsTestimony(id, !keepAsTestimony),
            keepAsTestimony ? "No longer kept as a testimony" : "Kept as a testimony",
          )
        }
      >
        {busy("keep") && <Spinner />}
        {keepAsTestimony ? "Stop keeping as testimony" : "Keep as testimony"}
      </Button>

      <DeleteDialog
        disabled={pending}
        busy={busy("delete")}
        onConfirm={() => run("delete", () => deletePrayerRequest(id), "Request deleted")}
      />
    </div>
  );
}

function DeleteDialog({
  disabled,
  busy,
  onConfirm,
}: {
  disabled: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" variant="destructive" disabled={disabled} className="ml-auto" />}>
        {busy && <Spinner />}
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Delete this request for good?</DialogTitle>
          <DialogDescription>
            It can&apos;t be restored. Use this when someone asks for their request to be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep it</DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Delete for good
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
