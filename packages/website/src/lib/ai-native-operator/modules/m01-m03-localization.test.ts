import { describe, expect, it } from "vitest";
import type { AiNativeOperatorLesson } from "../types";
import { ENGINEERING_LESSONS_DE } from "./de/m02-engineering";
import { MINDSET_LESSONS_DE } from "./de/m01-mindset";
import { PRODUCT_LESSONS_DE } from "./de/m03-product";
import { OPERATIONS_LESSONS_DE } from "./de/m04-operations";
import { TALENT_LESSONS_DE } from "./de/m05-talent";
import { ORGMODEL_LESSONS_DE } from "./de/m06-orgmodel";
import { DATA_LESSONS_DE } from "./de/m07-data";
import { GOVERNANCE_LESSONS_DE } from "./de/m08-governance";
import { MEASUREMENT_LESSONS_DE } from "./de/m09-measurement";
import { ENGINEERING_LESSONS } from "./m02-engineering";
import { MINDSET_LESSONS } from "./m01-mindset";
import { PRODUCT_LESSONS } from "./m03-product";
import { OPERATIONS_LESSONS } from "./m04-operations";
import { TALENT_LESSONS } from "./m05-talent";
import { ORGMODEL_LESSONS } from "./m06-orgmodel";
import { DATA_LESSONS } from "./m07-data";
import { GOVERNANCE_LESSONS } from "./m08-governance";
import { MEASUREMENT_LESSONS } from "./m09-measurement";

const ENGLISH_LESSONS = [
  ...MINDSET_LESSONS,
  ...ENGINEERING_LESSONS,
  ...PRODUCT_LESSONS,
  ...OPERATIONS_LESSONS,
  ...TALENT_LESSONS,
  ...ORGMODEL_LESSONS,
  ...DATA_LESSONS,
  ...GOVERNANCE_LESSONS,
  ...MEASUREMENT_LESSONS,
] as const;

const GERMAN_LESSONS = [
  ...MINDSET_LESSONS_DE,
  ...ENGINEERING_LESSONS_DE,
  ...PRODUCT_LESSONS_DE,
  ...OPERATIONS_LESSONS_DE,
  ...TALENT_LESSONS_DE,
  ...ORGMODEL_LESSONS_DE,
  ...DATA_LESSONS_DE,
  ...GOVERNANCE_LESSONS_DE,
  ...MEASUREMENT_LESSONS_DE,
] as const;

const EXPECTED_LESSON_IDS = [
  "mindset/1",
  "mindset/2",
  "mindset/3",
  "mindset/4",
  "mindset/5",
  "engineering/1",
  "engineering/2",
  "engineering/3",
  "engineering/4",
  "engineering/5",
  "product/1",
  "product/2",
  "product/3",
  "product/4",
  "product/5",
  "operations/1",
  "operations/2",
  "operations/3",
  "operations/4",
  "talent/1",
  "talent/2",
  "talent/3",
  "talent/4",
  "orgmodel/1",
  "orgmodel/2",
  "orgmodel/3",
  "orgmodel/4",
  "data/1",
  "data/2",
  "data/3",
  "data/4",
  "governance/1",
  "governance/2",
  "governance/3",
  "governance/4",
  "measurement/1",
  "measurement/2",
  "measurement/3",
  "measurement/4",
] as const;

function widgetIdentity(lesson: AiNativeOperatorLesson) {
  return (lesson.widgets ?? []).map((widget) => {
    const props = widget.props as Record<string, unknown>;
    const axes = Array.isArray(props.axes)
      ? props.axes.map((axis) => {
          const value = axis as {
            readonly id?: unknown;
            readonly anchors?: unknown;
          };
          return {
            id: value.id,
            anchorCount: Array.isArray(value.anchors)
              ? value.anchors.length
              : null,
          };
        })
      : [];
    return {
      kind: widget.kind,
      placement: widget.placement,
      courseSlug: widget.courseSlug,
      lessonId: props.lessonId,
      cpId: props.cpId,
      numericRows: typeof props.rows === "number" ? props.rows : null,
      rowCount: Array.isArray(props.rows) ? props.rows.length : null,
      colCount: Array.isArray(props.cols) ? props.cols.length : null,
      placeholderCount: Array.isArray(props.placeholders)
        ? props.placeholders.length
        : null,
      optionCount: Array.isArray(props.options) ? props.options.length : null,
      minPick: props.minPick ?? null,
      axes,
    };
  });
}

