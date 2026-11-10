"use server";

import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin, requirePeopleManager } from "@/lib/dal";
import { db } from "@/lib/db";
import { ACCESS_INFO, accessColumns, accessOf } from "@/lib/people/access";
import { parsePersonForm, type PersonField } from "@/lib/people/input";

// Any admin can add and remove members. Adding an admin or prayer-team member needs "can manage
// people" (brief §4). Server Actions can be called by a direct POST, so each one checks access
// itself, and a form without an access choice only ever adds a member.

export type PersonFormState = {
  errors?: Partial<Record<PersonField, string>>;
  values?: { email: string; name: string; access: string; canManagePeople: boolean };
  added?: string; // "juan@example.com as Admin"
};

export async function addPerson(_prev: PersonFormState, formData: FormData): Promise<PersonFormState> {
  await requireAdmin();

  const values = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    access: String(formData.get("access") ?? "member"),
    canManagePeople: formData.get("canManagePeople") === "on",
  };
  const parsed = parsePersonForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values };
  const { email, name, access, canManagePeople } = parsed.data;

  if (access !== "member") await requirePeopleManager();

  const existing = await db.user.findUnique({ where: { email }, select: { role: true, canViewPrayer: true } });
  if (existing) return { errors: { email: alreadyListed(existing) }, values };

  try {
    await db.user.create({ data: { email, name, ...accessColumns(access, canManagePeople) } });
  } catch (error) {
    // Someone else added the same email between our check and insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: "That email was just added by someone else." }, values };
    }
    throw error;
  }
  refresh();
  return { added: `${email} as ${ACCESS_INFO[access].label}` };
}

function alreadyListed(user: Parameters<typeof accessOf>[0]): string {
  return `That email is already on the list, as ${ACCESS_INFO[accessOf(user)].label}.`;
}

/** Only ever deletes members: an admin's id here changes nothing. */
export async function removeMember(id: string): Promise<{ changed: boolean }> {
  await requireAdmin();
  const { count } = await db.user.deleteMany({ where: { id, role: "MEMBER" } });
  refresh();
  return { changed: count > 0 };
}
