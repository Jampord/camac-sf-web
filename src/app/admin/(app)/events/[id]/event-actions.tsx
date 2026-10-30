"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { EventStatus } from "@/lib/events/status";
import { cancelEvent, deleteEvent, publishEvent, restoreEvent, uncancelEvent } from "../actions";

const STALE = "This event was changed somewhere else. Reload the page to see the latest.";

// The buttons depend on the event's status:
//   draft      -> Publish
//   published  -> Cancel event (dialog with an optional note)
//   cancelled  -> Undo cancellation
// and Delete for all of them. Each action names its result in a toast ("Publish" -> "Published").
export function EventActions({ id, status }: { id: string; status: EventStatus }) {
  const router = useRouter();
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

  function remove() {
    setRunning("delete");
    startTransition(async () => {
      const { changed } = await deleteEvent(id);
      if (!changed) return void toast.error(STALE);
      router.replace("/admin");
      toast("Event deleted", {
        description: "You can restore it for 30 days from Recently deleted.",
        action: {
          label: "Undo",
          onClick: async () => {
            const restored = await restoreEvent(id);
            if (restored.changed) toast.success("Restored");
          },
        },
      });
    });
  }

  return (
    <section aria-label="Event status" className="flex flex-wrap items-center gap-3 border-y py-4">
      {status === "draft" && (
        <Button disabled={pending} onClick={() => run("publish", () => publishEvent(id), "Published")}>
          {busy("publish") && <Spinner />}
          Publish
        </Button>
      )}

      {status === "published" && (
        <CancelDialog
          disabled={pending}
          busy={busy("cancel")}
          onConfirm={(note) => run("cancel", () => cancelEvent(id, note), "Event cancelled")}
        />
      )}

      {status === "cancelled" && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run("uncancel", () => uncancelEvent(id), "Cancellation undone")}
        >
          {busy("uncancel") && <Spinner />}
          Undo cancellation
        </Button>
      )}

      <Button variant="destructive" disabled={pending} onClick={remove} className="ml-auto">
        {busy("delete") && <Spinner />}
        Delete
      </Button>

      <p className="basis-full text-sm text-muted-foreground">
        {status === "draft"
          ? "Publishing makes it visible to anyone with the link."
          : "Already shared? Cancel instead of deleting, so people who saw it know."}
      </p>
    </section>
  );
}

function CancelDialog({
  disabled,
  busy,
  onConfirm,
}: {
  disabled: boolean;
  busy: boolean;
  onConfirm: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" disabled={disabled} />}>
        {busy && <Spinner />}
        Cancel event
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(note);
            setOpen(false);
            setNote("");
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Cancel this event?</DialogTitle>
            <DialogDescription>
              Its page stays up with a Cancelled notice, so people who already saw it know.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="cancelNote">Note (optional)</FieldLabel>
            <Input
              id="cancelNote"
              value={note}
              maxLength={200}
              placeholder="e.g. Moved to Nov 22"
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep event</DialogClose>
            <Button type="submit" variant="destructive">
              Cancel event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
