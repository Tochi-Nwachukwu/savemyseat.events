import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-ink text-white hover:bg-ink-hover",
  secondary: "bg-field text-ink hover:bg-field-hover",
  ghost: "text-ink hover:bg-field",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  block?: boolean;
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block,
  className,
}: Pick<ButtonProps, "variant" | "size" | "block" | "className"> = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    block && "w-full",
    className,
  );
}

export function Button({ variant, size, block, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, block, className })} {...props} />;
}
