import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/emails";

export type Admin = {
  id: string;
  email: string;
  name: string | null;
  canViewPrayer: boolean;
};

/**
 * Returns the signed-in admin, or null. Looks the user up on every call (rather than trusting
 * the JWT) so removing someone from the User table revokes access immediately.
 * Reads the request, so callers must render inside a <Suspense> boundary (Cache Components).
 */
export async function getAdmin(): Promise<Admin | null> {
  // auth() generates a random CSRF token when the request has none. Cache Components rejects
  // random values during prerendering, so mark this as request-time work first.
  await connection();
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  return db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, name: true, canViewPrayer: true },
  });
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/sign-in");
  return admin;
}

export async function requirePrayerTeam(): Promise<Admin> {
  const admin = await requireAdmin();
  if (!admin.canViewPrayer) redirect("/admin");
  return admin;
}
