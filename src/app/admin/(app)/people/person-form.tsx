"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACCESS_INFO, ACCESS_LEVELS } from "@/lib/people/access";
import { NAME_MAX, type PersonField } from "@/lib/people/input";
import { useHydrated } from "@/lib/use-hydrated";
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
  const [access, setAccess] = useState(state.values?.access ?? "member");
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">What can they do?</legend>
            {ACCESS_LEVELS.map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  name="access"
                  value={level}
                  checked={access === level}
                  onChange={() => setAccess(level)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{ACCESS_INFO[level].label}</span>
                  <span className="text-sm text-muted-foreground">{ACCESS_INFO[level].description}</span>
                </span>
              </label>
            ))}
            <FieldError>{error("access")}</FieldError>
          </fieldset>
        )}

        {canManagePeople && access !== "member" && (
          <Field orientation="horizontal">
            <Checkbox
              id="canManagePeople"
              name="canManagePeople"
              defaultChecked={state.values?.canManagePeople}
            />
            {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
            <FieldLabel htmlFor="canManagePeople" id="canManagePeople-label" className="font-normal">
              Can manage people: add, change and remove admins and the prayer team
            </FieldLabel>
          </Field>
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
