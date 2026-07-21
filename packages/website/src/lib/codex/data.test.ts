import { describe, it, expect, beforeEach } from "vitest";
import { ALL_WIDGET_KINDS, isWidgetKind } from "@/lib/widgets/types";
import {
  getAllCodexLessons,
  getCodexLesson,
  getCodexTotalLessons,
  getCodexTracks,
  __resetCodexLessonCacheForTests,
} from "./data";
import { CODEX_LESSON_IDS, CODEX_TRACK_IDS, isCodexLessonId } from "./types";

beforeEach(() => {
  __resetCodexLessonCacheForTests();
});

describe("codex content module (plan 009 stages 3-4)", () => {
  it("has exactly 12 lesson ids, matching the source's window.LESSONS", () => {
    expect(CODEX_LESSON_IDS).toHaveLength(12);
    expect(new Set(CODEX_LESSON_IDS).size).toBe(12);
  });

  it("loads exactly 12 lessons, uniquely numbered 1-12", async () => {
    const lessons = await getAllCodexLessons();
    expect(lessons).toHaveLength(12);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(12);
    expect(lessons.map((l) => l.number)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it("resolves each lesson id individually via the per-lesson loader", async () => {
    for (const id of CODEX_LESSON_IDS) {
      const lesson = await getCodexLesson(id);
      expect(lesson, id).toBeDefined();
      expect(lesson?.id).toBe(id);
    }
  });

  it("returns undefined for an unregistered id", async () => {
    // @ts-expect-error deliberately invalid id to exercise the guard
    const lesson = await getCodexLesson("L99");
    expect(lesson).toBeUndefined();
  });

  it("every lesson has non-empty sections with real content and structured blocks, a valid track, and an empty quiz array", async () => {
    const lessons = await getAllCodexLessons();
    for (const lesson of lessons) {
      expect(lesson.sections.length, lesson.id).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(section.content.trim().length, `${lesson.id}/${section.id}`).toBeGreaterThan(20);
        expect(section.blocks.length, `${lesson.id}/${section.id}`).toBeGreaterThan(0);
        for (const block of section.blocks) {
          if (block.kind === "prose") expect(block.markdown.trim().length).toBeGreaterThan(0);
          if (block.kind === "pull-quote") expect(block.text.trim().length).toBeGreaterThan(0);
          if (block.kind === "callout") expect(block.body.trim().length).toBeGreaterThan(0);
          if (block.kind === "card-grid") expect(block.cards.length).toBeGreaterThan(0);
        }
      }
      expect(CODEX_TRACK_IDS, lesson.id).toContain(lesson.trackId);
      expect(lesson.quiz, lesson.id).toEqual([]);
      expect(lesson.keyConcepts.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.hook.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.subtitle.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.durationMinutes, lesson.id).toBeGreaterThan(0);
    }
  });

  it("every widget kind referenced by a lesson resolves against ALL_WIDGET_KINDS", async () => {
    const lessons = await getAllCodexLessons();
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        expect(isWidgetKind(widget.kind), `${lesson.id}: ${widget.kind}`).toBe(true);
        expect(ALL_WIDGET_KINDS, `${lesson.id}: ${widget.kind}`).toContain(widget.kind);
      }
    }
  });

  it("every quiz widget instance has exactly one valid correct index and a non-empty explanation", async () => {
    const lessons = await getAllCodexLessons();
    let quizCount = 0;
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        if (widget.kind !== "quiz") continue;
        quizCount += 1;
        const props = widget.props as {
          question: string;
          options: readonly string[];
          correct: number;
          explanation: string;
        };
        expect(props.question.trim().length, `${lesson.id}`).toBeGreaterThan(0);
        expect(props.options.length, `${lesson.id}`).toBeGreaterThanOrEqual(2);
        expect(props.correct, `${lesson.id}`).toBeGreaterThanOrEqual(0);
        expect(props.correct, `${lesson.id}`).toBeLessThan(props.options.length);
        expect(props.explanation.trim().length, `${lesson.id}`).toBeGreaterThan(0);
      }
    }
    expect(quizCount).toBeGreaterThan(0);
  });

  it("caches a lesson module after the first load", async () => {
    const first = await getCodexLesson("L01");
    const second = await getCodexLesson("L01");
    expect(first).toBe(second);
  });

  it("exposes the four source tracks", () => {
    const tracks = getCodexTracks();
    expect(tracks.map((t) => t.id)).toEqual([
      "fundamentals",
      "task-craft",
      "in-the-loop",
      "advanced",
    ]);
  });

  it("reports 12 total lessons", () => {
    expect(getCodexTotalLessons()).toBe(12);
  });

  it("isCodexLessonId is a real type guard", () => {
    expect(isCodexLessonId("L01")).toBe(true);
    expect(isCodexLessonId("does-not-exist")).toBe(false);
    expect(isCodexLessonId(42)).toBe(false);
  });
});
