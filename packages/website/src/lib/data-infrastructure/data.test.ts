import { describe, it, expect, beforeEach } from "vitest";
import { ALL_WIDGET_KINDS, isWidgetKind } from "@/lib/widgets/types";
import {
  getAllDataInfraLessons,
  getDataInfraLesson,
  getDataInfraTotalLessons,
  getDataInfraTracks,
  __resetDataInfraLessonCacheForTests,
} from "./data";
import {
  DATA_INFRA_LESSON_IDS,
  DATA_INFRA_TRACK_IDS,
  isDataInfraLessonId,
} from "./types";

beforeEach(() => {
  __resetDataInfraLessonCacheForTests();
});

describe("data-infrastructure content module ", () => {
  it("has exactly 12 lesson ids, matching the source's window.LESSONS", () => {
    expect(DATA_INFRA_LESSON_IDS).toHaveLength(12);
    expect(new Set(DATA_INFRA_LESSON_IDS).size).toBe(12);
  });

  it("loads exactly 12 lessons, uniquely numbered 1-12", async () => {
    const lessons = await getAllDataInfraLessons();
    expect(lessons).toHaveLength(12);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(12);
    expect(lessons.map((l) => l.number)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it("resolves each lesson id individually via the per-lesson loader", async () => {
    for (const id of DATA_INFRA_LESSON_IDS) {
      const lesson = await getDataInfraLesson(id);
      expect(lesson, id).toBeDefined();
      expect(lesson?.id).toBe(id);
    }
  });

  it("returns undefined for an unregistered id", async () => {
    // @ts-expect-error deliberately invalid id to exercise the guard
    const lesson = await getDataInfraLesson("does-not-exist");
    expect(lesson).toBeUndefined();
  });

  it("every lesson has non-empty sections with real prose, a valid track, and an empty quiz array", async () => {
    const lessons = await getAllDataInfraLessons();
    for (const lesson of lessons) {
      expect(lesson.sections.length, lesson.id).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(
          section.content.trim().length,
          `${lesson.id}/${section.id}`,
        ).toBeGreaterThan(20);
      }
      expect(DATA_INFRA_TRACK_IDS, lesson.id).toContain(lesson.trackId);
      expect(lesson.quiz, lesson.id).toEqual([]);
      expect(lesson.keyConcepts.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.hook.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.subtitle.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.durationMinutes, lesson.id).toBeGreaterThan(0);
    }
  });

  it("every widget kind referenced by a lesson resolves against ALL_WIDGET_KINDS (only quiz/flashcards, no course-local kinds)", async () => {
    const lessons = await getAllDataInfraLessons();
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        expect(isWidgetKind(widget.kind), `${lesson.id}: ${widget.kind}`).toBe(
          true,
        );
        expect(ALL_WIDGET_KINDS, `${lesson.id}: ${widget.kind}`).toContain(
          widget.kind,
        );
        expect(
          ["quiz", "flashcards"],
          `${lesson.id}: ${widget.kind}`,
        ).toContain(widget.kind);
      }
    }
  });

  it("every quiz widget instance has exactly one valid correct index, a non-empty explanation, and a checkpointLessonId-namespaced lessonId", async () => {
    const lessons = await getAllDataInfraLessons();
    let quizCount = 0;
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        if (widget.kind !== "quiz") continue;
        quizCount += 1;
        const props = widget.props as {
          lessonId: string;
          question: string;
          options: readonly string[];
          correct: number;
          explanation: string;
        };
        expect(props.lessonId, lesson.id).toBe(`di-${lesson.id}`);
        expect(props.question.trim().length, lesson.id).toBeGreaterThan(0);
        expect(props.options.length, lesson.id).toBeGreaterThanOrEqual(2);
        expect(props.correct, lesson.id).toBeGreaterThanOrEqual(0);
        expect(props.correct, lesson.id).toBeLessThan(props.options.length);
        expect(props.explanation.trim().length, lesson.id).toBeGreaterThan(0);
      }
    }
    // 10 lessons carry 2 quiz questions, 2 lessons (cap-pacelc, streaming)
    // carry 3, matching a direct grep count of W.Quiz( calls per lesson HTML.
    expect(quizCount).toBe(26);
  });

  it("every lesson has exactly one flashcards widget with a non-empty deck and a namespaced lessonId", async () => {
    const lessons = await getAllDataInfraLessons();
    for (const lesson of lessons) {
      const flashWidgets = (lesson.widgets ?? []).filter(
        (w) => w.kind === "flashcards",
      );
      expect(flashWidgets.length, lesson.id).toBe(1);
      const props = flashWidgets[0].props as {
        lessonId: string;
        title?: string;
        cards: readonly { term?: string; q: string; a: string }[];
      };
      expect(props.lessonId, lesson.id).toBe(`di-${lesson.id}`);
      // Regression guard: FlashcardsWidget's own default title is the German
      // "Karteikarten" (only claude/codex-style copy overrides exist for
      // kindLabel/hints, not the per-instance title) — found via live QA
      // that every lesson file was missing an explicit English title,
      // silently leaking German chrome onto this English-language course.
      expect(props.title, lesson.id).toBeTruthy();
      expect(props.title, lesson.id).not.toBe("Karteikarten");
      expect(props.cards.length, lesson.id).toBeGreaterThan(0);
      for (const card of props.cards) {
        expect(card.q.trim().length, lesson.id).toBeGreaterThan(0);
        expect(card.a.trim().length, lesson.id).toBeGreaterThan(0);
      }
    }
  });

  it("caches a lesson module after the first load", async () => {
    const first = await getDataInfraLesson("mental-model");
    const second = await getDataInfraLesson("mental-model");
    expect(first).toBe(second);
  });

  it("exposes the four source tracks", () => {
    const tracks = getDataInfraTracks();
    expect(tracks.map((t) => t.id)).toEqual([
      "foundations",
      "storage",
      "movement",
      "scale",
    ]);
  });

  it("reports 12 total lessons", () => {
    expect(getDataInfraTotalLessons()).toBe(12);
  });

  it("isDataInfraLessonId is a real type guard", () => {
    expect(isDataInfraLessonId("mental-model")).toBe(true);
    expect(isDataInfraLessonId("does-not-exist")).toBe(false);
    expect(isDataInfraLessonId(42)).toBe(false);
  });
});
