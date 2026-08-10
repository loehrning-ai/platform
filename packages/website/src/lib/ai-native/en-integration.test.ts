import { describe, expect, it } from "vitest";
import {
  __resetLessonCacheForTests,
  getAllLessons,
  getCourseMeta,
  getModules,
} from "./data";
import { getAllChallenges } from "./challenges";
import { getGlossary } from "./glossary";
import { getCourseConfig } from "@/lib/course/config";
import { getWorkshopQuestions } from "@/lib/course/data";
import { loadWorkshopQuestions } from "@/lib/course/questions";
import {
  getAuditedCourseContentLocales,
  hasAuditedCourseContentLocale,
  resolveFoundationCourseContentLocale,
} from "@/lib/course/localization";
import { hasEnglishContentParity } from "@/lib/i18n/content-parity";

const COURSE_SLUG = "ai-native" as const;

function widgetIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(widgetIdentity);
  if (value === null || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const identityKeys = [
    "id",
    "exerciseId",
    "lessonId",
    "moduleId",
    "cpId",
    "kind",
    "placement",
    "courseSlug",
    "correct",
    "isCorrect",
    "rating",
    "sensitive",
    "piiIndices",
    "minChars",
    "passThreshold",
    "budgetTokens",
    "tokens",
    "mustHave",
    "category",
    "requiredKinds",
  ] as const;
  const result: Record<string, unknown> = {};

  for (const key of identityKeys) {
    if (key in source) result[key] = source[key];
  }
  for (const [key, child] of Object.entries(source)) {
    if ((identityKeys as readonly string[]).includes(key)) continue;
    const nested = widgetIdentity(child);
    if (
      nested !== undefined &&
      (Array.isArray(nested)
        ? nested.length > 0
        : typeof nested === "object" && Object.keys(nested as object).length > 0)
    ) {
      result[key] = nested;
    }
  }
  return result;
}

describe("AI-Native audited English runtime bundle", () => {
  it("registers the complete course, glossary, challenge, and quiz bundle behind one gate", async () => {
    __resetLessonCacheForTests();
    expect(getAuditedCourseContentLocales(COURSE_SLUG)).toEqual(["de", "en"]);
    expect(hasAuditedCourseContentLocale(COURSE_SLUG, "en")).toBe(true);
    expect(resolveFoundationCourseContentLocale(COURSE_SLUG, "en")).toBe("en");

    const config = getCourseConfig(COURSE_SLUG, "en");
    const modules = getModules("en");
    const lessons = await getAllLessons("en");
    const glossary = getGlossary("en");
    const challenges = getAllChallenges("en");
    const syncQuestions = getWorkshopQuestions(COURSE_SLUG, "en");
    const asyncQuestions = await loadWorkshopQuestions(COURSE_SLUG, "en");

    expect(config).toMatchObject({
      slug: COURSE_SLUG,
      language: "en",
      title: "AI-Native Workflow Course",
    });
    expect(modules).toHaveLength(4);
    expect(lessons).toHaveLength(getCourseMeta("en").totalLessons);
    expect(glossary.entries.length).toBeGreaterThan(40);
    expect(challenges).toHaveLength(12);
    expect(syncQuestions.length).toBeGreaterThanOrEqual(
      config.workshopQuizQuestionCount,
    );
    expect(asyncQuestions).toEqual(syncQuestions);
  });

  it("preserves route, progress, lesson, widget, quiz, and verification identity", async () => {
    __resetLessonCacheForTests();
    const deConfig = getCourseConfig(COURSE_SLUG, "de");
    const enConfig = getCourseConfig(COURSE_SLUG, "en");
    const deLessons = await getAllLessons("de");
    const enLessons = await getAllLessons("en");
    const deQuestions = getWorkshopQuestions(COURSE_SLUG, "de");
    const enQuestions = getWorkshopQuestions(COURSE_SLUG, "en");

    expect({
      slug: enConfig.slug,
      basePath: enConfig.basePath,
      coursePath: enConfig.coursePath,
      blockIds: enConfig.blockIds,
      questionCount: enConfig.workshopQuizQuestionCount,
      timeLimit: enConfig.workshopQuizTimeLimitMinutes,
      threshold: enConfig.workshopQuizPassThreshold,
    }).toEqual({
      slug: deConfig.slug,
      basePath: deConfig.basePath,
      coursePath: deConfig.coursePath,
      blockIds: deConfig.blockIds,
      questionCount: deConfig.workshopQuizQuestionCount,
      timeLimit: deConfig.workshopQuizTimeLimitMinutes,
      threshold: deConfig.workshopQuizPassThreshold,
    });

    expect(getModules("en").map(({ id }) => id)).toEqual(
      getModules("de").map(({ id }) => id),
    );
    expect(enLessons.map(({ id, moduleId }) => ({ id, moduleId }))).toEqual(
      deLessons.map(({ id, moduleId }) => ({ id, moduleId })),
    );
    expect(enLessons.map((lesson) => lesson.sections.map(({ id }) => id))).toEqual(
      deLessons.map((lesson) => lesson.sections.map(({ id }) => id)),
    );
    expect(
      enLessons.map((lesson) =>
        lesson.quiz.map((question) => ({
          id: question.id,
          options: question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
        })),
      ),
    ).toEqual(
      deLessons.map((lesson) =>
        lesson.quiz.map((question) => ({
          id: question.id,
          options: question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
        })),
      ),
    );
    expect(enLessons.map((lesson) => widgetIdentity(lesson.widgets ?? []))).toEqual(
      deLessons.map((lesson) => widgetIdentity(lesson.widgets ?? [])),
    );
    expect(enQuestions.map(({ id }) => id)).toEqual(deQuestions.map(({ id }) => id));
    expect(
      enQuestions.map((question) =>
        question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
      ),
    ).toEqual(
      deQuestions.map((question) =>
        question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
      ),
    );
    expect(getGlossary("en").entries.map(({ term }) => term)).toEqual(
      getGlossary("de").entries.map(({ term }) => term),
    );
    expect(getAllChallenges("en").map(({ weekOffset }) => weekOffset)).toEqual(
      getAllChallenges("de").map(({ weekOffset }) => weekOffset),
    );
  });

  it("declares parity only for reviewed public surfaces", () => {
    for (const pathname of [
      "/ai-native",
      "/ai-native/capstone-gallery",
      "/ai-native/demos",
      "/ai-native/fluency-test",
      "/ai-native/glossar",
      "/ai-native/verifizierung",
    ]) {
      expect(hasEnglishContentParity(pathname), pathname).toBe(true);
    }
    expect(hasEnglishContentParity("/ai-native/kurs")).toBe(false);
    expect(hasEnglishContentParity("/ai-native/kurs/modul_1")).toBe(false);
  });
});
