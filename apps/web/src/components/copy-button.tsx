"use client";

import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui";

export function CopyButton({ text, label = "Copy link", ...props }: { text: string; label?: string } & Omit<ButtonProps, "onClick">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      {...props}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <CheckIcon size={16} weight="bold" aria-hidden /> : <CopySimpleIcon size={16} weight="duotone" aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}
