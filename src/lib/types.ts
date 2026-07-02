// Core domain types for the one-source-multi-use writing engine.

export type Platform = "x" | "threads" | "linkedin" | "bluesky";

export const ALL_PLATFORMS: Platform[] = ["x", "threads", "linkedin", "bluesky"];

// User settings (single user, stored in Redis at lt:settings).
export interface Settings {
  interests: string[];
  voiceSamples: string[]; // past posts for voice imitation
  toneDescription: string;
  slackWebhookUrl: string;
  publishHourKST: number; // 0-23, used for nudge copy
  enabledPlatforms: Platform[];
}

// One platform's transformed variation of a source.
export interface PlatformVariation {
  platform: Platform;
  body: string;
  charCount: number; // computed server-side, not by the model
  firstComment?: string; // X: link moved to the first comment
  tips: string[];
}

export interface TransformResult {
  variations: PlatformVariation[];
}

// A single topic idea in the daily suggestion.
export interface TopicSuggestion {
  title: string;
  angle: string; // differentiating angle
  why: string; // why it's worth posting now
  keyPoints: string[];
}

export interface DailySuggestion {
  date: string; // YYYY-MM-DD (KST)
  topics: TopicSuggestion[];
  generatedAt: string; // ISO
}

// One published-day record (Redis hash lt:published, field = date).
export interface PublishRecord {
  at: string; // ISO
  sourcePreview?: string;
}

// A finished piece kept in history (Redis list lt:history).
export interface HistoryItem {
  id: string;
  source: string;
  createdAt: string; // ISO
  variations: PlatformVariation[];
}

// Derived streak info (not stored; computed from lt:published).
export interface StreakInfo {
  current: number; // consecutive days
  todayPublished: boolean;
  publishedDates: string[]; // YYYY-MM-DD[]
}
