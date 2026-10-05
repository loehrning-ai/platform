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

const COURSE_SLUG = "eu-ai-act-kurs" as const;

describe("EU AI Act audited English runtime bundle", () => {
  it("registers the complete config, lesson, glossary, and quiz bundle together", async () => {
    expect(getAuditedCourseContentLocales(COURSE_SLUG)).toEqual(["de", "en"]);
    expect(hasAuditedCourseContentLocale(COURSE_SLUG, "en")).toBe(true);
    expect(resolveFoundationCourseContentLocale(COURSE_SLUG, "en")).toBe(
      "en",
    );

    const config = getCourseConfig(COURSE_SLUG, "en");
    const blocks = getBlocks(COURSE_SLUG, "en");
    const lessons = getAllLessons(COURSE_SLUG, "en");
    const glossary = getGlossaryTerms(COURSE_SLUG, undefined, "en");
    const syncQuestions = getWorkshopQuestions(COURSE_SLUG, "en");
    const asyncQuestions = await loadWorkshopQuestions(COURSE_SLUG, "en");

    expect(config.language).toBe("en");
    expect(config.title).toBe("EU AI Act Course");
    expect(blocks).toHaveLength(5);
    expect(lessons).toHaveLength(10);
    expect(glossary).toHaveLength(18);
    expect(syncQuestions).toHaveLength(20);
    expect(asyncQuestions).toEqual(syncQuestions);
    expect(blocks[0].title).toBe("Does it apply to me?");
    expect(lessons[0].title).toBe("Your role decides your obligations");
  });

  it("preserves route, progress, lesson, question, answer, and certificate identity", () => {
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

    expect(enBlocks.map(({ id }) => id)).toEqual(
      deBlocks.map(({ id }) => id),
    );
    expect(
      enBlocks.flatMap((block) => block.lessons.map(({ id }) => id)),
    ).toEqual(
      deBlocks.flatMap((block) => block.lessons.map(({ id }) => id)),
    );
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

    // Engine lessons carry their exercise in `exercise`; the legacy widget
    // list (and its glossary flashcard deck) stays empty in both locales.
    for (const block of [...deBlocks, ...enBlocks]) {
      for (const lesson of block.lessons) {
        expect(lesson.widgets ?? []).toEqual([]);
      }
    }
  });

  it("authors English exercise props directly, with the same machine data as German", () => {
    const de = getAllLessons(COURSE_SLUG, "de");
    const en = getAllLessons(COURSE_SLUG, "en");
    expect(en.map((lesson) => lesson.exercise?.kind)).toEqual(
      de.map((lesson) => lesson.exercise?.kind),
    );
    const timeline = en.find((lesson) => lesson.exercise?.kind === "timeline-check");
    expect(timeline?.exercise?.props).toMatchObject({
      milestones: expect.arrayContaining([
        expect.objectContaining({ id: "annex3", date: "2027-12-02" }),
      ]),
    });
    // No legacy widget localization is applied to engine exercises.
    const pyramid = en.find((lesson) => lesson.id === "risiko-2-2");
    expect(pyramid?.exercise?.props).toMatchObject({ layout: "pyramid" });
    expect(
      (pyramid?.exercise?.props as { buckets: { label: string }[] }).buckets[0].label,
    ).toBe("Prohibited");
  });
});
