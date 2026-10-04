// ─── Lesson engine: guards, projection and validation ─────────────
//
// Pure helpers shared by loaders (data.ts), readers and content tests.

import type {
  BaseLesson,
  LessonQuizQuestion,
  LessonSection,
} from "@/lib/course/types";
import { isWidgetKind } from "@/lib/widgets/types";
import { validateExerciseProps } from "./validate-exercise";
import {
  engineConceptSectionId,
  engineExerciseStepId,
  LESSON_ENGINE_LIMITS,
  type EngineLessonFields,
  type LessonCheck,
} from "./types";

export type EngineLesson<T extends BaseLesson = BaseLesson> = T &
  EngineLessonFields;

/** True when the lesson carries the complete engine field set. */
export function isEngineLesson<T extends BaseLesson>(
  lesson: T,
): lesson is EngineLesson<T> {
  return Boolean(
    lesson.concept && lesson.exercise && lesson.checks && lesson.checks.length,
  );
}

/** Words in a markdown string (markup characters are not words). */
export function countWords(markdown: string): number {
  return markdown
    .replace(/[`*_#>|[\]()-]+/g, " ")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function checkToQuizQuestion(check: LessonCheck): LessonQuizQuestion {
  return {
    id: check.id,
    questionText: check.prompt,
    answerOptions: check.options.map((option) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.correct,
    })),
    explanation: check.explanation,
  };
}

/**
 * Project an engine lesson onto the legacy `sections`/`quiz` shape so every
 * existing consumer (MCP lesson resources, search index, llms exports) keeps
 * reading text. Readers never render these projections for engine lessons.
 * Authored `sections`/`quiz` (if any) are replaced: the engine fields are the
 * single source.
 */
export function projectEngineLesson<T extends BaseLesson>(lesson: T): T {
  if (!isEngineLesson(lesson)) return lesson;
  const readTimeMinutes = Math.max(
    1,
    Math.round(countWords(lesson.concept.body) / 180),
  );
  const conceptContent = lesson.concept.takeaway
    ? `${lesson.concept.body}\n\n**${lesson.concept.takeaway}**`
    : lesson.concept.body;
  const sections: LessonSection[] = [
    {
      id: engineConceptSectionId(lesson.id),
      title: lesson.title,
      readTimeMinutes,
      content: conceptContent,
      ...(lesson.concept.takeaway
        ? { keyTakeaway: lesson.concept.takeaway }
        : {}),
      ...(lesson.concept.sources?.length
        ? {
            sources: lesson.concept.sources.map((source) => ({
              sourceTitle: source.label,
              ...(source.url ? { sourceUrl: source.url } : {}),
            })),
          }
        : {}),
    },
  ];
  return {
    ...lesson,
    sections,
    quiz: lesson.checks.map(checkToQuizQuestion),
    widgets: [],
  };
}

/** Progress steps an engine lesson tracks in `sectionsRead`. */
export function engineLessonProgressStepIds(lessonId: string): readonly string[] {
  return [engineExerciseStepId(lessonId)];
}

/**
 * Validate one authored engine lesson. Returns human-readable problems; an
 * empty array means the lesson satisfies the authoring contract.
 */
export function validateEngineLesson(lesson: BaseLesson): string[] {
  const problems: string[] = [];
  const where = `lesson ${lesson.id}`;
  if (!isEngineLesson(lesson)) {
    return [`${where}: missing concept, exercise or checks`];
  }
  const words = countWords(lesson.concept.body);
  if (words > LESSON_ENGINE_LIMITS.conceptMaxWords) {
    problems.push(
      `${where}: concept has ${words} words (max ${LESSON_ENGINE_LIMITS.conceptMaxWords})`,
    );
  }
  if (!lesson.concept.body.trim()) problems.push(`${where}: empty concept`);
  if (!isWidgetKind(lesson.exercise.kind)) {
    problems.push(`${where}: unknown exercise kind "${lesson.exercise.kind}"`);
  }
  if (!lesson.exercise.title.trim() || !lesson.exercise.instructions.trim()) {
    problems.push(`${where}: exercise needs a title and instructions`);
  }
  if (
    typeof lesson.exercise.props !== "object" ||
    lesson.exercise.props === null
  ) {
    problems.push(`${where}: exercise props must be an object`);
  } else if ("lessonId" in lesson.exercise.props || "cpId" in lesson.exercise.props) {
    problems.push(
      `${where}: exercise props must not set lessonId/cpId (the reader injects them)`,
    );
  } else {
    problems.push(
      ...validateExerciseProps(lesson.exercise.kind, lesson.exercise.props).map(
        (problem) => `${where}: ${problem}`,
      ),
    );
  }
  if (lesson.checks.length !== LESSON_ENGINE_LIMITS.checkCount) {
    problems.push(
      `${where}: needs exactly ${LESSON_ENGINE_LIMITS.checkCount} checks, has ${lesson.checks.length}`,
    );
  }
  const checkIds = new Set<string>();
  for (const check of lesson.checks) {
    if (checkIds.has(check.id)) problems.push(`${where}: duplicate check ${check.id}`);
    checkIds.add(check.id);
    const correct = check.options.filter((option) => option.correct).length;
    if (correct !== 1) {
      problems.push(`${where}: check ${check.id} needs exactly one correct option`);
    }
    if (
      check.options.length < LESSON_ENGINE_LIMITS.minOptions ||
      check.options.length > LESSON_ENGINE_LIMITS.maxOptions
    ) {
      problems.push(`${where}: check ${check.id} needs 2-4 options`);
    }
    if (new Set(check.options.map((option) => option.id)).size !== check.options.length) {
      problems.push(`${where}: check ${check.id} has duplicate option ids`);
    }
    if (!check.explanation.trim()) {
      problems.push(`${where}: check ${check.id} needs an explanation`);
    }
  }
  return problems;
}
