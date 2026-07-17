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

export interface GradeError {
  readonly error: string;
}
