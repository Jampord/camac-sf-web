"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BODY_MAX } from "@/lib/prayer/input";
import { submitPrayerRequest, type PrayerFormState } from "./actions";

export function PrayerForm() {
  // Changing the key starts a fresh form (and fresh action state) for "Send another".
  const [round, setRound] = useState(0);
  return <Form key={round} onReset={() => setRound(round + 1)} />;
}

function Form({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState<PrayerFormState, FormData>(
    submitPrayerRequest,
    {},
  );

  if (state.sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-lg bg-muted p-6">
        <p className="text-xl font-bold">Thank you. Your request was sent.</p>
        <p className="text-lg">The prayer team will pray for you.</p>
        <Button variant="outline" size="lg" className="text-base" onClick={onReset}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field data-invalid={!!state.errors?.body}>
        <FieldLabel htmlFor="body" className="text-base">
          Your prayer request
        </FieldLabel>
        <Textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={BODY_MAX}
          aria-invalid={!!state.errors?.body}
          className="min-h-36 text-base md:text-base"
        />
        <FieldError>{state.errors?.body}</FieldError>
      </Field>

      <Field data-invalid={!!state.errors?.name}>
        <FieldLabel htmlFor="name" className="text-base">
          Your name (optional)
        </FieldLabel>
        <Input
          id="name"
          name="name"
          maxLength={120}
          autoComplete="name"
          aria-invalid={!!state.errors?.name}
          className="h-11 text-base md:text-base"
        />
        <FieldDescription>Leave it blank to stay anonymous.</FieldDescription>
        <FieldError>{state.errors?.name}</FieldError>
      </Field>

      <Field data-invalid={!!state.errors?.contact}>
        <FieldLabel htmlFor="contact" className="text-base">
          Phone or email (optional)
        </FieldLabel>
        <Input
          id="contact"
          name="contact"
          maxLength={200}
          aria-invalid={!!state.errors?.contact}
          className="h-11 text-base md:text-base"
        />
        <FieldDescription>Only if you&apos;d like someone to reach out to you.</FieldDescription>
        <FieldError>{state.errors?.contact}</FieldError>
      </Field>

      <Field orientation="horizontal">
        {/* Off unless ticked. Saved for a possible prayer wall; nothing is shared today. */}
        <Checkbox id="shareConsent" name="shareConsent" />
        {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
        <FieldLabel htmlFor="shareConsent" id="shareConsent-label" className="text-base font-normal">
          It&apos;s OK to share this with the congregation
        </FieldLabel>
      </Field>

      {/* Honeypot: hidden from people, so only bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website (leave this empty)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* The privacy notice (brief §6.7): who sees it, when it's deleted, how to ask for removal. */}
      <p className="text-muted-foreground">
        Only the church&apos;s prayer team reads your request. It&apos;s deleted automatically after
        one year unless the team keeps it as a testimony, and sooner if you ask.{" "}
        <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
          How we handle your request
        </Link>
      </p>

      {state.message && (
        <p role="alert" className="text-lg font-medium text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full text-base sm:w-fit">
        {pending && <Spinner />}
        {pending ? "Sending…" : "Send prayer request"}
      </Button>
    </form>
  );
}
