"use server";

import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { parseMemberForm, type MemberField } from "@/lib/members/input";

// Admins can add and remove members, and nothing else: no admins, no prayer access (those stay
// seed/DB only, brief §4). Server Actions can be called by a direct POST, so each one checks
// requireAdmin() itself.

export type MemberFormState = {
  errors?: Partial<Record<MemberField, string>>;
  values?: { email: string; name: string };
  added?: string; // the email just added
};

export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  await requireAdmin();

  const values = { email: String(formData.get("email") ?? ""), name: String(formData.get("name") ?? "") };
  const parsed = parseMemberForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values };
  const { email, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { role: true } });
  if (existing) return { errors: { email: alreadyListed(existing.role) }, values };

  try {
    await db.user.create({ data: { email, name, role: "MEMBER", canViewPrayer: false } });
  } catch (error) {
    // Someone else added the same email between our check and insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: alreadyListed("MEMBER") }, values };
    }
    throw error;
  }
  refresh();
  return { added: email };
}

function alreadyListed(role: string): string {
  return role === "ADMIN"
    ? "That's an admin, who can already see the schedule."
    : "That email is already a member.";
}

/** Only ever deletes members: an admin's id here changes nothing. */
export async function removeMember(id: string): Promise<{ changed: boolean }> {
  await requireAdmin();
  const { count } = await db.user.deleteMany({ where: { id, role: "MEMBER" } });
  refresh();
  return { changed: count > 0 };
}
