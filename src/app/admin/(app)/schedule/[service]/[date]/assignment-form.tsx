"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NAMES_MAX } from "@/lib/schedule/input";
import { getService } from "@/lib/schedule/roles";
import { useHydrated } from "@/lib/use-hydrated";
import { saveAssignments, type ScheduleFormState } from "../../actions";

// One date's assignments. Any slot can stay blank, and clearing a slot removes the name.

export function AssignmentForm({
  serviceKey,
  date,
  names,
}: {
  serviceKey: string;
  date: string;
  names: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<ScheduleFormState, FormData>(
    saveAssignments.bind(null, serviceKey, date),
    {},
  );
  const hydrated = useHydrated();

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {getService(serviceKey)?.groups.map((group) => (
        <fieldset key={group.label} className="flex flex-col gap-4 rounded-lg border p-4">
          <legend className="px-1 text-lg font-bold">{group.label}</legend>
          {group.roles.map((role) => (
            <Field key={role.key}>
              <FieldLabel htmlFor={role.key} className="text-base">
                {role.label}
              </FieldLabel>
              <Input
                id={role.key}
                name={role.key}
                maxLength={NAMES_MAX}
                defaultValue={names[role.key] ?? ""}
                autoComplete="off"
                className="h-11 text-base md:text-base"
              />
              {role.several && <FieldDescription>You can enter several names.</FieldDescription>}
            </Field>
          ))}
        </fieldset>
      ))}

      {state.message && (
        <p role="alert" className="text-lg font-medium text-destructive">
          {state.message}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-lg font-medium">
          Saved.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !hydrated} className="w-full text-base sm:w-fit">
        {pending && <Spinner />}
        {pending ? "Saving…" : "Save schedule"}
      </Button>
    </form>
  );
}
