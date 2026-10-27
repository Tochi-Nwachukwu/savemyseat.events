import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const callbackURL = safeNext(next);
  if (await getSession()) redirect(callbackURL);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-4 py-6 sm:px-6">
      <Logo />
      <div className="flex flex-1 flex-col justify-center py-16">
        <LoginForm callbackURL={callbackURL} linkExpired={Boolean(error)} />
      </div>
    </main>
  );
}
