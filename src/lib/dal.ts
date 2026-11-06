import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/emails";

export type Admin = {
  id: string;
  email: string;
  name: string | null;
  canViewPrayer: boolean;
};

type SignedInUser = Admin & { role: Role };

/**
 * Returns whoever is signed in, admin or member, or null. Looks the user up on every call (rather
 * than trusting the JWT) so removing someone from the User table revokes access immediately.
 * Reads the request, so callers must render inside a <Suspense> boundary (Cache Components).
 */
async function getSignedInUser(): Promise<SignedInUser | null> {
  // auth() generates a random CSRF token when the request has none. Cache Components rejects
  // random values during prerendering, so mark this as request-time work first.
  await connection();
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  return db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, name: true, canViewPrayer: true, role: true },
  });
}

/** The signed-in admin, or null. Members get null too: they only see the serving schedule. */
export async function getAdmin(): Promise<Admin | null> {
  const user = await getSignedInUser();
  return user?.role === "ADMIN" ? asAdmin(user) : null;
}

export async function requireAdmin(): Promise<Admin> {
  const user = await getSignedInUser();
  if (!user) redirect("/admin/sign-in");
  // Signed in, but a member: nothing here for them.
  if (user.role !== "ADMIN") redirect("/");
  return asAdmin(user);
}

function asAdmin({ id, email, name, canViewPrayer }: SignedInUser): Admin {
  return { id, email, name, canViewPrayer };
}

export async function requirePrayerTeam(): Promise<Admin> {
  const admin = await requireAdmin();
  if (!admin.canViewPrayer) redirect("/admin");
  return admin;
}
