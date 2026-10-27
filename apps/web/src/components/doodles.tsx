import { cn } from "@/lib/cn";

// Hand-drawn style accents. They inherit color via currentColor; size with className.
type DoodleProps = { className?: string };

export function SparkleDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8", className)}>
      <path
        d="M20 3c1.2 8.6 3.4 13.3 17 17-13.6 3.7-15.8 8.4-17 17-1.2-8.6-3.4-13.3-17-17 13.6-3.7 15.8-8.4 17-17Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SquiggleDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 24" fill="none" aria-hidden className={cn("h-5 w-24", className)}>
      <path
        d="M3 15c8-12 16-12 22 0s14 12 22 0 16-12 22 0 14 12 22 0 14-10 26-4"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoopDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 96 48" fill="none" aria-hidden className={cn("h-10 w-20", className)}>
      <path
        d="M4 38c14 2 26-4 30-14 3-8-6-14-12-8-7 7 3 20 18 20 18 0 30-16 52-14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("size-8", className)}>
      <path
        d="m20 4 4.6 10 10.9 1.2-8.1 7.4 2.3 10.7L20 27.8l-9.7 5.5 2.3-10.7-8.1-7.4L15.4 14 20 4Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DotsDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-10", className)}>
      {[6, 24, 42].flatMap((x) =>
        [6, 24, 42].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="currentColor" />),
      )}
    </svg>
  );
}

export function UnderlineDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 200 16" fill="none" preserveAspectRatio="none" aria-hidden className={cn("h-3 w-full", className)}>
      <path d="M3 11C50 4 120 2 197 8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
