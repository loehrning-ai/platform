import { describe, it, expect } from "vitest";
import {
  MODULE_IDS,
  MODULE_LESSON_COUNTS,
  MODULE_META,
  TOTAL_LESSON_COUNT,
  isModuleId,
  lessonProgressKey,
  orderedModuleMetas,
  type AiNativeOperatorLesson,
} from "./types";

describe("ai-native-operator types ", () => {
  it("has exactly 9 module ids matching course-data.js's MODULES order", () => {
    expect([...MODULE_IDS]).toEqual([
      "mindset",
      "engineering",
      "product",
      "operations",
      "talent",
      "orgmodel",
      "data",
      "governance",
      "measurement",
    ]);
    expect(new Set(MODULE_IDS).size).toBe(9);
  });

  it("never collides with the bare 'ai-native' slug", () => {
    expect(MODULE_IDS as readonly string[]).not.toContain("ai-native");
    for (const id of MODULE_IDS) {
      expect(id).not.toBe("ai-native");
      expect(id).not.toBe("ai-native-operator");
    }
  });

  it("isModuleId is a real type guard", () => {
    expect(isModuleId("mindset")).toBe(true);
    expect(isModuleId("measurement")).toBe(true);
    expect(isModuleId("ai-native")).toBe(false);
    expect(isModuleId("modul_1")).toBe(false);
    expect(isModuleId(42)).toBe(false);
  });

  it("MODULE_LESSON_COUNTS sums to 39, not a 9x cartesian product", () => {
    expect(TOTAL_LESSON_COUNT).toBe(39);
    const sum = Object.values(MODULE_LESSON_COUNTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(39);
    expect(MODULE_LESSON_COUNTS.mindset).toBe(5);
    expect(MODULE_LESSON_COUNTS.engineering).toBe(5);
    expect(MODULE_LESSON_COUNTS.product).toBe(5);
    expect(MODULE_LESSON_COUNTS.operations).toBe(4);
    expect(MODULE_LESSON_COUNTS.talent).toBe(4);
    expect(MODULE_LESSON_COUNTS.orgmodel).toBe(4);
    expect(MODULE_LESSON_COUNTS.data).toBe(4);
    expect(MODULE_LESSON_COUNTS.governance).toBe(4);
    expect(MODULE_LESSON_COUNTS.measurement).toBe(4);
  });

  it("MODULE_META has one real entry per module id with non-empty copy", () => {
    for (const id of MODULE_IDS) {
      const meta = MODULE_META[id];
      expect(meta.id).toBe(id);
      expect(meta.code).toMatch(/^M0[1-9]$/);
      expect(meta.name.length).toBeGreaterThan(0);
      expect(meta.tagline.length).toBeGreaterThan(0);
      expect(meta.lessonCount).toBe(MODULE_LESSON_COUNTS[id]);
    }
  });

  it("orderedModuleMetas returns all 9 metas in MODULE_IDS order", () => {
    const metas = orderedModuleMetas();
    expect(metas).toHaveLength(9);
    expect(metas.map((m) => m.id)).toEqual([...MODULE_IDS]);
  });

  it("lessonProgressKey matches the source's own '${moduleId}/${lessonNum}' scheme", () => {
    expect(lessonProgressKey("mindset", 1)).toBe("mindset/1");
    expect(lessonProgressKey("measurement", 4)).toBe("measurement/4");
  });

  it("a minimal AiNativeOperatorLesson shape satisfies the interface", () => {
    const lesson: AiNativeOperatorLesson = {
      id: "mindset/1",
      moduleId: "mindset",
      lessonNumber: 1,
      number: 1,
      kind: "reading",
      title: "Why AI-first is no longer optional",
      subtitle: "",
      objective: "Understand the shift.",
      durationMinutes: 14,
      keyConcepts: [],
      quiz: [],
      sections: [
        {
          id: "s1",
          title: "The reckoning",
          readTimeMinutes: 5,
          content: "Some prose.",
        },
      ],
      callout: { kind: "quote", text: "A quote.", attr: "Someone" },
      exerciseKind: "reflect-box",
      widgets: [],
    };
    expect(lesson.moduleId).toBe("mindset");
    expect(lesson.callout?.kind).toBe("quote");
  });
});
