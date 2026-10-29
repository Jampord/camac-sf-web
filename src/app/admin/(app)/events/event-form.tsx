"use client";

import { useActionState } from "react";
import type { EventField, EventFormState, EventFormValues } from "@/lib/events/input";
import { inputClass, primaryButtonClass } from "../ui";

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

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Title" field="title" error={error("title")}>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={value("title")}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts (Manila time)" field="startsAt" error={error("startsAt")}>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={value("startsAt")}
            className={inputClass}
          />
        </Field>
        <Field label="Ends (Manila time)" field="endsAt" error={error("endsAt")}>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={value("endsAt")}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Venue" field="venue" error={error("venue")}>
        <input
          id="venue"
          name="venue"
          required
          maxLength={200}
          placeholder="Church, a member's home, outreach site, resort…"
          defaultValue={value("venue")}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="atChurchVenue"
          defaultChecked={value("atChurchVenue") === "on"}
          className="size-5"
        />
        At the church venue
      </label>

      <Field label="Ministry" field="ministryId" error={error("ministryId")}>
        <select
          id="ministryId"
          name="ministryId"
          defaultValue={value("ministryId")}
          className={inputClass}
        >
          <option value="">Church-wide</option>
          {ministries.map((ministry) => (
            <option key={ministry.id} value={ministry.id}>
              {ministry.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description (optional)" field="description" error={error("description")}>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={value("description")}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact person (optional)" field="contactPerson" error={error("contactPerson")}>
          <input
            id="contactPerson"
            name="contactPerson"
            maxLength={120}
            defaultValue={value("contactPerson")}
            className={inputClass}
          />
        </Field>
        <Field label="Attire (optional)" field="attire" error={error("attire")}>
          <input
            id="attire"
            name="attire"
            maxLength={120}
            placeholder="e.g. Filipiniana"
            defaultValue={value("attire")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <p role="status" className="text-base">
          {state.errors && "Please fix the highlighted fields."}
          {state.saved && !pending && "Saved."}
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  field,
  error,
  children,
}: {
  label: string;
  field: EventField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field} className="font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-base text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
