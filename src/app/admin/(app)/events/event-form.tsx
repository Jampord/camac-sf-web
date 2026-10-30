"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { EventField, EventFormState, EventFormValues } from "@/lib/events/input";

type Props = {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  ministries: { id: string; name: string }[];
  defaults?: EventFormValues;
  submitLabel: string;
};

export function EventForm({ action, ministries, defaults = {}, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // After a failed submit, show what the admin typed; otherwise the saved values.
  const value = (field: EventField) => state.values?.[field] ?? defaults[field] ?? "";
  const error = (field: EventField) => state.errors?.[field];
  // aria-invalid styles the control red; FieldError shows the message under it.
  const invalid = (field: EventField) => (error(field) ? true : undefined);

  return (
    // Remount with the returned values after each failed submit, so every control
    // (including the Base UI checkbox) shows exactly what was sent.
    <form key={JSON.stringify(state.values ?? {})} action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={invalid("title")}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            maxLength={120}
            defaultValue={value("title")}
            aria-invalid={invalid("title")}
          />
          <FieldError>{error("title")}</FieldError>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalid("startsAt")}>
            <FieldLabel htmlFor="startsAt">Starts</FieldLabel>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={value("startsAt")}
              aria-invalid={invalid("startsAt")}
            />
            <FieldError>{error("startsAt")}</FieldError>
          </Field>
          <Field data-invalid={invalid("endsAt")}>
            <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={value("endsAt")}
              aria-invalid={invalid("endsAt")}
            />
            <FieldError>{error("endsAt")}</FieldError>
          </Field>
          <FieldDescription className="sm:col-span-2">Times are Philippine time.</FieldDescription>
        </div>

        <Field data-invalid={invalid("venue")}>
          <FieldLabel htmlFor="venue">Venue</FieldLabel>
          <Input
            id="venue"
            name="venue"
            maxLength={200}
            placeholder="Church, a member's home, outreach site, resort"
            defaultValue={value("venue")}
            aria-invalid={invalid("venue")}
          />
          <FieldError>{error("venue")}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="atChurchVenue"
            name="atChurchVenue"
            defaultChecked={value("atChurchVenue") === "on"}
          />
          {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
          <FieldLabel htmlFor="atChurchVenue" id="atChurchVenue-label" className="font-normal">
            At the church venue
          </FieldLabel>
        </Field>

        <Field data-invalid={invalid("ministryId")}>
          <FieldLabel htmlFor="ministryId">Ministry</FieldLabel>
          <NativeSelect
            id="ministryId"
            name="ministryId"
            defaultValue={value("ministryId")}
            aria-invalid={invalid("ministryId")}
            className="w-full"
          >
            <NativeSelectOption value="">Church-wide</NativeSelectOption>
            {ministries.map((ministry) => (
              <NativeSelectOption key={ministry.id} value={ministry.id}>
                {ministry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{error("ministryId")}</FieldError>
        </Field>

        <Field data-invalid={invalid("description")}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            defaultValue={value("description")}
            aria-invalid={invalid("description")}
          />
          <FieldDescription>Optional. Write it the way you&apos;d post it.</FieldDescription>
          <FieldError>{error("description")}</FieldError>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalid("contactPerson")}>
            <FieldLabel htmlFor="contactPerson">Contact person</FieldLabel>
            <Input
              id="contactPerson"
              name="contactPerson"
              maxLength={120}
              placeholder="Optional"
              defaultValue={value("contactPerson")}
              aria-invalid={invalid("contactPerson")}
            />
            <FieldError>{error("contactPerson")}</FieldError>
          </Field>
          <Field data-invalid={invalid("attire")}>
            <FieldLabel htmlFor="attire">Attire</FieldLabel>
            <Input
              id="attire"
              name="attire"
              maxLength={120}
              placeholder="Optional, e.g. Filipiniana"
              defaultValue={value("attire")}
              aria-invalid={invalid("attire")}
            />
            <FieldError>{error("attire")}</FieldError>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
          {state.errors && (
            <p role="status" className="text-sm text-destructive">
              Fix the highlighted fields, then save again.
            </p>
          )}
          {state.saved && !pending && (
            <p role="status" className="text-sm text-muted-foreground">
              Changes saved.
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
