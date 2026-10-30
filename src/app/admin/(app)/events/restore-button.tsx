"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { restoreEvent } from "./actions";

export function RestoreButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      aria-label={`Restore ${title}`}
      onClick={() =>
        startTransition(async () => {
          const { changed } = await restoreEvent(id);
          if (changed) toast.success("Restored", { description: `${title} is back in Events.` });
          else toast.error("This event was already restored. Reload the page to see the latest.");
        })
      }
    >
      {pending && <Spinner />}
      Restore
    </Button>
  );
}
