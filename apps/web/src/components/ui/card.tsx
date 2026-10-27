import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-3xl bg-surface p-6 shadow-[0_1px_2px_rgb(31_29_51/0.04)]", className)} {...props} />;
}
