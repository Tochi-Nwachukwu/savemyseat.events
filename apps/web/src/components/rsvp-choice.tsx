"use client";

import { cn } from "@/lib/cn";

/** Big pill for "I'll be there" / "Can't make it". */
export function ChoiceButton({
  selected,
  disabled,
  onClick,
  tone,
  icon,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone: "mint" | "blush";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const selectedClass = tone === "mint" ? "bg-mint text-mint-ink ring-2 ring-mint-ink/40" : "bg-blush text-blush-ink ring-2 ring-blush-ink/40";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-16 items-center justify-center gap-2.5 rounded-full text-lg font-medium transition-all",
        "focus-visible:ring-4 focus-visible:ring-accent/25 focus-visible:outline-none disabled:opacity-50",
        selected ? selectedClass : "bg-field text-ink hover:bg-field-hover",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
