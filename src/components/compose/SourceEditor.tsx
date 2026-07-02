"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_TONE } from "@/lib/platform-tone";
import { ALL_PLATFORMS, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceEditor({
  source,
  setSource,
  selected,
  toggle,
  onTransform,
  loading,
}: {
  source: string;
  setSource: (v: string) => void;
  selected: Platform[];
  toggle: (p: Platform) => void;
  onTransform: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <label className="text-sm text-muted-foreground">
        오늘의 소재 — 무슨 일이 있었나요?
      </label>
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onTransform();
          }
        }}
        placeholder="예: AI SDK로 구조화 출력 뽑다가 3시간 삽질한 이야기…"
        className="min-h-64 w-full resize-none rounded-2xl border border-border/60 bg-card p-5 text-sm leading-relaxed outline-none focus-visible:border-primary/50"
      />
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((p) => {
          const on = selected.includes(p);
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                on
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {PLATFORM_TONE[p].label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          ⌘+Enter 변형 · 1–4 탭 · C 복사
        </span>
        <Button
          onClick={onTransform}
          disabled={loading || !source.trim() || selected.length === 0}
        >
          <Wand2 className="size-4" /> {loading ? "변형 중…" : "변형하기"}
        </Button>
      </div>
    </div>
  );
}
