import { ArmchairIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { IconBubble } from "@/components/ui";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <IconBubble icon={ArmchairIcon} tone="lilac" size="sm" />
      <span className="text-xl font-semibold tracking-tight">SaveMySeat</span>
    </Link>
  );
}
