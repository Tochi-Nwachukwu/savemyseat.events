import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-field text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
};

export function Chip({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex h-7 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap", tones[tone], className)}
      {...props}
    />
  );
}
