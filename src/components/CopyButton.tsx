"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "복사",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — no-op
    }
  }

  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs transition-colors",
        copied ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-3.5" /> 복사됨
        </>
      ) : (
        <>
          <Copy className="size-3.5" /> {label}
        </>
      )}
    </button>
  );
}
