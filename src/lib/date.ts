// KST (UTC+9) date helpers. The server runs in UTC, so we offset explicitly
// to keep streak / suggestion / cron day-keys aligned to the user's timezone.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date key in KST, formatted YYYY-MM-DD.
export function getTodayKey(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// Date key N days before today (KST), formatted YYYY-MM-DD.
export function getDateKey(daysAgo: number, now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS - daysAgo * DAY_MS)
    .toISOString()
    .slice(0, 10);
}
