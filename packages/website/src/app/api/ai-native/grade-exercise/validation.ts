import { z } from "zod";

import { GRADEABLE_KINDS } from "./types";

/** Max chars of user input shipped to Haiku — cost / prompt-injection bound. */
export const MAX_USER_INPUT_CHARS = 6000;

/** Per-field max for RCTFC objects. */
const MAX_FIELD_CHARS = 2000;

const rctfcInputSchema = z
  .object({
    role: z.string().max(MAX_FIELD_CHARS).optional(),
    context: z.string().max(MAX_FIELD_CHARS).optional(),
    task: z.string().max(MAX_FIELD_CHARS).optional(),
    format: z.string().max(MAX_FIELD_CHARS).optional(),
    constraints: z.string().max(MAX_FIELD_CHARS).optional(),
  })
  .strict();

const userInputSchema = z.union([
  z.string().max(MAX_USER_INPUT_CHARS),
  rctfcInputSchema,
]);

export const gradeRequestSchema = z
  .object({
    kind: z.enum(GRADEABLE_KINDS as unknown as [string, ...string[]]),
    lessonId: z.string().min(1).max(200),
    exerciseId: z.string().min(1).max(200),
    userInput: userInputSchema,
  })
  .strict();

export type GradeRequestParsed = z.infer<typeof gradeRequestSchema>;
