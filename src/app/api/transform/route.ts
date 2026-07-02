import { NextResponse } from "next/server";
import { generate } from "@/lib/ai";
import { transformSchema } from "@/lib/schemas";
import { buildSystem, buildPrompt } from "@/lib/voice";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/db";
import {
  ALL_PLATFORMS,
  type Platform,
  type PlatformVariation,
} from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    source?: string;
    platforms?: Platform[];
  };

  if (!body.source || !body.source.trim()) {
    return NextResponse.json({ error: "소재를 입력하세요." }, { status: 400 });
  }
  if (body.source.length > 4000) {
    return NextResponse.json(
      { error: "소재가 너무 길어요 (4,000자 이내로 줄여주세요)." },
      { status: 400 },
    );
  }

  const targets: Platform[] =
    Array.isArray(body.platforms) && body.platforms.length
      ? body.platforms.filter((p) => ALL_PLATFORMS.includes(p))
      : ALL_PLATFORMS;

  // Settings may be unavailable (Redis not configured) — fall back to defaults.
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
    // keep defaults
  }

  try {
    const result = await generate({
      schema: transformSchema,
      system: buildSystem(settings),
      prompt: buildPrompt(body.source.trim(), targets),
    });

    // Compute charCount server-side (the model shouldn't count characters).
    const variations: PlatformVariation[] = result.variations
      .filter((v) => targets.includes(v.platform))
      .map((v) => ({
        platform: v.platform,
        body: v.body,
        charCount: [...v.body].length,
        firstComment: v.firstComment,
        tips: v.tips ?? [],
      }));

    return NextResponse.json({ variations });
  } catch (e) {
    console.error("transform error", e);
    return NextResponse.json(
      { error: "변형에 실패했어요. Claude API 키(ANTHROPIC_API_KEY)를 확인해주세요." },
      { status: 500 },
    );
  }
}
