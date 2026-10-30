import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin sign-in" };

export default function SignInPage({ searchParams }: PageProps<"/admin/sign-in">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <Image src="/camac-mark.png" alt="" width={447} height={418} priority className="h-20 w-auto self-start" />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Admin sign-in</h1>
        <p className="text-muted-foreground">For church admins managing events.</p>
      </div>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
      >
        <Button type="submit" size="lg" className="h-11 w-full text-base">
          Sign in with Google
        </Button>
      </form>
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
    <p
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive"
    >
      {message}
    </p>
  );
}
