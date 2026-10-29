import { Suspense } from "react";
import type { Metadata } from "next";
import { signIn } from "@/auth";

export const metadata: Metadata = { title: "Admin sign-in" };

export default function SignInPage({ searchParams }: PageProps<"/admin/sign-in">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Admin sign-in</h1>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg bg-foreground px-4 py-3 font-semibold text-background"
        >
          Sign in with Google
        </button>
      </form>
      <p className="text-base text-muted">Only church admins can sign in.</p>
    </main>
  );
}

async function SignInError({
  searchParams,
}: {
  searchParams: PageProps<"/admin/sign-in">["searchParams"];
}) {
  const { error } = await searchParams;
  if (!error) return null;

  const message =
    error === "AccessDenied"
      ? "This Google account isn't on the admin list. Ask the app builder to add you."
      : "Sign-in didn't work. Please try again.";

  return (
    <p role="alert" className="rounded-lg border border-red-700 p-3 text-red-700">
      {message}
    </p>
  );
}
