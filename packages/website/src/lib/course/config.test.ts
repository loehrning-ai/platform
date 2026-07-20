import { describe, it, expect } from "vitest";
import type { CourseSlug } from "./types";
import {
  KI_FUEHRERSCHEIN_CONFIG,
  EU_AI_ACT_KURS_CONFIG,
  AI_NATIVE_CONFIG,
  KI_UND_GESELLSCHAFT_CONFIG,
  getRegisteredCourseSlugs,
  isCourseRegistered,
  getCourseConfig,
  getCourseBlockIds,
  getWorkshopPassThreshold,
  getWorkshopQuestionCount,
  getWorkshopTimeLimitMinutes,
} from "./config";

// A slug that is intentionally NOT in COURSE_CONFIGS, cast through unknown so
// we can exercise the runtime guard that the CourseSlug union hides at compile
// time.
const UNREGISTERED = "does-not-exist" as unknown as CourseSlug;

describe("getRegisteredCourseSlugs", () => {
  it("returns exactly the four registered course slugs", () => {
    const slugs = [...getRegisteredCourseSlugs()].sort();
    expect(slugs).toEqual([
      "ai-native",
      "eu-ai-act-kurs",
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
    ]);
  });
});

describe("isCourseRegistered", () => {
  it("is true for every registered course", () => {
    expect(isCourseRegistered("ki-fuehrerschein")).toBe(true);
    expect(isCourseRegistered("eu-ai-act-kurs")).toBe(true);
    expect(isCourseRegistered("ai-native")).toBe(true);
    expect(isCourseRegistered("ki-und-gesellschaft")).toBe(true);
  });

  it("is false for an unregistered slug", () => {
    expect(isCourseRegistered(UNREGISTERED)).toBe(false);
  });
});

describe("getCourseConfig", () => {
  it("returns the KI-Führerschein config object", () => {
    expect(getCourseConfig("ki-fuehrerschein")).toBe(KI_FUEHRERSCHEIN_CONFIG);
  });

  it("returns the EU AI Act config object", () => {
    expect(getCourseConfig("eu-ai-act-kurs")).toBe(EU_AI_ACT_KURS_CONFIG);
  });

  it("returns the AI-Native config object", () => {
    expect(getCourseConfig("ai-native")).toBe(AI_NATIVE_CONFIG);
  });

  it("returns the KI und Gesellschaft config object", () => {
    expect(getCourseConfig("ki-und-gesellschaft")).toBe(
      KI_UND_GESELLSCHAFT_CONFIG,
    );
  });

  it("throws a descriptive error for an unregistered slug", () => {
    expect(() => getCourseConfig(UNREGISTERED)).toThrow(
      'Course "does-not-exist" is not registered in the shared engine.',
    );
  });
});

describe("getCourseBlockIds", () => {
  it("returns the five KI-Führerschein blocks", () => {
    expect(getCourseBlockIds("ki-fuehrerschein")).toEqual([
      "block_1",
      "block_2",
      "block_3",
      "block_4",
      "block_5",
    ]);
  });

  it("returns the six EU AI Act blocks", () => {
    expect(getCourseBlockIds("eu-ai-act-kurs")).toHaveLength(6);
  });

  it("returns an empty block list for AI-Native (module-keyed lessons)", () => {
    expect(getCourseBlockIds("ai-native")).toEqual([]);
  });

  it("returns the three KI und Gesellschaft blocks", () => {
    expect(getCourseBlockIds("ki-und-gesellschaft")).toEqual([
      "block_1",
      "block_2",
      "block_3",
    ]);
  });

  it("throws for an unregistered slug", () => {
    expect(() => getCourseBlockIds(UNREGISTERED)).toThrow(
      "is not registered in the shared engine",
    );
  });
});

describe("workshop-quiz config queries", () => {
  it("reads the pass threshold from the config (0.7 for every course)", () => {
    expect(getWorkshopPassThreshold("ki-fuehrerschein")).toBe(0.7);
    expect(getWorkshopPassThreshold("eu-ai-act-kurs")).toBe(0.7);
    expect(getWorkshopPassThreshold("ai-native")).toBe(0.7);
    expect(getWorkshopPassThreshold("ki-und-gesellschaft")).toBe(0.7);
  });

  it("reads the per-course question count", () => {
    expect(getWorkshopQuestionCount("ki-fuehrerschein")).toBe(20);
    expect(getWorkshopQuestionCount("eu-ai-act-kurs")).toBe(27);
    expect(getWorkshopQuestionCount("ai-native")).toBe(20);
    expect(getWorkshopQuestionCount("ki-und-gesellschaft")).toBe(15);
  });

  it("reads the per-course time limit in minutes", () => {
    expect(getWorkshopTimeLimitMinutes("ki-fuehrerschein")).toBe(25);
    expect(getWorkshopTimeLimitMinutes("eu-ai-act-kurs")).toBe(30);
    expect(getWorkshopTimeLimitMinutes("ai-native")).toBe(25);
    expect(getWorkshopTimeLimitMinutes("ki-und-gesellschaft")).toBe(20);
  });

  it("all three queries throw for an unregistered slug", () => {
    expect(() => getWorkshopPassThreshold(UNREGISTERED)).toThrow();
    expect(() => getWorkshopQuestionCount(UNREGISTERED)).toThrow();
    expect(() => getWorkshopTimeLimitMinutes(UNREGISTERED)).toThrow();
  });
});

describe("config object coherence", () => {
  const configs = [
    KI_FUEHRERSCHEIN_CONFIG,
    EU_AI_ACT_KURS_CONFIG,
    AI_NATIVE_CONFIG,
    KI_UND_GESELLSCHAFT_CONFIG,
  ];

  it("each config's slug matches its registry key", () => {
    for (const config of configs) {
      expect(getCourseConfig(config.slug)).toBe(config);
    }
  });

  it("coursePath is nested under basePath for every course", () => {
    for (const config of configs) {
      expect(config.coursePath.startsWith(config.basePath)).toBe(true);
    }
  });

  it("has no em/en dashes in any course copy (CI rule)", () => {
    for (const config of configs) {
      const copy = [
        config.title,
        config.certificateTitle,
        config.certificateSubtitle,
        config.certificateReferenceLabel,
        config.quizPassMessage,
        ...config.certificateModules,
      ].join(" ");
      // Detect em-dash (U+2014) / en-dash (U+2013) via escapes so this file
      // stays free of literal long dashes while still guarding against them.
      expect([...copy].some((ch) => ch === "\u2014" || ch === "\u2013")).toBe(false);
    }
  });

  it("has a non-empty certificate file stem for every course", () => {
    for (const config of configs) {
      expect(config.certificateFileStem.length).toBeGreaterThan(0);
    }
  });

  it("declares a language for every registered config, 'de' for all four native courses (plan 007 stage 2)", () => {
    for (const config of configs) {
      expect(config.language).toBe("de");
    }
  });
});
