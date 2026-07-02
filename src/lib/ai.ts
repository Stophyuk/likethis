import "server-only";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";

// Direct Anthropic API using the user's own Claude key (ANTHROPIC_API_KEY).
// Default is Opus 4.8 for writing quality; override via AI_MODEL
// (e.g. "claude-sonnet-5" for cheaper runs).
export const AI_MODEL = process.env.AI_MODEL ?? "claude-opus-4-8";

// Thin wrapper: inject the model + return the validated object.
export async function generate<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<T> {
  const { object } = await generateObject({
    model: anthropic(AI_MODEL),
    schema: opts.schema,
    system: opts.system,
    prompt: opts.prompt,
  });
  return object as T;
}
