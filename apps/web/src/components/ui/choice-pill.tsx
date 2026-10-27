import { cn } from "@/lib/cn";

/** Bubble radio/checkbox with a white dot, as in "Levels you teach". */
export function ChoicePill({
  label,
  className,
  type = "radio",
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { label: React.ReactNode; type?: "radio" | "checkbox" }) {
  return (
    <label
      className={cn(
        "group inline-flex h-14 cursor-pointer items-center gap-3 rounded-full bg-field pr-6 pl-4 text-lg text-muted transition-colors",
        "hover:bg-field-hover has-checked:bg-accent-soft has-checked:text-ink",
        "has-focus-visible:ring-4 has-focus-visible:ring-accent/25",
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          "grid size-7 place-items-center rounded-full bg-surface transition-colors",
          "peer-checked:bg-accent [&>span]:scale-0 peer-checked:[&>span]:scale-100",
        )}
      >
        <span className="size-2.5 rounded-full bg-surface transition-transform" />
      </span>
      {label}
    </label>
  );
}
