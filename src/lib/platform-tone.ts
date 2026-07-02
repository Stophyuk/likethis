import type { Platform } from "./types";

// Per-platform tone / length / format rules, derived from 2026 platform research.
// These strings are injected into the transform prompt, so keep them concrete.

export interface PlatformTone {
  id: Platform;
  label: string;
  maxChars: number;
  sweetSpot?: number; // ideal length (e.g. LinkedIn)
  rules: string[];
  hasFirstComment?: boolean; // X moves links to the first comment
}

export const PLATFORM_TONE: Record<Platform, PlatformTone> = {
  x: {
    id: "x",
    label: "X",
    maxChars: 280,
    rules: [
      "280자 이내(영문 기준). 한글은 더 짧게 체감되니 최대한 간결하게.",
      "첫 문장이 훅이다. 스크롤을 멈추게 만들 것.",
      "해시태그는 0~2개만. 남발 금지.",
      "링크는 본문에 넣지 말고 firstComment로 분리한다 (X는 링크 포함 글의 도달·비용 페널티가 큼).",
    ],
    hasFirstComment: true,
  },
  threads: {
    id: "threads",
    label: "Threads",
    maxChars: 500,
    rules: [
      "500자 이내.",
      "친근하고 대화하듯. 질문으로 끝맺어 반응을 유도해도 좋다.",
      "이모지는 자연스러운 수준으로만.",
    ],
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    maxChars: 3000,
    sweetSpot: 1300,
    rules: [
      "첫 1~2줄이 훅 ('더 보기' 전에 보이는 부분). 강하게 시작할 것.",
      "짧은 문단 + 잦은 줄바꿈으로 모바일 가독성 확보.",
      "전문적이되 잘난 척이 아닌 진솔한 인사이트 — 배운 것/실패/과정을 공유.",
      "1,300자 근처가 sweet spot. 지나치게 길게 늘이지 말 것.",
      "해시태그 3개 내외를 맨 끝에.",
    ],
  },
  bluesky: {
    id: "bluesky",
    label: "Bluesky",
    maxChars: 300,
    rules: [
      "300자 이내.",
      "캐주얼하고 개발자 친화적. 솔직담백한 톤이 잘 먹힌다.",
      "해시태그 문화가 약하니 최소화.",
    ],
  },
};
