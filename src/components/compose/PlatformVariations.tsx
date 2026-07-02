"use client";

import { PLATFORM_TONE } from "@/lib/platform-tone";
import type { Platform, PlatformVariation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";

export function PlatformVariations({
  variations,
  active,
  onSelect,
}: {
  variations: PlatformVariation[];
  active: Platform;
  onSelect: (p: Platform) => void;
}) {
  const current =
    variations.find((v) => v.platform === active) ?? variations[0];
  if (!current) return null;

  const tone = PLATFORM_TONE[current.platform];
  const over = current.charCount > tone.maxChars;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1">
        {variations.map((v, i) => (
          <button
            key={v.platform}
            onClick={() => onSelect(v.platform)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active === v.platform
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PLATFORM_TONE[v.platform].label}
            <span className="ml-1.5 hidden font-mono text-[10px] opacity-50 lg:inline">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={cn(
              "font-mono text-xs",
              over ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {current.charCount} / {tone.maxChars}
            {tone.sweetSpot ? ` · sweet ~${tone.sweetSpot}` : ""}
          </span>
          <CopyButton text={current.body} />
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {current.body}
        </p>

        {current.firstComment && (
          <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-primary">
                첫 댓글 (링크)
              </span>
              <CopyButton text={current.firstComment} />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {current.firstComment}
            </p>
          </div>
        )}
      </div>

      {current.tips.length > 0 && (
        <ul className="space-y-1 px-1">
          {current.tips.map((t, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              · {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
