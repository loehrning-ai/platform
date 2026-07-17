import { z } from "zod";

import { PRACTICE_MODES } from "./types";

/** Max chars of prompt shipped to Claude — cost / prompt-injection bound. */
export const MAX_PROMPT_CHARS = 4000;

/** Max chars for a single semantic-space word. */
export const MAX_WORD_CHARS = 60;

/** Max number of existing points the client may send for context. */
export const MAX_EXISTING_POINTS = 40;

const existingPointSchema = z
  .object({
    w: z.string().min(1).max(MAX_WORD_CHARS),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

/**
 * "complete" requests carry a single assembled prompt string.
 */
const completeRequestSchema = z
  .object({
    mode: z.literal("complete"),
    prompt: z.string().min(1).max(MAX_PROMPT_CHARS),
  })
  .strict();

/**
 * "place-word" requests carry the new word plus the existing point cloud.
 */
const placeRequestSchema = z
  .object({
    mode: z.literal("place-word"),
    word: z.string().min(1).max(MAX_WORD_CHARS),
    existing: z.array(existingPointSchema).max(MAX_EXISTING_POINTS),
  })
  .strict();

export const practiceRequestSchema = z.discriminatedUnion("mode", [
  completeRequestSchema,
  placeRequestSchema,
]);

export type PracticeRequestParsed = z.infer<typeof practiceRequestSchema>;

/** Guard used by the route + tests to ensure mode is one we support. */
export function isPracticeMode(value: unknown): value is (typeof PRACTICE_MODES)[number] {
  return (
    typeof value === "string" &&
    (PRACTICE_MODES as readonly string[]).includes(value)
  );
}
