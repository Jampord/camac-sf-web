import { z } from "zod";
import { normalizeEmail } from "@/lib/emails";
import { ACCESS_LEVELS } from "./access";

// Validates the admin form for adding a person. Only the Google email is needed; the name just
// helps admins tell people apart in the list. Admins who can't manage people get a form with no
// access choice, so a missing one means "member". Whether the sender may give that access is
// checked in the action, not here.

export const NAME_MAX = 120;

// Name and access are shared with the Change access form; the email can't be changed there.
const accessSchema = z.object({
  name: z
    .string()
    .trim()
    .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer.`)
    .optional()
    .transform((value) => value || null),
  access: z.enum(ACCESS_LEVELS, "Choose what they can do.").default("member"),
  // An unticked checkbox is simply missing from FormData.
  canManagePeople: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

const schema = accessSchema.extend({
  email: z
    .string()
    .trim()
    .min(1, "Enter the email they use for Google.")
    .pipe(z.email("That doesn't look like an email address."))
    .transform(normalizeEmail),
});

export type PersonInput = z.output<typeof schema>;
export type PersonField = keyof PersonInput;

export type ParsedPerson =
  | { ok: true; data: PersonInput }
  | { ok: false; errors: Partial<Record<PersonField, string>> };

export function parsePersonForm(formData: FormData): ParsedPerson {
  return parse(schema, formData);
}

export type AccessInput = z.output<typeof accessSchema>;
export type ParsedAccess =
  | { ok: true; data: AccessInput }
  | { ok: false; errors: Partial<Record<keyof AccessInput, string>> };

/** The Change access form: name, access level and the people-manager checkbox. */
export function parseAccessForm(formData: FormData): ParsedAccess {
  return parse(accessSchema, formData);
}

function parse<S extends typeof accessSchema | typeof schema>(target: S, formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const result = target.safeParse({
    email: text("email") ?? "",
    name: text("name"),
    access: text("access"),
    canManagePeople: text("canManagePeople"),
  });
  if (result.success) return { ok: true as const, data: result.data as z.output<S> };

  const errors: Partial<Record<PersonField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as PersonField;
    // Keep the first message per field.
    errors[field] ??= issue.message;
  }
  return { ok: false as const, errors };
}