function contentIdentity(lessons: readonly AiNativeOperatorLesson[]) {
  return lessons.map((lesson) => ({
    id: lesson.id,
    moduleId: lesson.moduleId,
    lessonNumber: lesson.lessonNumber,
    number: lesson.number,
    kind: lesson.kind,
    durationMinutes: lesson.durationMinutes,
    keyConceptCount: lesson.keyConcepts.length,
    sections: lesson.sections.map((section) => ({
      id: section.id,
      readTimeMinutes: section.readTimeMinutes,
    })),
    quiz: lesson.quiz.map((question) => ({
      id: question.id,
      options: question.answerOptions.map((option) => ({
        id: option.id,
        isCorrect: option.isCorrect,
      })),
    })),
    calloutKind: lesson.callout?.kind ?? null,
    calloutLineCount:
      lesson.callout?.kind === "spec" ? lesson.callout.lines.length : null,
    exerciseKind: lesson.exerciseKind ?? null,
    widgets: widgetIdentity(lesson),
  }));
}

function visibleStrings(lessons: readonly AiNativeOperatorLesson[]): string[] {
  const values: string[] = [];
  for (const lesson of lessons) {
    values.push(lesson.title, lesson.subtitle, lesson.objective);
    for (const section of lesson.sections) {
      values.push(section.title, section.content);
    }
    if (lesson.callout) {
      if ("h" in lesson.callout) values.push(lesson.callout.h);
      if ("text" in lesson.callout) values.push(lesson.callout.text);
      if ("attr" in lesson.callout) values.push(lesson.callout.attr);
      if ("lines" in lesson.callout) values.push(...lesson.callout.lines);
    }
    for (const question of lesson.quiz) {
      values.push(question.questionText, question.explanation);
      values.push(...question.answerOptions.map((option) => option.text));
    }
    for (const widget of lesson.widgets ?? []) {
      const props = widget.props as Record<string, unknown>;
      for (const key of ["title", "scenario"] as const) {
        if (typeof props[key] === "string") values.push(props[key]);
      }
      for (const key of ["rows", "cols", "options", "placeholders"] as const) {
        if (Array.isArray(props[key])) {
          values.push(
            ...props[key].filter(
              (value): value is string => typeof value === "string",
            ),
          );
        }
      }
      if (Array.isArray(props.axes)) {
        for (const axis of props.axes) {
          const value = axis as {
            readonly label?: unknown;
            readonly anchors?: unknown;
          };
          if (typeof value.label === "string") values.push(value.label);
          if (Array.isArray(value.anchors)) {
            values.push(
              ...value.anchors.filter(
                (anchor): anchor is string => typeof anchor === "string",
              ),
            );
          }
        }
      }
    }
  }
  return values.filter((value) => value.trim().length > 0);
}

function correctAnswerIndices(lessons: readonly AiNativeOperatorLesson[]) {
  return lessons
    .filter((lesson) => lesson.kind === "quiz")
    .map((lesson) =>
      lesson.quiz.map((question) =>
        question.answerOptions.findIndex((option) => option.isCorrect),
      ),
    );
}

