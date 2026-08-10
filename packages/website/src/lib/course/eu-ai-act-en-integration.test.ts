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
    expect(blocks).toHaveLength(6);
    expect(lessons).toHaveLength(24);
    expect(glossary).toHaveLength(23);
    expect(syncQuestions).toHaveLength(27);
    expect(asyncQuestions).toEqual(syncQuestions);
    expect(blocks[0].title).toBe("Scope, roles, and application dates");
    expect(lessons[0].title).toBe("Why the AI Act exists");
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

    const englishGlossaryWidget = enBlocks[0].lessons.at(-1)?.widgets?.find(
      (widget) => widget.kind === "flashcards",
    );
    const germanGlossaryWidget = deBlocks[0].lessons.at(-1)?.widgets?.find(
      (widget) => widget.kind === "flashcards",
    );
    expect(englishGlossaryWidget?.props?.lessonId).toBe(
      germanGlossaryWidget?.props?.lessonId,
    );
    expect(englishGlossaryWidget?.props?.cpId).toBe(
      germanGlossaryWidget?.props?.cpId,
    );
  });

  it("localizes EU exercise chrome without replacing authored legal cases", () => {
    const blocks = getBlocks(COURSE_SLUG, "en");
    const widgets = blocks.flatMap((block) =>
      block.lessons.flatMap((lesson) => lesson.widgets ?? []),
    );
    const riskPyramid = widgets.find((widget) => widget.kind === "risk-pyramid");
    const reorder = widgets.find((widget) => widget.kind === "drag-reorder");
    const failure = widgets.find((widget) => widget.kind === "failure-tagger");

    expect(riskPyramid).toBeDefined();
    expect(reorder).toBeDefined();
    expect(failure).toBeDefined();

    const riskProps = localizeCourseWidgetProps(riskPyramid!, "en");
    expect(riskProps.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "verboten",
          label: "Prohibited practices",
        }),
      ]),
    );
    expect(riskProps.copy).toMatchObject({ kindLabel: "Risk map" });

    const reorderProps = localizeCourseWidgetProps(reorder!, "en");
    expect(reorderProps.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hochrisiko",
          label: "High-risk systems",
        }),
      ]),
    );
    expect(reorderProps.copy).toMatchObject({ checkLabel: "Check order" });

    const authoredCases = failure!.props?.cases;
    const authoredModes = failure!.props?.modes;
    const failureProps = localizeCourseWidgetProps(failure!, "en");
    expect(failureProps.cases).toEqual(authoredCases);
    expect(failureProps.modes).toEqual(authoredModes);
    expect(failureProps.copy).toMatchObject({
      kindLabel: "Evaluation drill",
    });
  });
});
