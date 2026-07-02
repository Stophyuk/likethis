import "server-only";
import { generate } from "./ai";
import { suggestionSchema } from "./schemas";
import { getSettings, getHistory } from "./db";
import { getRecentDiary } from "./notion";
import { getTodayKey } from "./date";
import type { DailySuggestion } from "./types";

// Generate today's topic suggestions from interests + recent history + diary.
export async function generateSuggestion(): Promise<DailySuggestion> {
  const settings = await getSettings();
  const history = await getHistory().catch(() => []);
  const diary = await getRecentDiary();
  const recent = history.slice(0, 10).map((h) => h.source.slice(0, 50));

  const system =
    "당신은 1인 개발자의 build-in-public 글쓰기 코치입니다. 오늘 쓸 만한 소재를 제안합니다.";

  const diarySection = diary.length
    ? `\n[최근 일기 발췌 — 여기서 소재를 발굴하세요. 일기 속 경험·감정·배움이 가장 진정성 있는 재료입니다]\n${diary
        .map((d) => `(${d.date}) ${d.title}\n${d.text}`)
        .join("\n---\n")}`
    : "";

  const prompt = `아래 정보를 바탕으로 오늘 build-in-public으로 쓰면 좋을 소재 3개를 제안하세요.

[관심사]
${settings.interests.length ? settings.interests.join(", ") : "1인 개발, AI, 사이드 프로젝트"}
${diarySection}

[최근에 쓴 글 (겹치지 않게)]
${recent.length ? recent.join("\n") : "(없음)"}

각 소재는 title(제목), angle(차별화 앵글), why(지금 쓰면 좋은 이유), keyPoints(핵심 포인트 2~3개)를 포함하세요. 개발 과정·삽질·배움 중심으로, 너무 거창하지 않고 오늘 바로 쓸 수 있는 것으로. 일기가 있다면 일기 속 실제 경험을 우선 활용하세요.`;

  const { topics } = await generate({
    schema: suggestionSchema,
    system,
    prompt,
  });

  return {
    date: getTodayKey(),
    topics,
    generatedAt: new Date().toISOString(),
  };
}
