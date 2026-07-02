import { NextResponse } from "next/server";
import {
  getSettings,
  getStreak,
  getSuggestion,
  saveSuggestion,
  isNotified,
  markNotified,
} from "@/lib/db";
import { generateSuggestion } from "@/lib/suggest";
import { sendSlack } from "@/lib/slack";
import { getTodayKey } from "@/lib/date";
import type { StreakInfo, DailySuggestion } from "@/lib/types";

function buildNudge(streak: StreakInfo, suggestion: DailySuggestion): string {
  const topic = suggestion.topics[0];
  const head = streak.todayPublished
    ? `오늘도 올리셨네요! ${streak.current}일 연속 🔥`
    : streak.current > 0
      ? `🔥 ${streak.current}일 연속 중! 오늘도 이어가요.`
      : "오늘 첫 불씨를 지펴볼까요?";

  const app = process.env.APP_URL ?? "likethis";
  return topic
    ? `${head}\n\n📝 오늘의 소재: *${topic.title}*\n${topic.angle}\n\n${topic.why}\n\n→ ${app} 에서 바로 쓰기`
    : `${head}\n\n→ ${app} 에서 오늘의 글을 써보세요.`;
}

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = getTodayKey();

  // 1. Ensure today's suggestion exists (idempotent).
  let suggestion = await getSuggestion(today);
  if (!suggestion) {
    suggestion = await generateSuggestion();
    await saveSuggestion(suggestion);
  }

  // 2. Streak-aware nudge, pushed once per day.
  const [streak, settings, notified] = await Promise.all([
    getStreak(),
    getSettings(),
    isNotified(today),
  ]);

  let pushed = false;
  if (settings.slackWebhookUrl && !notified) {
    pushed = await sendSlack(settings.slackWebhookUrl, buildNudge(streak, suggestion));
    if (pushed) await markNotified(today);
  }

  return NextResponse.json({ ok: true, pushed, streak, suggestion });
}
