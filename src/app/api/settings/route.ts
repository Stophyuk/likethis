import { NextResponse } from "next/server";
import { getSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/db";
import type { Settings } from "@/lib/types";

export async function GET() {
  try {
    const s = await getSettings();
    return NextResponse.json(s);
  } catch {
    // Supabase not configured yet — return defaults so the UI still works.
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<Settings> | null;
  if (!body) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const s: Settings = { ...DEFAULT_SETTINGS, ...body };
  await saveSettings(s);
  return NextResponse.json({ ok: true });
}
