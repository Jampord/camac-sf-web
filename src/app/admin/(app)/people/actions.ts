"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin, requirePeopleManager, type Admin } from "@/lib/dal";
import { db } from "@/lib/db";
import { ACCESS_INFO, accessColumns, accessOf } from "@/lib/people/access";
import { parseAccessForm, parsePersonForm, type AccessInput, type PersonField } from "@/lib/people/input";
import { changeProblem, LAST_MANAGER } from "@/lib/people/rules";
import { notifyPrayerTeamChange } from "@/lib/prayer/notify";

// Any admin can add, rename and remove members. Anything touching admins or the prayer team
// needs "can manage people", and nobody changes their own access (brief §4, src/lib/people/
// rules.ts). Server Actions can be called by a direct POST, so each one checks access itself,
// and a form without an access choice only ever means "member".

export type PersonFormState = {
  errors?: Partial<Record<PersonField, string>>;
  values?: { email: string; name: string; access: string; canManagePeople: boolean };
  added?: string; // "juan@example.com as Admin"
};

export async function addPerson(_prev: PersonFormState, formData: FormData): Promise<PersonFormState> {
  const viewer = await requireAdmin();

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
  if (access === "prayer") await tellPrayerTeam(name ?? email, viewer);
  refresh();
  return { added: `${email} as ${ACCESS_INFO[access].label}` };
}

function alreadyListed(user: Parameters<typeof accessOf>[0]): string {
  return `That email is already on the list, as ${ACCESS_INFO[accessOf(user)].label}.`;
}

export type ChangeResult =
  | { ok: true; message: string }
  | { ok: false; error?: string; errors?: Partial<Record<keyof AccessInput, string>> };

/** A change the rules don't allow: rolls the transaction back and is shown to the admin. */
class Refused extends Error {}

const GONE = "This person was already removed. Reload the page to see the latest.";

/** Change access (and the name). Everyone but people managers can only rename members. */
export async function updatePerson(id: string, formData: FormData): Promise<ChangeResult> {
  const viewer = await requireAdmin();
  const parsed = parseAccessForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const { name, access, canManagePeople } = parsed.data;
  // Set inside the transaction when this change puts them on the prayer team.
  const joined = { prayerTeam: "" };

  const result = await guarded(async (tx) => {
    const target = await tx.user.findUnique({ where: { id }, select: { email: true, role: true, canViewPrayer: true } });
    if (!target) throw new Refused(GONE);
    const problem = changeProblem(viewer, { id, access: accessOf(target) }, access);
    if (problem) throw new Refused(problem);

    await tx.user.update({ where: { id }, data: { name, ...accessColumns(access, canManagePeople) } });
    await keepAPeopleManager(tx);
    if (access === "prayer" && accessOf(target) !== "prayer") joined.prayerTeam = name ?? target.email;
    return `Saved: ${name ?? target.email} is ${an(ACCESS_INFO[access].label)}.`;
  });

  if (result.ok && joined.prayerTeam) await tellPrayerTeam(joined.prayerTeam, viewer);
  return result;
}

/**
 * Emails the whole prayer team, newcomer included, that someone joined (brief §4). Sent after
 * the response, so a slow or failing Gmail never holds up or undoes the change.
 */
async function tellPrayerTeam(newcomer: string, addedBy: Admin) {
  const requestHeaders = await headers();
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  after(() => notifyPrayerTeamChange(newcomer, addedBy.name ?? addedBy.email, `${origin}/admin/prayer`));
}

/** Removes anyone the rules allow. Their events stay, with no creator recorded. */
export async function removePerson(id: string): Promise<ChangeResult> {
  const viewer = await requireAdmin();

  return guarded(async (tx) => {
    const target = await tx.user.findUnique({ where: { id }, select: { email: true, name: true, role: true, canViewPrayer: true } });
    if (!target) throw new Refused(GONE);
    const problem = changeProblem(viewer, { id, access: accessOf(target) });
    if (problem) throw new Refused(problem);

    await tx.user.delete({ where: { id } });
    await keepAPeopleManager(tx);
    return `Removed: ${target.name ?? target.email} can no longer sign in.`;
  });
}

type Tx = Prisma.TransactionClient;

async function keepAPeopleManager(tx: Tx) {
  if ((await tx.user.count({ where: { canManagePeople: true } })) === 0) throw new Refused(LAST_MANAGER);
}

// Serializable, so two managers demoting each other at the same moment can't both succeed and
// leave nobody who can manage people: one of them fails and is asked to try again.
async function guarded(change: (tx: Tx) => Promise<string>): Promise<ChangeResult> {
  try {
    const message = await db.$transaction(change, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    refresh();
    return { ok: true, message };
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { ok: false, error: "Someone else changed this at the same time. Reload the page and try again." };
    }
    throw error;
  }
}

/** "an Admin", "a Member". */
function an(label: string): string {
  return `${/^[AEIOU]/.test(label) ? "an" : "a"} ${label}`;
}
