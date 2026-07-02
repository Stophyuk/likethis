import { Flame } from "lucide-react";
import type { StreakInfo } from "@/lib/types";

export function StreakCard({ streak }: { streak: StreakInfo }) {
  const msg =
    streak.current === 0
      ? "오늘 첫 불씨를 지펴보세요."
      : streak.todayPublished
        ? "불씨를 이어가고 있어요."
        : "오늘 올리면 계속 이어져요.";

  return (
    <section className="ember-glow rounded-2xl border border-border/60 bg-card p-6 md:p-8">
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-xl bg-primary/15 text-primary">
          <Flame className="size-7" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl leading-none text-primary">
              {streak.current}
            </span>
            <span className="text-lg text-muted-foreground">일 연속</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    </section>
  );
}
