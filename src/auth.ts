import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/emails";

// Google sign-in for admins only. The User table *is* the allowlist (brief §4):
// accounts are created by the seed script, never by signing in.
// Reads AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/sign-in",
    error: "/admin/sign-in",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email || profile.email_verified === false) return false;
      const user = await db.user.findUnique({
        where: { email: normalizeEmail(profile.email) },
        select: { id: true },
      });
      return Boolean(user);
    },
  },
});
