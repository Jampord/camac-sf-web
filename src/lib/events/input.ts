import { z } from "zod";
import { eventDays } from "@/lib/events/format";
import { isManilaInput, manilaInputToUtc } from "@/lib/time";

// Validates the admin event form (brief §6.1). Date/time inputs are Manila wall-clock values.
// All-day events send dates only ("2027-04-10") and run from midnight on the first day to
// 11:59 PM on the last, so "upcoming" and "ended" work the same as for timed events.

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null);

// An unticked checkbox is simply missing from FormData.
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on");

// Dates stay raw strings until we know whether the event is all-day (see below).
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const dateOnly = (value: string) => value.slice(0, 10); // "2027-04-10T09:00" -> "2027-04-10"

export const eventInputSchema = z
  .object({
    title: requiredText("Title", 120),
    description: optionalText("Description", 5000),
    startsAt: z.string().trim().min(1, "Start is required."),
    endsAt: z.string().trim().min(1, "End is required."),
    allDay: checkbox,
    // Weekly or not at all (brief §6.1). Missing = doesn't repeat.
    recurrence: z
      .enum(["NONE", "WEEKLY"], { error: "Pick how often it repeats." })
      .optional()
      .transform((value) => value ?? "NONE"),
    recurrenceUntil: z.string().trim().optional(),
    venue: requiredText("Venue", 200),
    atChurchVenue: checkbox,
    ministryId: z
      .string()
      .trim()
      .transform((value) => value || null), // "" = Church-wide
    contactPerson: optionalText("Contact person", 120),
    attire: optionalText("Attire", 120),
  })
  .superRefine((event, ctx) => {
    for (const field of ["startsAt", "endsAt"] as const) {
      const value = event[field];
      const valid = event.allDay
        ? isManilaInput(dateOnly(value))
        : DATE_TIME.test(value) && isManilaInput(value);
      if (!valid) {
        const message = event.allDay ? "Enter a valid date." : "Enter a valid date and time.";
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    }
    const until = repeatUntil(event);
    if (until && !isManilaInput(until)) {
      ctx.addIssue({ code: "custom", path: ["recurrenceUntil"], message: "Enter a valid date." });
    }
  })
  .transform((event) => {
    const until = repeatUntil(event);
    return {
      ...event,
      startsAt: manilaInputToUtc(event.allDay ? dateOnly(event.startsAt) : event.startsAt),
      endsAt: manilaInputToUtc(event.allDay ? `${dateOnly(event.endsAt)}T23:59` : event.endsAt),
      // The last week included: stored as the end of that Manila day.
      recurrenceUntil: until ? manilaInputToUtc(`${until}T23:59`) : null,
    };
  })
  .superRefine((event, ctx) => {
    if (event.endsAt < event.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: event.allDay
          ? "The end date must be on or after the start date."
          : "The end must be after the start.",
      });
      return;
    }
    if (event.recurrence !== "WEEKLY") return;
    // Every week's occurrence is the same single day; multi-day repeats aren't supported.
    if (eventDays(event.startsAt, event.endsAt).length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "A weekly event has to end on the day it starts.",
      });
    }
    if (event.recurrenceUntil && event.recurrenceUntil < event.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrenceUntil"],
        message: "Pick a date on or after the first date.",
      });
    }
  });

/** The "repeat until" date (YYYY-MM-DD) for weekly events; ignored otherwise. */
function repeatUntil(event: { recurrence: string; recurrenceUntil?: string }): string | null {
  if (event.recurrence !== "WEEKLY" || !event.recurrenceUntil) return null;
  return dateOnly(event.recurrenceUntil);
}

export type EventInput = z.output<typeof eventInputSchema>;
export type EventField = keyof z.input<typeof eventInputSchema>;

const EVENT_FIELDS = [
  "title",
  "description",
  "startsAt",
  "endsAt",
  "allDay",
  "recurrence",
  "recurrenceUntil",
  "venue",
  "atChurchVenue",
  "ministryId",
  "contactPerson",
  "attire",
] as const satisfies readonly EventField[];

/** The raw strings from the form, used to refill it after a failed submit. */
export type EventFormValues = Partial<Record<EventField, string>>;

/** useActionState state for the create/edit form. Empty = not submitted yet. */
export type EventFormState = {
  errors?: Partial<Record<EventField, string>>;
  values?: EventFormValues;
  saved?: boolean;
};

export type ParsedEventForm =
  | { success: true; data: EventInput }
  | { success: false; errors: Partial<Record<EventField, string>>; values: EventFormValues };

export function parseEventForm(formData: FormData): ParsedEventForm {
  const values: EventFormValues = {};
  for (const field of EVENT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }

  const result = eventInputSchema.safeParse({ ...values, ministryId: values.ministryId ?? "" });
  if (result.success) return { success: true, data: result.data };

  // Keep the first message per field.
  const errors: Partial<Record<EventField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as EventField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors, values };
}
