import type { Metadata } from "next";
import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { appUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Create your event" };

export default async function NewEventPage() {
  await requireUser("/new");
  return (
    <div className="mx-auto max-w-[600px] px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <Logo href="/dashboard" />
        <Link href="/dashboard" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Cancel
        </Link>
      </header>
      <main className="pt-6">
        <EventForm mode="create" appHost={appUrl().replace(/^https?:\/\//, "")} />
      </main>
    </div>
  );
}
