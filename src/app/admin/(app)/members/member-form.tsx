"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NAME_MAX, type MemberField } from "@/lib/members/input";
import { useHydrated } from "@/lib/use-hydrated";
import { addMember, type MemberFormState } from "./actions";

export function MemberForm() {
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(addMember, {});
  const hydrated = useHydrated();
  const error = (field: MemberField) => state.errors?.[field];
  // aria-invalid styles the control red; FieldError shows the message under it.
  const invalid = (field: MemberField) => (error(field) ? true : undefined);

  return (
    // Remount after each submit: empty after an add, refilled with what was sent after an error.
    <form key={JSON.stringify(state)} action={formAction} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={invalid("email")}>
          <FieldLabel htmlFor="email">Google email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue={state.values?.email}
            aria-invalid={invalid("email")}
            className="h-11 text-base md:text-base"
          />
          <FieldDescription>The address they use to sign in to Google.</FieldDescription>
          <FieldError>{error("email")}</FieldError>
        </Field>

        <Field data-invalid={invalid("name")}>
          <FieldLabel htmlFor="name">Name (optional)</FieldLabel>
          <Input
            id="name"
            name="name"
            maxLength={NAME_MAX}
            autoComplete="off"
            defaultValue={state.values?.name}
            aria-invalid={invalid("name")}
            className="h-11 text-base md:text-base"
          />
          <FieldError>{error("name")}</FieldError>
        </Field>
      </FieldGroup>

      {state.added && !pending && (
        <p role="status" className="text-lg font-medium">
          Added {state.added}.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !hydrated} className="w-full text-base sm:w-fit">
        {pending && <Spinner />}
        {pending ? "Adding…" : "Add member"}
      </Button>
    </form>
  );
}
