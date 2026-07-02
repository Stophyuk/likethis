import type { Settings, Platform } from "./types";
import { PLATFORM_TONE } from "./platform-tone";

// System prompt: who the writer is + the user's voice + anti-AI rules.
export function buildSystem(settings: Settings): string {
  const parts: string[] = [
    "당신은 사용자를 대신해 build-in-public(개발 과정 공유) 소셜 글을 쓰는 고스트라이터입니다.",
    "사용자의 원본 메모/소재를 받아 각 플랫폼에 맞게 다시 씁니다. 내용을 지어내지 말고 주어진 소재에 충실하세요.",
  ];

  if (settings.toneDescription.trim()) {
    parts.push(`\n[원하는 톤]\n${settings.toneDescription.trim()}`);
  }

  const samples = settings.voiceSamples.filter((s) => s.trim());
  if (samples.length > 0) {
    const joined = samples
      .map((s, i) => `[샘플 ${i + 1}]\n${s.trim()}`)
      .join("\n\n");
    parts.push(
      `\n[사용자의 과거 글 — 이 문체를 흉내내세요]\n어휘 선택, 문장 길이와 리듬, 이모지 빈도, 격식 수준을 아래 글과 최대한 비슷하게 맞추세요.\n\n${joined}`,
    );
  }

  parts.push(
    `\n[반드시 지킬 규칙 — AI 티 내지 않기]
- "결론적으로", "~에 대해 알아보겠습니다", "여러분", 억지 "함께" 같은 상투적 AI 표현 금지.
- 과한 이모지·불릿·감탄사 금지. 사용자 샘플의 톤을 우선.
- 억지 훅이나 clickbait 금지. 담백하고 진솔하게.
- 없는 사실·수치를 지어내지 말 것.
- 기본은 한국어. 단, 원본이 영어면 영어로 쓴다.`,
  );

  return parts.join("\n");
}

// User prompt: the source + which platforms + their concrete rules.
export function buildPrompt(source: string, platforms: Platform[]): string {
  const specs = platforms
    .map((p) => {
      const t = PLATFORM_TONE[p];
      return `### ${t.label} (${p})\n- 최대 ${t.maxChars}자${
        t.sweetSpot ? `, 이상적 ~${t.sweetSpot}자` : ""
      }\n${t.rules.map((r) => `- ${r}`).join("\n")}`;
    })
    .join("\n\n");

  return `아래 소재를 다음 ${platforms.length}개 플랫폼 각각에 맞게 다시 써주세요.

[원본 소재]
${source}

[플랫폼별 규칙]
${specs}

각 플랫폼마다 body(본문)를 작성하세요. X에 링크가 필요하면 body에서 빼고 firstComment에 넣으세요. tips에는 이 플랫폼에서 더 잘 먹히기 위한 짧은 조언 1~2개를 담으세요. 지정된 플랫폼(${platforms.join(", ")})만 각각 하나씩 생성하세요.`;
}
