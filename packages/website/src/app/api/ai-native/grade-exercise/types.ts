import type { ExerciseKind } from "@/lib/ai-native/types";

export const GRADEABLE_KINDS = [
  "exercise-fix-prompt",
  "exercise-rctfc-checklist",
  "exercise-free-response",
] as const satisfies readonly ExerciseKind[];

export type GradeableKind = (typeof GRADEABLE_KINDS)[number];

export interface GradeRequest {
  readonly kind: GradeableKind;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly userInput: unknown;
}

export interface GradeRubricEntry {
  readonly id: string;
  readonly passed: boolean;
  readonly rationale: string;
}

export interface GradeResponse {
  readonly score: number;
  readonly rubric: readonly GradeRubricEntry[];
  readonly summary: string;
  readonly cached?: boolean;
}

export const GRADE_ERROR_CODES = [
  "unsupported_media_type",
  "request_read_failed",
  "request_too_large",
  "invalid_json",
  "validation_failed",
  "rate_limit_unavailable",
  "unknown_exercise",
  "canonical_load_failed",
  "request_hash_failed",
  "rate_limited",
  "provider_not_configured",
  "budget_not_configured",
  "budget_unavailable",
  "budget_exhausted",
  "provider_failed",
] as const;

export type GradeErrorCode = (typeof GRADE_ERROR_CODES)[number];

export interface GradeError {
  readonly code: GradeErrorCode;
  readonly error: string;
}
