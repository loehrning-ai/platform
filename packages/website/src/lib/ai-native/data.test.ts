import { describe, it, expect, beforeEach } from "vitest";
import {
  getModules,
  getModule,
  getModuleLessons,
  getLesson,
  getAllLessons,
  getCourseMeta,
  __resetLessonCacheForTests,
} from "./data";
import { MODULE_IDS } from "./types";

describe("ai-native data layer (shared course architecture)", () => {
  beforeEach(() => {
    __resetLessonCacheForTests();
  });

  it("exposes the module index synchronously", () => {
    const modules = getModules();
    expect(modules.length).toBe(MODULE_IDS.length);
    expect(getModule("modul_1")?.number).toBe(1);
    expect(getModule("modul_4")?.number).toBe(4);
  });

  it("loads lessons per module via async dynamic import", async () => {
    const lessons = await getModuleLessons("modul_1");
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0].id).toMatch(/^modul_1_lesson_/);
  });

  it("module lessonCount matches the dynamically-loaded lesson count", async () => {
    for (const id of MODULE_IDS) {
      const mod = getModule(id);
      const lessons = await getModuleLessons(id);
      expect(lessons.length).toBe(mod?.lessonCount);
    }
  });

  it("getLesson resolves a single lesson asynchronously", async () => {
    const lesson = await getLesson("modul_2", "modul_2_lesson_1");
    expect(lesson?.id).toBe("modul_2_lesson_1");
    expect(await getLesson("modul_2", "does_not_exist")).toBeUndefined();
  });

  it("memoizes module lessons (cache returns identical reference)", async () => {
    const first = await getModuleLessons("modul_3");
    const second = await getModuleLessons("modul_3");
    expect(second).toBe(first);
  });

  it("getAllLessons flattens every module", async () => {
    const all = await getAllLessons();
    const summed = (
      await Promise.all(MODULE_IDS.map((id) => getModuleLessons(id)))
    ).reduce((n, l) => n + l.length, 0);
    expect(all.length).toBe(summed);
  });

  it("every AI-Native lesson is free (premiumGated falsy) — ", async () => {
    const all = await getAllLessons();
    for (const lesson of all) {
      expect(lesson.premiumGated ?? false).toBe(false);
    }
  });

  it("every module is free (premiumGated false) — ", () => {
    for (const mod of getModules()) {
      expect(mod.premiumGated).toBe(false);
    }
  });

  it("course meta is still readable synchronously", () => {
    const meta = getCourseMeta();
    expect(meta.courseId).toBeTruthy();
    expect(meta.totalModules).toBe(MODULE_IDS.length);
  });

  it("serves the audited English bundle without changing stable identities", async () => {
    const germanModules = getModules("de");
    const englishModules = getModules("en");
    expect(englishModules.map((module) => module.id)).toEqual(
      germanModules.map((module) => module.id),
    );
    expect(englishModules[0]?.title).toBe("From task to workflow");
    expect(englishModules[0]?.title).not.toBe(germanModules[0]?.title);

    for (const moduleId of MODULE_IDS) {
      const german = await getModuleLessons(moduleId, "de");
      const english = await getModuleLessons(moduleId, "en");
      expect(english.map((lesson) => lesson.id)).toEqual(
        german.map((lesson) => lesson.id),
      );
    }

    expect(getCourseMeta("en")).toMatchObject({
      courseId: getCourseMeta("de").courseId,
      language: "en",
      title: "AI-Native Workflow Course",
    });
  });

  it("every lesson with quiz data exposes well-formed questions for the inline quiz", async () => {
    const all = await getAllLessons();
    for (const lesson of all) {
      for (const q of lesson.quiz) {
        expect(q.answerOptions.length).toBeGreaterThan(0);
        expect(q.answerOptions.some((o) => o.isCorrect)).toBe(true);
        expect(typeof q.questionText).toBe("string");
      }
    }
  });
});
