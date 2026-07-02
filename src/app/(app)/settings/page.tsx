"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORM_TONE } from "@/lib/platform-tone";
import { ALL_PLATFORMS, type Platform, type Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULTS: Settings = {
  interests: [],
  voiceSamples: [],
  toneDescription: "",
  slackWebhookUrl: "",
  publishHourKST: 9,
  enabledPlatforms: [...ALL_PLATFORMS],
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : DEFAULTS))
      .then((data: Settings) => setS({ ...DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addInterest() {
    const v = interestInput.trim();
    if (v && !s.interests.includes(v)) {
      setS({ ...s, interests: [...s.interests, v] });
    }
    setInterestInput("");
  }

  function togglePlatform(p: Platform) {
    const has = s.enabledPlatforms.includes(p);
    setS({
      ...s,
      enabledPlatforms: has
        ? s.enabledPlatforms.filter((x) => x !== p)
        : [...s.enabledPlatforms, p],
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-8">
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/80" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="font-display text-3xl tracking-tight">설정</h1>

      <Section title="관심사" desc="매일 소재를 제안할 때 참고해요.">
        {s.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {s.interests.map((it) => (
              <span
                key={it}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
              >
                {it}
                <button
                  onClick={() =>
                    setS({
                      ...s,
                      interests: s.interests.filter((x) => x !== it),
                    })
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addInterest();
              }
            }}
            placeholder="예: AI, 1인 개발, SaaS"
          />
          <Button variant="secondary" onClick={addInterest}>
            추가
          </Button>
        </div>
      </Section>

      <Section
        title="내 톤 샘플"
        desc="과거에 쓴 글 3~5개. AI가 내 문체를 흉내내는 데 씁니다."
      >
        <textarea
          value={s.voiceSamples.join("\n---\n")}
          onChange={(e) =>
            setS({ ...s, voiceSamples: e.target.value.split("\n---\n") })
          }
          placeholder={"글 하나…\n---\n또 다른 글…"}
          className="min-h-40 w-full resize-none rounded-xl border border-border/60 bg-card p-4 text-sm leading-relaxed outline-none focus-visible:border-primary/50"
        />
        <p className="text-xs text-muted-foreground">
          --- (하이픈 3개) 로 글을 구분하세요.
        </p>
      </Section>

      <Section title="톤 설명" desc="원하는 말투를 한 줄로.">
        <Input
          value={s.toneDescription}
          onChange={(e) => setS({ ...s, toneDescription: e.target.value })}
          placeholder="예: 담백하고 솔직하게, 이모지는 최소한"
        />
      </Section>

      <Section title="사용할 플랫폼">
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((p) => {
            const on = s.enabledPlatforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
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
      </Section>

      <Section
        title="Slack 알림"
        desc="매일 소재와 넛지를 받을 Incoming Webhook URL."
      >
        <Input
          value={s.slackWebhookUrl}
          onChange={(e) => setS({ ...s, slackWebhookUrl: e.target.value })}
          placeholder="https://hooks.slack.com/services/..."
        />
      </Section>

      <Section title="발행 시간" desc="이 시간에 맞춰 넛지 문구를 준비해요 (KST).">
        <Input
          type="number"
          min={0}
          max={23}
          value={s.publishHourKST}
          onChange={(e) =>
            setS({ ...s, publishHourKST: Number(e.target.value) })
          }
          className="w-24"
        />
      </Section>

      <div className="flex items-center gap-3 border-t border-border/50 pt-6">
        <Button onClick={save}>저장</Button>
        {saved && <span className="text-sm text-primary">저장됐어요 ✓</span>}
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-medium">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}
