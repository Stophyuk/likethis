"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StreakCard } from "@/components/streak/StreakCard";
import { StreakCalendar } from "@/components/streak/StreakCalendar";
import { TodaySuggestion } from "@/components/today/TodaySuggestion";
import { CheckInButton } from "@/components/today/CheckInButton";
import type { StreakInfo, DailySuggestion } from "@/lib/types";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayLabel() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${DAYS[d.getDay()]}`;
}

export function TodayClient({
  initialStreak,
  suggestion,
}: {
  initialStreak: StreakInfo;
  suggestion: DailySuggestion | null;
}) {
  const [streak, setStreak] = useState(initialStreak);

  return (
    <div className="space-y-8">
      <div className="animate-rise flex items-baseline justify-between">
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          오늘도 한 걸음.
        </h1>
        <span className="font-mono text-xs text-muted-foreground">
          {todayLabel()}
        </span>
      </div>

      <div className="animate-rise" style={{ animationDelay: "60ms" }}>
        <StreakCard streak={streak} />
      </div>

      <div className="animate-rise" style={{ animationDelay: "90ms" }}>
        <StreakCalendar publishedDates={streak.publishedDates} />
      </div>

      <TodaySuggestion suggestion={suggestion} />

      <section
        className="animate-rise flex flex-col gap-3 sm:flex-row"
        style={{ animationDelay: "180ms" }}
      >
        <CheckInButton
          todayPublished={streak.todayPublished}
          onChange={setStreak}
        />
        <Button asChild size="lg" className="flex-1 py-4">
          <Link href="/compose">새 글 쓰기</Link>
        </Button>
      </section>
    </div>
  );
}
