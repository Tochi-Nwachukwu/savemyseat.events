import Link from "next/link";

/** Minimal frame for guest-facing pages. */
export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-8 sm:px-6 sm:py-12">
      <main>{children}</main>
      <footer className="mt-14 text-center text-sm text-subtle">
        Made with{" "}
        <Link href="/" className="font-medium text-muted underline-offset-2 hover:underline">
          SaveMySeat
        </Link>
      </footer>
    </div>
  );
}
