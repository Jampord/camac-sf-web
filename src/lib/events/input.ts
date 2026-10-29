import { z } from "zod";
import { isManilaInput, manilaInputToUtc } from "@/lib/time";

// Validates the admin event form (brief §6.1). Date/time inputs are Manila wall-clock values.
// Poster, all-day and recurrence fields arrive in build step 2.

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

const manilaDateTime = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(isManilaInput, `Enter a valid ${label.toLowerCase()}.`)
    .transform(manilaInputToUtc);

export const eventInputSchema = z
  .object({
    title: requiredText("Title", 120),
    description: optionalText("Description", 5000),
    startsAt: manilaDateTime("Start date and time"),
    endsAt: manilaDateTime("End date and time"),
    venue: requiredText("Venue", 200),
    atChurchVenue: z
      .string()
      .optional()
      .transform((value) => value === "on"),
    ministryId: z
      .string()
      .trim()
      .transform((value) => value || null),
    contactPerson: optionalText("Contact person", 120),
    attire: optionalText("Attire", 120),
  })
  .refine((event) => event.endsAt >= event.startsAt, {
    path: ["endsAt"],
    message: "The end must be after the start.",
  });

export type EventInput = z.output<typeof eventInputSchema>;
export type EventField = keyof z.input<typeof eventInputSchema>;

export const EVENT_FIELDS = [
  "title",
  "description",
  "startsAt",
  "endsAt",
  "venue",
  "atChurchVenue",
  "ministryId",
  "contactPerson",
  "attire",
] as const satisfies readonly EventField[];

export type EventFormValues = Partial<Record<EventField, string>>;

/** useActionState state for the create/edit form. */
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

  const result = eventInputSchema.safeParse({
    ...values,
    ministryId: values.ministryId ?? "",
  });
  if (result.success) return { success: true, data: result.data };

  const errors: Partial<Record<EventField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as EventField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors, values };
}
