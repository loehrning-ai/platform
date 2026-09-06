// ─── What a local progress import actually moved forward ──
//
// merge.ts decides the state to persist; this module describes it. The count
// is what /konto tells the learner after a confirmed import ("n Kurse, m
// Lektionen"), so it has to answer "what did this import add?" rather than
// "what does the account hold?": a snapshot that is already contained in the
// account moved nothing forward and must count zero.
//
// Comparison is semantic, never structural. A merge sorts read sections and
// rebuilds records, so two structurally different objects can hold exactly the
// same learner progress; only an actual gain counts.

import { COURSE_SLUGS } from "@/lib/course/types";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "./types";

export interface ImportSummary {
  /** Courses the import moved forward. */
  readonly courses: number;
  /** Lessons the import moved forward, summed across those courses. */
  readonly lessons: number;
}

/** Normalized quiz result, or -1 when the lesson holds no scored attempt. */
function quizRatio(lesson: UnifiedLessonProgress): number {
  if (
    lesson.quizScore === null ||
    lesson.quizTotal === null ||
    lesson.quizTotal <= 0
  ) {
    return -1;
  }
  return lesson.quizScore;
}

function lessonAdvanced(
  before: UnifiedLessonProgress | undefined,
  after: UnifiedLessonProgress,
): boolean {
  if (!before) return true;
  if (after.completed && !before.completed) return true;
  if (quizRatio(after) > quizRatio(before)) return true;
  const knownSections = new Set(before.sectionsRead);
  if (after.sectionsRead.some((sectionId) => !knownSections.has(sectionId))) {
    return true;
  }
  return Object.entries(after.exercisesCompleted).some(([id, result]) => {
    const previous = before.exercisesCompleted[id];
    if (!previous) return true;
    return (
      (result.completed && !previous.completed) ||
      (result.score ?? -1) > (previous.score ?? -1) ||
      result.attempts > previous.attempts
    );
  });
}

/** Course-level gains that no single lesson accounts for. */
function courseAdvanced(
  before: UnifiedCourseSlice | undefined,
  after: UnifiedCourseSlice,
): boolean {
  if (!before) return true;
  return (
    (after.workshopQuiz.passed && !before.workshopQuiz.passed) ||
    after.workshopQuiz.score > before.workshopQuiz.score ||
    (after.capstoneSubmitted && !before.capstoneSubmitted)
  );
}

/** Count what `after` holds that `before` did not. Pure. */
export function summarizeImport(
  before: UnifiedProgress,
  after: UnifiedProgress,
): ImportSummary {
  let courses = 0;
  let lessons = 0;
  for (const slug of COURSE_SLUGS) {
    const afterSlice = after.courses[slug];
    if (!afterSlice) continue;
    const beforeSlice = before.courses[slug];
    let advancedLessons = 0;
    for (const [lessonId, lesson] of Object.entries(afterSlice.lessons)) {
      if (lessonAdvanced(beforeSlice?.lessons[lessonId], lesson)) {
        advancedLessons += 1;
      }
    }
    lessons += advancedLessons;
    if (advancedLessons > 0 || courseAdvanced(beforeSlice, afterSlice)) {
      courses += 1;
    }
  }
  return { courses, lessons };
}
