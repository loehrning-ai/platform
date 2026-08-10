import { describe, it, expect, beforeEach } from "vitest";
import { ALL_WIDGET_KINDS, isWidgetKind } from "@/lib/widgets/types";
import {
  getAllClaudeLessons,
  getClaudeLesson,
  getClaudeTotalLessons,
  getClaudeTracks,
  __resetClaudeLessonCacheForTests,
} from "./data";
import { CLAUDE_LESSON_IDS, CLAUDE_TRACK_IDS, isClaudeLessonId } from "./types";

beforeEach(() => {
  __resetClaudeLessonCacheForTests();
});

describe("claude-course content module ", () => {
  it("has exactly 12 lesson ids, matching the source's window.LESSONS", () => {
    expect(CLAUDE_LESSON_IDS).toHaveLength(12);
    expect(new Set(CLAUDE_LESSON_IDS).size).toBe(12);
  });

  it("loads exactly 12 lessons, uniquely numbered 1-12", async () => {
    const lessons = await getAllClaudeLessons();
    expect(lessons).toHaveLength(12);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(12);
    expect(lessons.map((l) => l.number)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it("resolves each lesson id individually via the per-lesson loader", async () => {
    for (const id of CLAUDE_LESSON_IDS) {
      const lesson = await getClaudeLesson(id);
      expect(lesson, id).toBeDefined();
      expect(lesson?.id).toBe(id);
    }
  });

  it("returns undefined for an unregistered id", async () => {
    // @ts-expect-error deliberately invalid id to exercise the guard
    const lesson = await getClaudeLesson("does-not-exist");
    expect(lesson).toBeUndefined();
  });

  it("every lesson has non-empty sections with real content, a valid track, and an empty quiz array", async () => {
    const lessons = await getAllClaudeLessons();
    for (const lesson of lessons) {
      expect(lesson.sections.length, lesson.id).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(
          section.content.trim().length,
          `${lesson.id}/${section.id}`,
        ).toBeGreaterThan(20);
      }
      expect(CLAUDE_TRACK_IDS, lesson.id).toContain(lesson.trackId);
      expect(lesson.quiz, lesson.id).toEqual([]);
      expect(lesson.keyConcepts.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.hook.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.subtitle.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.durationMinutes, lesson.id).toBeGreaterThan(0);
    }
  });

  it("every widget kind referenced by a lesson resolves against ALL_WIDGET_KINDS (grows true as later stages register kinds)", async () => {
    const lessons = await getAllClaudeLessons();
    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        expect(isWidgetKind(widget.kind), `${lesson.id}: ${widget.kind}`).toBe(
          true,
        );
        expect(ALL_WIDGET_KINDS, `${lesson.id}: ${widget.kind}`).toContain(
          widget.kind,
        );
      }
    }
  });

  it("caches a lesson module after the first load", async () => {
    const first = await getClaudeLesson("mental-model");
    const second = await getClaudeLesson("mental-model");
    expect(first).toBe(second);
  });

  it("exposes the four source tracks", () => {
    const tracks = getClaudeTracks();
    expect(tracks.map((t) => t.id)).toEqual([
      "foundations",
      "workflows",
      "advanced",
      "team",
    ]);
  });

  it("reports 12 total lessons", () => {
    expect(getClaudeTotalLessons()).toBe(12);
  });

  it("isClaudeLessonId is a real type guard", () => {
    expect(isClaudeLessonId("mental-model")).toBe(true);
    expect(isClaudeLessonId("does-not-exist")).toBe(false);
    expect(isClaudeLessonId(42)).toBe(false);
  });
});
