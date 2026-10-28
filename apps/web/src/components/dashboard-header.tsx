import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui";
import { isAdmin } from "@/lib/session";

export async function DashboardHeader({ user }: { user: { id: string; email: string } }) {
  const admin = await isAdmin(user.id);
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Logo href="/dashboard" />
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
        {admin && (
          <Link href="/admin" className={buttonClass({ variant: "ghost", size: "sm" })}>
            Admin
          </Link>
        )}
        <SignOutButton />
      </div>
    </header>
  );
}
