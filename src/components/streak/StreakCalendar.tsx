import { getDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

// Last 5 weeks (35 days) heat strip, oldest first.
export function StreakCalendar({
  publishedDates,
}: {
  publishedDates: string[];
}) {
  const set = new Set(publishedDates);
  const days = Array.from({ length: 35 }, (_, i) => getDateKey(34 - i));

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-3 text-sm text-muted-foreground">최근 5주</div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div
            key={d}
            title={d}
            className={cn(
              "aspect-square rounded-[4px] transition-colors",
              set.has(d) ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
