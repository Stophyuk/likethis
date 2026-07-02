"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { StreakInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CheckInButton({
  todayPublished,
  onChange,
}: {
  todayPublished: boolean;
  onChange: (s: StreakInfo) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ undo: todayPublished }),
      });
      if (res.ok) {
        const s = (await res.json()) as StreakInfo;
        onChange(s);
        if (!todayPublished) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 700);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-medium transition-colors disabled:opacity-60",
        todayPublished
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/60 hover:border-primary/50",
        celebrate && "animate-pop",
      )}
    >
      <Check className="size-4" />
      {todayPublished ? "오늘 올렸어요 🔥" : "오늘 올렸어요"}
    </button>
  );
}
