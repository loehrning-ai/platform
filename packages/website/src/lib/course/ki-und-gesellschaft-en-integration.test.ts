import { describe, expect, it } from "vitest";
import {
  getAllLessons,
  getBlocks,
  getGlossaryTerms,
  getWorkshopQuestions,
} from "./data";
import { getCourseConfig } from "./config";
import { loadWorkshopQuestions } from "./questions";
import {
  getAuditedCourseContentLocales,
  hasAuditedCourseContentLocale,
  resolveFoundationCourseContentLocale,
} from "./localization";

const COURSE_SLUG = "ki-und-gesellschaft" as const;

describe("KI und Gesellschaft audited English runtime bundle", () => {
  it("registers config, lessons, and quiz together", async () => {
    expect(getAuditedCourseContentLocales(COURSE_SLUG)).toEqual(["de", "en"]);
    expect(hasAuditedCourseContentLocale(COURSE_SLUG, "en")).toBe(true);
    expect(resolveFoundationCourseContentLocale(COURSE_SLUG, "en")).toBe("en");

    const config = getCourseConfig(COURSE_SLUG, "en");
    const blocks = getBlocks(COURSE_SLUG, "en");
    const lessons = getAllLessons(COURSE_SLUG, "en");
    const syncQuestions = getWorkshopQuestions(COURSE_SLUG, "en");
    const asyncQuestions = await loadWorkshopQuestions(COURSE_SLUG, "en");

    expect(config).toMatchObject({
      language: "en",
      title: "AI and Society",
      workshopQuizQuestionCount: 15,
    });
    expect(blocks).toHaveLength(3);
    expect(lessons).toHaveLength(9);
    expect(syncQuestions).toHaveLength(15);
    expect(asyncQuestions).toEqual(syncQuestions);
    expect(getGlossaryTerms(COURSE_SLUG, undefined, "en")).toEqual([]);
    expect(blocks[0]?.title).toBe("AI and work");
    expect(lessons[0]?.title).toBe("AI and work: exposure is not a forecast");
  });

  it("preserves route, progress, lesson, question, answer, and assessment identity", () => {
    const deConfig = getCourseConfig(COURSE_SLUG, "de");
    const enConfig = getCourseConfig(COURSE_SLUG, "en");
    const deBlocks = getBlocks(COURSE_SLUG, "de");
    const enBlocks = getBlocks(COURSE_SLUG, "en");
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
    expect(enBlocks.map(({ id }) => id)).toEqual(deBlocks.map(({ id }) => id));
    expect(
      enBlocks.flatMap((block) => block.lessons.map(({ id }) => id)),
    ).toEqual(deBlocks.flatMap((block) => block.lessons.map(({ id }) => id)));
    expect(enQuestions.map(({ id }) => id)).toEqual(
      deQuestions.map(({ id }) => id),
    );
    expect(
      enQuestions.map((question) =>
        question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
      ),
    ).toEqual(
      deQuestions.map((question) =>
        question.answerOptions.map(({ id, isCorrect }) => ({ id, isCorrect })),
      ),
    );
  });
});
