import { z } from "zod";
import { normalizeEmail } from "@/lib/emails";

// Validates the admin form for adding a member. Only the Google email is needed; the name just
// helps admins tell people apart in the list.

export const NAME_MAX = 120;

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter the email they use for Google.")
    .pipe(z.email("That doesn't look like an email address."))
    .transform(normalizeEmail),
  name: z
    .string()
    .trim()
    .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer.`)
    .optional()
    .transform((value) => value || null),
});

export type MemberInput = z.output<typeof schema>;
export type MemberField = keyof MemberInput;

export type ParsedMember =
  | { ok: true; data: MemberInput }
  | { ok: false; errors: Partial<Record<MemberField, string>> };

export function parseMemberForm(formData: FormData): ParsedMember {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const result = schema.safeParse({ email: text("email") ?? "", name: text("name") });
  if (result.success) return { ok: true, data: result.data };

  const errors: Partial<Record<MemberField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as MemberField;
    // Keep the first message per field.
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
