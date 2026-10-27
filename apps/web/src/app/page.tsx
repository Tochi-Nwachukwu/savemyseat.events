import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">SaveMySeat</span>
        <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Sign in
        </Link>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <h1 className="text-5xl leading-[1.05] font-semibold sm:text-6xl">Save the date. Save their seat.</h1>
        <p className="mt-6 max-w-lg text-xl leading-relaxed text-muted">
          Create a beautiful invitation, email it to your guests, and watch the RSVPs roll in, all from one
          simple table.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/new" className={buttonClass({ size: "lg" })}>
            Create your event
          </Link>
          <Link href="/joseph" className={buttonClass({ variant: "secondary", size: "lg" })}>
            See an example
          </Link>
        </div>
      </section>
    </main>
  );
}
