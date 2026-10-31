"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";

// A submit button for server-rendered forms (<form action={serverAction}>): it shows a spinner
// and can't be pressed twice while the form is being sent, or before the page is ready.
export function SubmitButton(props: Omit<React.ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  const hydrated = useHydrated();
  return (
    <Button {...props} type="submit" disabled={pending || !hydrated || props.disabled}>
      {pending && <Spinner />}
      {props.children}
    </Button>
  );
}
