import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetAiNativeOperatorCacheForTests,
  getAiNativeOperatorLocaleRegistry,
  getAllLessons,
  getAllModuleLessonPairs,
  getLesson,
  getModuleLessons,
} from "./data";
import { MODULE_IDS, MODULE_LESSON_COUNTS, TOTAL_LESSON_COUNT } from "./types";

describe("ai-native-operator content module ", () => {
  beforeEach(() => {
    __resetAiNativeOperatorCacheForTests();
  });

  it("loads exactly 39 lessons across 9 modules via dynamic import, matching course-data.js", async () => {
    const all = await getAllLessons();
    expect(all).toHaveLength(TOTAL_LESSON_COUNT);
    expect(all).toHaveLength(39);
  });

  it("every module loads its own real lesson count", async () => {
    for (const moduleId of MODULE_IDS) {
      const lessons = await getModuleLessons(moduleId);
      expect(lessons).toHaveLength(MODULE_LESSON_COUNTS[moduleId]);
      for (const lesson of lessons) {
        expect(lesson.moduleId).toBe(moduleId);
        expect(lesson.id).toBe(`${moduleId}/${lesson.lessonNumber}`);
      }
    }
  });

  it("getAllModuleLessonPairs enumerates exactly the 39 real (moduleId, lessonNumber) pairs, not a 9x cartesian product", async () => {
    const pairs = await getAllModuleLessonPairs();
    expect(pairs).toHaveLength(39);
    const asKeys = new Set(pairs.map((p) => `${p.moduleId}/${p.lessonNumber}`));
    expect(asKeys.size).toBe(39);
    // A cartesian 9x9 product would be 81 pairs; confirm we don't have that.
    expect(pairs.length).not.toBe(81);
  });

  it("getLesson resolves a real lesson by moduleId + lessonNumber", async () => {
    const lesson = await getLesson("mindset", 1);
    expect(lesson?.title).toBe("Choose tasks before choosing tools");
    const missing = await getLesson("mindset", 99);
    expect(missing).toBeUndefined();
  });

  it("every lesson has non-empty title/objective and a valid kind", async () => {
    const all = await getAllLessons();
    for (const lesson of all) {
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.objective.length).toBeGreaterThan(0);
      expect(["reading", "quiz"]).toContain(lesson.kind);
    }
  });

  it("30 lessons are kind:reading with a real section body and an exerciseKind; 9 are kind:quiz with no sections", async () => {
    const all = await getAllLessons();
    const reading = all.filter((l) => l.kind === "reading");
    const quiz = all.filter((l) => l.kind === "quiz");
    expect(reading).toHaveLength(30);
    expect(quiz).toHaveLength(9);
    for (const lesson of reading) {
      expect(lesson.sections.length).toBeGreaterThan(0);
      expect(lesson.exerciseKind).toBeDefined();
      for (const section of lesson.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.content.length).toBeGreaterThan(0);
        expect(section.readTimeMinutes).toBeGreaterThan(0);
      }
    }
    for (const lesson of quiz) {
      expect(lesson.sections).toHaveLength(0);
      expect(lesson.exerciseKind).toBeUndefined();
    }
  });

  it("exercise-kind distribution across the 30 reading lessons matches the confirmed source dispatcher fan-in (23/1/1/1/4)", async () => {
    const all = await getAllLessons();
    const counts: Record<string, number> = {};
    for (const lesson of all) {
      if (!lesson.exerciseKind) continue;
      counts[lesson.exerciseKind] = (counts[lesson.exerciseKind] ?? 0) + 1;
    }
    expect(counts["reflect-box"]).toBe(23);
    expect(counts["self-rate"]).toBe(1);
    expect(counts["matrix-grid"]).toBe(1);
    expect(counts["plays"]).toBe(1);
    expect(counts["slot-fill"]).toBe(4);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(30);
  });

  it("dynamic import cache is per-module: repeated getModuleLessons calls return the same array reference", async () => {
    const first = await getModuleLessons("mindset");
    const second = await getModuleLessons("mindset");
    expect(first).toBe(second);
  });

  it("registers complete English and German bundles without changing machine identity", async () => {
    const registry = await getAiNativeOperatorLocaleRegistry();
    expect(registry.sourceLocale).toBe("en");
    expect(registry.availableLocales).toEqual(["de", "en"]);
    const english = registry.get("en");
    const german = registry.get("de");
    expect(english.content.lessons).toHaveLength(39);
    expect(german.content.lessons).toHaveLength(39);
    expect(german.identity).toEqual(english.identity);
    expect(english.config.language).toBe("en");
    expect(german.config.language).toBe("de");
    expect(german.content.lessons[0].title).not.toBe(
      english.content.lessons[0].title,
    );
  });

  it("keeps module caches isolated by locale", async () => {
    const english = await getModuleLessons("mindset", "en");
    const german = await getModuleLessons("mindset", "de");
    expect(english).not.toBe(german);
    expect(english[0].id).toBe(german[0].id);
    expect(english[0].title).not.toBe(german[0].title);
  });
});
