import { cn } from "@/lib/cn";

/** Label + control + hint/error, stacked like the onboarding form. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <label htmlFor={htmlFor} className="block text-lg font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-base text-danger">{error}</p>
      ) : hint ? (
        <p className="text-base leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
