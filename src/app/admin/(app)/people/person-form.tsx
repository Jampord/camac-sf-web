"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACCESS_LEVELS, type Access } from "@/lib/people/access";
import { NAME_MAX, type PersonField } from "@/lib/people/input";
import { useHydrated } from "@/lib/use-hydrated";
import { AccessChoice } from "./access-choice";
import { addPerson, type PersonFormState } from "./actions";

/** `canManagePeople` is the viewer's: without it, the form only adds members. */
export function PersonForm({ canManagePeople }: { canManagePeople: boolean }) {
  const [state, formAction, pending] = useActionState<PersonFormState, FormData>(addPerson, {});

  return (
    // Remount after each submit: empty after an add, refilled with what was sent after an error.
    <PersonFields
      key={JSON.stringify(state)}
      state={state}
      formAction={formAction}
      pending={pending}
      canManagePeople={canManagePeople}
    />
  );
}

function PersonFields({
  state,
  formAction,
  pending,
  canManagePeople,
}: {
  state: PersonFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  canManagePeople: boolean;
}) {
  const hydrated = useHydrated();
  // Shows the people-manager checkbox only for admin levels, where it applies.
  const [access, setAccess] = useState<Access>(asAccess(state.values?.access));
  const error = (field: PersonField) => state.errors?.[field];
  // aria-invalid styles the control red; FieldError shows the message under it.
  const invalid = (field: PersonField) => (error(field) ? true : undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
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

        {canManagePeople && (
          <AccessChoice
            access={access}
            onAccessChange={setAccess}
            defaultCanManagePeople={state.values?.canManagePeople}
            error={error("access")}
          />
        )}
      </FieldGroup>

      {state.added && !pending && (
        <p role="status" className="text-lg font-medium">
          Added {state.added}.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !hydrated} className="w-full text-base sm:w-fit">
        {pending && <Spinner />}
        {pending ? "Adding…" : canManagePeople ? "Add person" : "Add member"}
      </Button>
    </form>
  );
}

function asAccess(value: string | undefined): Access {
  return ACCESS_LEVELS.find((level) => level === value) ?? "member";
}
