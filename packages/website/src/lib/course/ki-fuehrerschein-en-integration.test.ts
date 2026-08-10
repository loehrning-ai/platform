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
import { localizeCourseWidgetProps } from "./widget-localization";
import type { Widget } from "@/lib/widgets/types";

const COURSE_SLUG = "ki-fuehrerschein" as const;

describe("KI-Führerschein audited English runtime bundle", () => {
  it("registers English only after config, lessons, glossary, and quiz data resolve", async () => {
    expect(getAuditedCourseContentLocales(COURSE_SLUG)).toEqual(["de", "en"]);
    expect(hasAuditedCourseContentLocale(COURSE_SLUG, "en")).toBe(true);
    expect(resolveFoundationCourseContentLocale(COURSE_SLUG, "en")).toBe("en");

    const config = getCourseConfig(COURSE_SLUG, "en");
    const blocks = getBlocks(COURSE_SLUG, "en");
    const lessons = getAllLessons(COURSE_SLUG, "en");
    const glossary = getGlossaryTerms(COURSE_SLUG, undefined, "en");
    const syncQuestions = getWorkshopQuestions(COURSE_SLUG, "en");
    const asyncQuestions = await loadWorkshopQuestions(COURSE_SLUG, "en");

    expect(config.language).toBe("en");
    expect(config.title).toBe("Everyday AI Literacy");
    expect(blocks).toHaveLength(5);
    expect(lessons).toHaveLength(18);
    expect(glossary).toHaveLength(42);
    expect(syncQuestions).toHaveLength(20);
    expect(asyncQuestions).toEqual(syncQuestions);
    expect(blocks[0].title).toBe("AI is already here");
    expect(lessons[0].title).toBe("Recognize AI functions");
    expect(syncQuestions[0].questionText).toMatch(/[A-Za-z]/);
  });

  it("preserves route, block, lesson, question, option, and checkpoint identity", () => {
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

    expect(enBlocks.map((block) => block.id)).toEqual(
      deBlocks.map((block) => block.id),
    );
    expect(
      enBlocks.flatMap((block) => block.lessons.map((lesson) => lesson.id)),
    ).toEqual(
      deBlocks.flatMap((block) => block.lessons.map((lesson) => lesson.id)),
    );
    expect(enQuestions.map((question) => question.id)).toEqual(
      deQuestions.map((question) => question.id),
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

    const englishGlossaryWidget = enBlocks[0].lessons
      .at(-1)
      ?.widgets?.find((widget) => widget.kind === "flashcards");
    const germanGlossaryWidget = deBlocks[0].lessons
      .at(-1)
      ?.widgets?.find((widget) => widget.kind === "flashcards");
    expect(englishGlossaryWidget?.props?.lessonId).toBe(
      germanGlossaryWidget?.props?.lessonId,
    );
    expect(englishGlossaryWidget?.props?.cpId).toBe(
      germanGlossaryWidget?.props?.cpId,
    );
  });
});

describe("KI-Führerschein English widget integration", () => {
  it("lets locale-owned English chrome override authored German defaults", () => {
    const compare: Widget = {
      kind: "compare",
      placement: "after-intro",
      courseSlug: COURSE_SLUG,
      props: {
        title: "Two prompts",
        bad: "Weak",
        good: "Strong",
        kindLabel: "Vergleich",
      },
    };
    expect(localizeCourseWidgetProps(compare, "en")).toMatchObject({
      title: "Two prompts",
      kindLabel: "Comparison",
    });

    const redaction: Widget = {
      kind: "redaction-drill",
      placement: "before-quiz",
      courseSlug: COURSE_SLUG,
      props: {
        lessonId: "block_2_lesson_3",
        cpId: "redaction-drill",
        title: "Redact before pasting",
        copy: { kindLabel: "Datenschutz-Drill" },
        scenarios: [{ id: "de", label: "Deutsch" }],
      },
    };
    const localizedRedaction = localizeCourseWidgetProps(redaction, "en");
    expect(localizedRedaction.lessonId).toBe("block_2_lesson_3");
    expect(localizedRedaction.cpId).toBe("redaction-drill");
    expect(localizedRedaction.title).toBe("Redact before pasting");
    expect(localizedRedaction.copy).toMatchObject({
      kindLabel: "Data-redaction drill",
    });
    expect(localizedRedaction.scenarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "s1", label: "Server log" }),
      ]),
    );

    const failure: Widget = {
      kind: "failure-tagger",
      placement: "before-quiz",
      courseSlug: COURSE_SLUG,
      props: {
        lessonId: "block_4_lesson_4",
        cpId: "failure-tagger",
        copy: { kindLabel: "Eval-Drill" },
        cases: [{ id: "de" }],
      },
    };
    const localizedFailure = localizeCourseWidgetProps(failure, "en");
    expect(localizedFailure.lessonId).toBe("block_4_lesson_4");
    expect(localizedFailure.cpId).toBe("failure-tagger");
    expect(localizedFailure.copy).toMatchObject({
      kindLabel: "Evaluation drill",
    });
    expect(localizedFailure.cases).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "c1" })]),
    );
  });

  it("leaves the German widget props byte-for-byte equivalent", () => {
    const widget: Widget = {
      kind: "compare",
      placement: "after-intro",
      props: { title: "Titel", bad: "A", good: "B" },
    };
    expect(localizeCourseWidgetProps(widget, "de")).toEqual(widget.props);
    expect(localizeCourseWidgetProps(widget, "de")).not.toBe(widget.props);
  });
});
