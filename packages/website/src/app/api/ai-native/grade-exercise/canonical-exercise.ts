import { z } from "zod";

import { getAllLessons } from "@/lib/ai-native/data";

import type { GradeableKind } from "./types";

const identifierSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.:-]+$/);

const fixPromptCriterionSchema = z
  .object({
    id: identifierSchema,
    label: z.string().min(1).max(500),
    pattern: z.string().min(1).max(500),
    regex: z.boolean().optional(),
  })
  .strict();

const rctfcCriterionSchema = z
  .object({
    minChars: z.number().int().min(0).max(6000),
    mustInclude: z.string().min(1).max(200).optional(),
    hint: z.string().min(1).max(1000),
  })
  .strict();

const rctfcRubricSchema = z
  .object({
    role: rctfcCriterionSchema,
    context: rctfcCriterionSchema,
    task: rctfcCriterionSchema,
    format: rctfcCriterionSchema,
    constraints: rctfcCriterionSchema,
  })
  .strict();

const freeResponseCriterionSchema = z
  .object({
    id: identifierSchema,
    label: z.string().min(1).max(500),
    description: z.string().min(1).max(1000),
  })
  .strict();

const basePropsSchema = z
  .object({
    lessonId: z.string().min(1).max(200),
    exerciseId: z.string().min(1).max(200),
    scenario: z.string().min(1).max(4000),
  })
  .passthrough();

export interface CanonicalExercise {
  readonly kind: GradeableKind;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly scenario: string;
  readonly rubric: unknown;
  readonly rubricIds: readonly string[];
}

function uniqueIds(ids: readonly string[]): boolean {
  return new Set(ids).size === ids.length;
}

function parseCanonicalProps(
  kind: GradeableKind,
  lessonId: string,
  exerciseId: string,
  props: Readonly<Record<string, unknown>>,
): CanonicalExercise | null {
  const base = basePropsSchema.safeParse(props);
  if (
    !base.success ||
    base.data.lessonId !== lessonId ||
    base.data.exerciseId !== exerciseId
  ) {
    return null;
  }

  let rubric: unknown;
  let rubricIds: readonly string[];
  if (kind === "exercise-fix-prompt") {
    const parsed = z
      .array(fixPromptCriterionSchema)
      .min(1)
      .max(20)
      .safeParse(props.criteria);
    if (!parsed.success) return null;
    rubric = parsed.data;
    rubricIds = parsed.data.map((criterion) => criterion.id);
  } else if (kind === "exercise-rctfc-checklist") {
    const parsed = rctfcRubricSchema.safeParse(props.criteria);
    if (!parsed.success) return null;
    rubric = parsed.data;
    rubricIds = ["role", "context", "task", "format", "constraints"];
  } else {
    const parsed = z
      .array(freeResponseCriterionSchema)
      .min(1)
      .max(20)
      .safeParse(props.rubric);
    if (!parsed.success) return null;
    rubric = parsed.data;
    rubricIds = parsed.data.map((criterion) => criterion.id);
  }

  if (!uniqueIds(rubricIds) || JSON.stringify(rubric).length > 16_000) {
    return null;
  }

  return {
    kind,
    lessonId,
    exerciseId,
    scenario: base.data.scenario,
    rubric,
    rubricIds,
  };
}

/**
 * Resolve grading instructions exclusively from reviewed course content.
 * Callers provide identity plus their answer; scenario and rubric never cross
 * the client trust boundary.
 */
export async function resolveCanonicalExercise(
  kind: GradeableKind,
  lessonId: string,
  exerciseId: string,
): Promise<CanonicalExercise | null> {
  const lessons = await getAllLessons();
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) return null;

  const widget = lesson.widgets?.find(
    (candidate) =>
      candidate.kind === kind &&
      candidate.props?.exerciseId === exerciseId &&
      candidate.props?.lessonId === lessonId,
  );
  if (!widget?.props) return null;

  return parseCanonicalProps(kind, lessonId, exerciseId, widget.props);
}
