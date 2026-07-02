import { getStreak, getSuggestion } from "@/lib/db";
import { getTodayKey } from "@/lib/date";
import { TodayClient } from "@/components/today/TodayClient";
import type { StreakInfo, DailySuggestion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  let streak: StreakInfo = {
    current: 0,
    todayPublished: false,
    publishedDates: [],
  };
  let suggestion: DailySuggestion | null = null;

  try {
    streak = await getStreak();
    suggestion = await getSuggestion(getTodayKey());
  } catch {
    // Supabase not configured yet — render the empty state.
  }

  return <TodayClient initialStreak={streak} suggestion={suggestion} />;
}
