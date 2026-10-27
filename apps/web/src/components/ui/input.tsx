import { cn } from "@/lib/cn";

export const fieldClass = cn(
  "h-14 w-full rounded-2xl border-0 bg-field px-5 text-lg text-ink transition-colors",
  "placeholder:text-subtle hover:bg-field-hover",
  "focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30",
  "aria-invalid:ring-2 aria-invalid:ring-danger/40",
);

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

/** Input with a fixed prefix inside the bubble, e.g. "savemyseat.events/". */
export function PrefixInput({ prefix, className, ...props }: React.ComponentProps<"input"> & { prefix: string }) {
  return (
    <div
      className={cn(
        fieldClass,
        "flex items-center gap-0 focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/30",
        className,
      )}
    >
      <span className="shrink-0 text-subtle">{prefix}</span>
      <input className="h-full min-w-0 flex-1 bg-transparent text-ink focus:outline-none" {...props} />
    </div>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "h-auto min-h-32 resize-y py-4 leading-relaxed", className)} {...props} />;
}
