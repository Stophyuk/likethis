import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Settings,
  DailySuggestion,
  HistoryItem,
  StreakInfo,
} from "./types";
import { getTodayKey, getDateKey } from "./date";

// Server-only Supabase client (service role key — never expose client-side).
let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const DEFAULT_SETTINGS: Settings = {
  interests: [],
  voiceSamples: [],
  toneDescription: "",
  slackWebhookUrl: "",
  publishHourKST: 17,
  enabledPlatforms: ["x", "threads", "linkedin", "bluesky"],
};

// ---- kv helpers (settings, flags) ----
async function kvGet<T>(key: string): Promise<T | null> {
  const { data, error } = await db()
    .from("kv")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const { error } = await db()
    .from("kv")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---- Settings ----
export async function getSettings(): Promise<Settings> {
  const s = await kvGet<Partial<Settings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  await kvSet("settings", s);
}

// ---- Published / Streak ----
export async function markPublished(preview?: string): Promise<void> {
  const { error } = await db().from("published").upsert({
    date: getTodayKey(),
    at: new Date().toISOString(),
    preview: preview ?? null,
  });
  if (error) throw error;
}

export async function unmarkPublished(): Promise<void> {
  const { error } = await db()
    .from("published")
    .delete()
    .eq("date", getTodayKey());
  if (error) throw error;
}

// Streak is derived, not stored: count back from today (or yesterday if today
// isn't posted yet — the streak is still alive until a full day is missed).
export async function getStreak(): Promise<StreakInfo> {
  const { data, error } = await db().from("published").select("date");
  if (error) throw error;
  const dates = (data ?? []).map((r) => r.date as string);
  const set = new Set(dates);
  const todayPublished = set.has(getTodayKey());

  let current = 0;
  let offset = todayPublished ? 0 : 1;
  while (set.has(getDateKey(offset))) {
    current++;
    offset++;
  }
  return { current, todayPublished, publishedDates: dates };
}

// ---- Suggestion ----
export async function getSuggestion(
  date: string,
): Promise<DailySuggestion | null> {
  const { data, error } = await db()
    .from("suggestions")
    .select("data")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as DailySuggestion) ?? null;
}

export async function saveSuggestion(s: DailySuggestion): Promise<void> {
  const { error } = await db()
    .from("suggestions")
    .upsert({ date: s.date, data: s });
  if (error) throw error;
}

// ---- History (rows kept forever; reads capped at 50) ----
export async function pushHistory(item: HistoryItem): Promise<void> {
  const { error } = await db().from("history").insert({
    id: item.id,
    source: item.source,
    variations: item.variations,
    created_at: item.createdAt,
  });
  if (error) throw error;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const { data, error } = await db()
    .from("history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    source: r.source,
    variations: r.variations,
    createdAt: r.created_at,
  }));
}

// ---- Slack notify flag (dedupe daily push) ----
export async function isNotified(date: string): Promise<boolean> {
  const v = await kvGet<{ date: string }>("notified");
  return v?.date === date;
}

export async function markNotified(date: string): Promise<void> {
  await kvSet("notified", { date });
}
