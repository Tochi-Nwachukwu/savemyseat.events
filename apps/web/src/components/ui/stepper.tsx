import { cn } from "@/lib/cn";

export function Stepper({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-base font-medium text-muted">
        Step {step} of {total}
      </p>
      <div className="flex gap-3" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-2 flex-1 rounded-full transition-colors", i < step ? "bg-accent" : "bg-field")}
          />
        ))}
      </div>
    </div>
  );
}
