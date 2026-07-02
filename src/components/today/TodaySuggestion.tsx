"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailySuggestion, TopicSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TodaySuggestion({
  suggestion,
}: {
  suggestion: DailySuggestion | null;
}) {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSuggestion[]>(
    suggestion?.topics ?? [],
  );
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const topic = topics[index];

  function useTopic() {
    if (!topic) return;
    const text = [topic.title, "", ...topic.keyPoints].join("\n");
    localStorage.setItem("lt_prefill", text);
    router.push("/compose");
  }

  async function regenerate() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/suggest", { method: "POST" });
      if (res.ok) {
        const s = (await res.json()) as DailySuggestion;
        setTopics(s.topics ?? []);
        setIndex(0);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-rise space-y-3" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          오늘의 소재
        </div>
        {topics.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {index + 1} / {topics.length}
          </span>
        )}
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        {busy ? (
          <div className="space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted/80" />
            <div className="h-3.5 w-full animate-pulse rounded bg-muted/60" />
            <p className="animate-pulse pt-1 text-xs text-muted-foreground">
              일기와 관심사에서 소재를 발굴하는 중…
            </p>
          </div>
        ) : topic ? (
          <>
            <h2 className="font-display text-xl">{topic.title}</h2>
            <p className="mt-1 text-sm text-primary">{topic.angle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {topic.why}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={useTopic}>
                이걸로 쓰기 <ArrowRight className="size-4" />
              </Button>
              {topics.length > 1 && (
                <button
                  onClick={() => setIndex((index + 1) % topics.length)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  다른 소재
                </button>
              )}
              <button
                onClick={regenerate}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
                새로 뽑기
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              아직 오늘의 소재가 없어요. 관심사와 노션 일기를 바탕으로 바로
              뽑아드릴 수 있어요.
            </p>
            <div className="mt-4">
              <Button onClick={regenerate} variant="secondary">
                <RefreshCw className="size-4" /> 소재 뽑기
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
