import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export const pastelTones = {
  lilac: "bg-lilac text-lilac-ink",
  peach: "bg-peach text-peach-ink",
  mint: "bg-mint text-mint-ink",
  sky: "bg-sky text-sky-ink",
  butter: "bg-butter text-butter-ink",
  blush: "bg-blush text-blush-ink",
};
export type PastelTone = keyof typeof pastelTones;

const sizes = {
  sm: { box: "size-9 rounded-xl", icon: 18 },
  md: { box: "size-12 rounded-2xl", icon: 24 },
  lg: { box: "size-14 rounded-2xl", icon: 28 },
};

/** Duotone icon in a soft pastel bubble. */
export function IconBubble({
  icon: IconComponent,
  tone = "lilac",
  size = "md",
  className,
}: {
  icon: Icon;
  tone?: PastelTone;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={cn("grid shrink-0 place-items-center", s.box, pastelTones[tone], className)}>
      <IconComponent size={s.icon} weight="duotone" aria-hidden />
    </span>
  );
}
