import { NextResponse } from "next/server";
import { pushHistory, markPublished, getStreak } from "@/lib/db";
import type { HistoryItem, PlatformVariation } from "@/lib/types";

// "발행 완료" — archive the piece and mark today as published.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    source?: string;
    variations?: PlatformVariation[];
  };
  if (!body.source?.trim() || !Array.isArray(body.variations)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  try {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      source: body.source,
      variations: body.variations,
      createdAt: new Date().toISOString(),
    };
    await pushHistory(item);
    await markPublished(body.source.slice(0, 80));
    return NextResponse.json(await getStreak());
  } catch {
    return NextResponse.json(
      { error: "저장 실패 — Supabase 설정을 확인해주세요." },
      { status: 500 },
    );
  }
}
