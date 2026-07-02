import { z } from "zod";

// The model returns body text only; charCount is computed server-side.
export const variationSchema = z.object({
  platform: z.enum(["x", "threads", "linkedin", "bluesky"]),
  body: z.string(),
  firstComment: z.string().optional(),
  tips: z.array(z.string()),
});

export const transformSchema = z.object({
  variations: z.array(variationSchema),
});

export const topicSchema = z.object({
  title: z.string(),
  angle: z.string(),
  why: z.string(),
  keyPoints: z.array(z.string()),
});

export const suggestionSchema = z.object({
  topics: z.array(topicSchema),
});

export type TransformSchema = z.infer<typeof transformSchema>;
export type SuggestionSchema = z.infer<typeof suggestionSchema>;
