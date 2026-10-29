/** Emails are compared lowercased everywhere (allowlist lookups, seed). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parses a comma/whitespace-separated env var into unique, normalized emails. */
export function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  const emails = value
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter((email) => email.includes("@"));
  return [...new Set(emails)];
}
