"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Flame } from "lucide-react";
import { SourceEditor } from "@/components/compose/SourceEditor";
import { PlatformVariations } from "@/components/compose/PlatformVariations";
import {
  ALL_PLATFORMS,
  type Platform,
  type PlatformVariation,
} from "@/lib/types";

export default function ComposePage() {
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState<Platform[]>([...ALL_PLATFORMS]);
  const [variations, setVariations] = useState<PlatformVariation[] | null>(
    null,
  );
  const [active, setActive] = useState<Platform>("x");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneStreak, setDoneStreak] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Prefill from the Today hub's "이걸로 쓰기".
  useEffect(() => {
    const p = localStorage.getItem("lt_prefill");
    if (p) {
      setSource(p);
      localStorage.removeItem("lt_prefill");
    }
  }, []);

  function toggle(p: Platform) {
    setSelected((s) =>
      s.includes(p) ? s.filter((x) => x !== p) : [...s, p],
    );
  }

  async function transform() {
    if (!source.trim() || selected.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setDoneStreak(null);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, platforms: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "변형 실패");
      setVariations(data.variations);
      setActive(data.variations[0]?.platform ?? "x");
      // Mobile: bring the results into view.
      if (window.innerWidth < 1024) {
        setTimeout(
          () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
          80,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "변형 실패");
    } finally {
      setLoading(false);
    }
  }

  async function complete() {
    if (!variations || saving || doneStreak !== null) return;
    setSaving(true);
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, variations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setDoneStreak(data.current);
      showToast(`오늘 발행 기록! 🔥 ${data.current}일 연속`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  // Keyboard: 1–4 switch tabs, C copies current body (outside inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "TEXTAREA" ||
        t.tagName === "INPUT" ||
        t.isContentEditable
      )
        return;
      if (!variations) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0 && variations[idx]) {
        setActive(variations[idx].platform);
        return;
      }
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const cur = variations.find((v) => v.platform === active);
        if (cur) {
          navigator.clipboard.writeText(cur.body).then(
            () => showToast("복사됨 ✓"),
            () => {},
          );
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variations, active, showToast]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SourceEditor
        source={source}
        setSource={setSource}
        selected={selected}
        toggle={toggle}
        onTransform={transform}
        loading={loading}
      />

      <div ref={resultsRef} className="space-y-4">
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading && <VariationsSkeleton count={selected.length} />}

        {!loading && !variations && !error && (
          <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed border-border/50 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              왼쪽에 소재를 쓰고
              <br />
              변형하기를 눌러보세요.
            </p>
          </div>
        )}

        {!loading && variations && (
          <>
            <PlatformVariations
              variations={variations}
              active={active}
              onSelect={setActive}
            />

            {doneStreak === null ? (
              <button
                onClick={complete}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-5 py-3.5 text-sm font-medium transition-colors hover:border-primary/50 disabled:opacity-60"
              >
                <Check className="size-4" />
                {saving ? "기록 중…" : "발행 완료로 기록"}
              </button>
            ) : (
              <div className="animate-pop flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-5 py-3.5">
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Flame className="size-4" /> {doneStreak}일 연속 — 오늘 완료!
                </span>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  오늘 페이지 →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div className="animate-rise fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function VariationsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border/60 bg-card p-1">
        {Array.from({ length: Math.max(count, 2) }).map((_, i) => (
          <div
            key={i}
            className="h-9 flex-1 animate-pulse rounded-lg bg-muted/60"
          />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted/80" />
        <div className="h-3.5 w-5/6 animate-pulse rounded bg-muted/80" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted/80" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted/60" />
      </div>
      <p className="animate-pulse px-1 text-xs text-muted-foreground">
        Claude가 플랫폼별 톤으로 쓰는 중… (20~30초)
      </p>
    </div>
  );
}
