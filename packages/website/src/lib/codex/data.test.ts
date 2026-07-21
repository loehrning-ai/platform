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

// Lessons registered so far. Plan 009 stage 3 lands tracks 1-2 (L01-L06);
// stage 4 lands tracks 3-4 (L07-L12) and this list tightens to all 12 —
// see LESSON_LOADERS in ./data, which is `Partial` for the same reason.
const REGISTERED_IDS = ["L01", "L02", "L03", "L04", "L05", "L06"] as const;

describe("codex content module (plan 009 stage 3/4)", () => {
  it("has exactly 12 lesson ids, matching the source's window.LESSONS", () => {
    expect(CODEX_LESSON_IDS).toHaveLength(12);
    expect(new Set(CODEX_LESSON_IDS).size).toBe(12);
  });

  it("loads exactly the registered lessons so far, uniquely numbered from 1", async () => {
    const lessons = await getAllCodexLessons();
    expect(lessons).toHaveLength(REGISTERED_IDS.length);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(REGISTERED_IDS.length);
    expect(lessons.map((l) => l.number)).toEqual(
      Array.from({ length: REGISTERED_IDS.length }, (_, i) => i + 1),
    );
  });

  it("resolves each registered lesson id individually via the per-lesson loader", async () => {
    for (const id of REGISTERED_IDS) {
      const lesson = await getCodexLesson(id);
      expect(lesson, id).toBeDefined();
      expect(lesson?.id).toBe(id);
    }
  });

  it("returns undefined for a lesson id not yet registered (L07-L12, until stage 4)", async () => {
    const unregisteredIds = CODEX_LESSON_IDS.filter(
      (id) => !(REGISTERED_IDS as readonly string[]).includes(id),
    );
    expect(unregisteredIds.length).toBeGreaterThan(0);
    for (const id of unregisteredIds) {
      expect(await getCodexLesson(id), id).toBeUndefined();
    }
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
