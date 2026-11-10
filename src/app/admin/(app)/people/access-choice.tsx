"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ACCESS_INFO, ACCESS_LEVELS, type Access } from "@/lib/people/access";

// The access level as large tappable cards, plus "Can manage people" for admin levels. Shown
// only to people managers; the field names match src/lib/people/input.ts.

export function AccessChoice({
  access,
  onAccessChange,
  defaultCanManagePeople,
  error,
}: {
  access: Access;
  onAccessChange: (access: Access) => void;
  defaultCanManagePeople?: boolean;
  error?: string;
}) {
  // Unique per form: the page has one in the add form and one in each Change dialog.
  const id = useId();
  const manageId = `${id}-manage`;

  return (
    <>
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
              onChange={() => onAccessChange(level)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{ACCESS_INFO[level].label}</span>
              <span className="text-sm text-muted-foreground">{ACCESS_INFO[level].description}</span>
            </span>
          </label>
        ))}
        <FieldError>{error}</FieldError>
      </fieldset>

      {access !== "member" && (
        <Field orientation="horizontal">
          <Checkbox id={manageId} name="canManagePeople" defaultChecked={defaultCanManagePeople} />
          {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
          <FieldLabel htmlFor={manageId} id={`${manageId}-label`} className="font-normal">
            Can manage people: add, change and remove admins and the prayer team
          </FieldLabel>
        </Field>
      )}
    </>
  );
}
