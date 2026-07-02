import { NextResponse } from "next/server";
import { markPublished, unmarkPublished, getStreak } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    undo?: boolean;
    preview?: string;
  };
  try {
    if (body.undo) await unmarkPublished();
    else await markPublished(body.preview);
    return NextResponse.json(await getStreak());
  } catch {
    return NextResponse.json(
      { error: "저장 실패 — Supabase 설정을 확인해주세요." },
      { status: 500 },
    );
  }
}
