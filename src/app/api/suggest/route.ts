import { NextResponse } from "next/server";
import { getSuggestion, saveSuggestion } from "@/lib/db";
import { generateSuggestion } from "@/lib/suggest";
import { getTodayKey } from "@/lib/date";

// Fetch today's suggestion (null if none yet).
export async function GET() {
  try {
    return NextResponse.json(await getSuggestion(getTodayKey()));
  } catch {
    return NextResponse.json(null);
  }
}

// Force-generate today's suggestion.
export async function POST() {
  try {
    const suggestion = await generateSuggestion();
    await saveSuggestion(suggestion);
    return NextResponse.json(suggestion);
  } catch (e) {
    console.error("suggest error", e);
    return NextResponse.json(
      { error: "소재 생성 실패 — Claude API 키 또는 Supabase 설정을 확인해주세요." },
      { status: 500 },
    );
  }
}