describe("AI-Native Operator M01-M09 reviewed locale bundles", () => {
  it("preserves the complete 39-lesson machine identity across locales", () => {
    expect(ENGLISH_LESSONS.map((lesson) => lesson.id)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(GERMAN_LESSONS.map((lesson) => lesson.id)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(contentIdentity(GERMAN_LESSONS)).toEqual(
      contentIdentity(ENGLISH_LESSONS),
    );
  });

  it("keeps question counts, option counts, and correct-answer indices stable", () => {
    expect(
      ENGLISH_LESSONS.filter((lesson) => lesson.kind === "quiz"),
    ).toHaveLength(9);
    expect(
      ENGLISH_LESSONS.filter((lesson) => lesson.kind === "quiz").map(
        (lesson) => lesson.quiz.length,
      ),
    ).toEqual([3, 3, 3, 2, 2, 2, 2, 2, 3]);
    expect(
      ENGLISH_LESSONS.filter((lesson) => lesson.kind === "quiz").flatMap(
        (lesson) =>
          lesson.quiz.map((question) => question.answerOptions.length),
      ),
    ).toEqual(Array(22).fill(4));
    expect(correctAnswerIndices(ENGLISH_LESSONS)).toEqual([
      [1, 2, 1],
      [0, 1, 2],
      [2, 1, 2],
      [1, 2],
      [2, 2],
      [2, 1],
      [1, 2],
      [1, 2],
      [1, 2, 1],
    ]);
    expect(correctAnswerIndices(GERMAN_LESSONS)).toEqual(
      correctAnswerIndices(ENGLISH_LESSONS),
    );
  });

  it("removes unsupported predictions, multipliers, company claims, and slogans from English", () => {
    const text = visibleStrings(ENGLISH_LESSONS).join("\n");
    const forbidden = [
      /AI-first/i,
      /no longer optional/i,
      /Tobi Lütke|Shopify|Klarna|Microsoft(?:'s)? Work Trend/i,
      /customer-service agents|fourteen hours per month/i,
      /generational|compounds? the leverage/i,
      /5\s*[-–]\s*10 PRs|~50 lines|80\/20|30\s*[-–]\s*100 tasks/i,
      /only thing keeping you safe|most regressions/i,
      /quietly breaks 12%|only the second category matters/i,
      /feel like magic|value loud|hero artisan/i,
      /shrank (?:their|the) team|while (?:you|she) sleep/i,
      /no model on earth|the new hero/i,
      /reclaim a third|status meeting is dead|AI removes the tax/i,
      /blank page should never|\b20 minutes\b|\b95\/5\b|\b1 hour a day\b/i,
      /whiteboard is (?:over|useless)|least keystroke effort/i,
      /3\s*[-–]\s*5x|brutal truth|culture is downstream of comp/i,
      /\b70%|\b20%|\b10%|only thing that matters/i,
      /two-pizza|two to four humans|hours, not quarters|forcing function/i,
      /beats three specialists|two-approver default|AI removes that excuse/i,
      /context is everything|expert-level answers|investment that compounds/i,
      /first month.*day one|most ROI|path to disaster|leak that ends the program/i,
      /sets the program back two years|snapshots are radioactive|it is poison/i,
      /bar for fresh context is minutes|boring foundation|nothing exotic/i,
      /catches a near-disaster|grumbling stops forever|get burned/i,
      /audit log is a story you tell yourself|with it, you have ground truth/i,
      /vanity metric|comforting; useless|2\s*[-–]\s*3 outcome/i,
      /two weeks minimum|telling stories|prove the ROI|loses funding/i,
      /20-minute deck|five slides|muscle memory|program compounds/i,
      /30% productivity gain|activity or vibes/i,
      /\b20(?:2[3-9]|3\d)\b/,
    ];
    for (const pattern of forbidden) {
      expect(text, `unsupported copy matched ${pattern}`).not.toMatch(pattern);
    }
    for (const required of [
      "error cost",
      "named human owners",
      "specification",
      "release and rollback criteria",
      "product boundary",
      "Production evaluation and observability",
      "accountable",
      "decision owner",
      "risk-based",
      "Work-sample",
      "compensation",
      "accountable outcomes",
      "separation of duties",
      "authorization at retrieval time",
      "workload identity",
      "lifecycle events",
      "staged exposure",
      "comparable baseline",
      "credible comparison",
    ]) {
      expect(text).toContain(required);
    }
  });

  it("contains reviewed German copy without English prose leakage", () => {
    const germanStrings = visibleStrings(GERMAN_LESSONS);
    const englishLeak =
      /\b(?:the|and|your|you|from|with|without|before|after|should|which|what|when|where|same|returns|goal|interfaces|invariants|non-goals|knowledge check|source|review)\b/i;

    for (const value of germanStrings) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value, `English leak in German copy: ${value}`).not.toMatch(
        englishLeak,
      );
    }

    const text = germanStrings.join("\n");
    for (const required of [
      "Fehlerkosten",
      "Spezifikation",
      "Freigabekontrolle",
      "Produktgrenze",
      "Beobachtbarkeit",
      "verantwortlich",
      "Entscheidungsverantwortung",
      "risikobasierte",
      "Arbeitsprobe",
      "Vergütung",
      "verantwortete Ergebnisse",
      "Funktionstrennung",
      "Berechtigungen beim Abruf",
      "Dienstidentität",
      "Lebenszyklusereignisse",
      "gestufte Einführung",
      "vergleichbare Ausgangslage",
      "belastbaren Vergleich",
    ]) {
      expect(text).toContain(required);
    }
    expect(text).not.toContain("Choose tasks before choosing tools");
    expect(text).not.toContain("Production evaluation and observability");
  });
});
