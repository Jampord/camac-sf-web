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
import { removeMember } from "./actions";

export function RemoveButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    setOpen(false);
    startTransition(async () => {
      const { changed } = await removeMember(id);
      if (changed) toast.success("Member removed", { description: `${label} can no longer sign in.` });
      else toast.error("This member was already removed. Reload the page to see the latest.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" disabled={pending} aria-label={`Remove ${label}`} />}
      >
        {pending && <Spinner />}
        Remove
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Remove {label}?</DialogTitle>
          <DialogDescription>
            They won&apos;t be able to sign in to see the serving schedule. You can add them again
            later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep them</DialogClose>
          <Button variant="destructive" onClick={remove}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
