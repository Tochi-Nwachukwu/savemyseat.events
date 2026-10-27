import { Logo } from "@/components/logo";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Logo href="/dashboard" />
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted sm:inline">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
