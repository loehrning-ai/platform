import { describe, it, expect } from "vitest";
import type { CourseSlug } from "./types";
import {
  KI_FUEHRERSCHEIN_CONFIG,
  EU_AI_ACT_KURS_CONFIG,
  AI_NATIVE_CONFIG,
  KI_UND_GESELLSCHAFT_CONFIG,
  CLAUDE_CONFIG,
  CODEX_CONFIG,
  DATA_INFRASTRUCTURE_CONFIG,
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  DATA_SCIENCE_CONFIG,
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
  it("returns exactly the nine registered course slugs (plan 012 stage 1 adds data-science)", () => {
    const slugs = [...getRegisteredCourseSlugs()].sort();
    expect(slugs).toEqual([
      "ai-native",
      "claude",
      "codex",
      "data-engineering-fundamentals",
      "data-infrastructure",
      "data-science",
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
    expect(isCourseRegistered("claude")).toBe(true);
    expect(isCourseRegistered("codex")).toBe(true);
    expect(isCourseRegistered("data-infrastructure")).toBe(true);
    expect(isCourseRegistered("data-engineering-fundamentals")).toBe(true);
    expect(isCourseRegistered("data-science")).toBe(true);
  });

  it("is false for an unregistered slug", () => {
    expect(isCourseRegistered(UNREGISTERED)).toBe(false);
  });
});

describe("CLAUDE_CONFIG (plan 008 stage 1)", () => {
  it("registers claude with English-language content and a quiz-gated cert path", () => {
    expect(getCourseConfig("claude")).toBe(CLAUDE_CONFIG);
    expect(CLAUDE_CONFIG.slug).toBe("claude");
    expect(CLAUDE_CONFIG.language).toBe("en");
    expect(CLAUDE_CONFIG.basePath).toBe("/kurse/open-source/claude");
    expect(CLAUDE_CONFIG.coursePath).toBe("/kurse/open-source/claude/kurs");
    expect(CLAUDE_CONFIG.blockIds).toEqual([]);
  });

  it("has a non-empty certificate file stem and no em/en dashes in its copy", () => {
    expect(CLAUDE_CONFIG.certificateFileStem.length).toBeGreaterThan(0);
    const copy = [
      CLAUDE_CONFIG.title,
      CLAUDE_CONFIG.certificateTitle,
      CLAUDE_CONFIG.certificateSubtitle,
      CLAUDE_CONFIG.certificateReferenceLabel,
      CLAUDE_CONFIG.quizPassMessage,
      ...CLAUDE_CONFIG.certificateModules,
    ].join(" ");
    expect([...copy].some((ch) => ch === "—" || ch === "–")).toBe(false);
  });
});

describe("CODEX_CONFIG (plan 009 stage 1)", () => {
  it("registers codex with English-language content and the all-lessons-completion cert path", () => {
    expect(getCourseConfig("codex")).toBe(CODEX_CONFIG);
    expect(CODEX_CONFIG.slug).toBe("codex");
    expect(CODEX_CONFIG.language).toBe("en");
    expect(CODEX_CONFIG.basePath).toBe("/kurse/open-source/codex");
    expect(CODEX_CONFIG.coursePath).toBe("/kurse/open-source/codex/kurs");
    expect(CODEX_CONFIG.blockIds).toEqual([]);
  });
});

describe("DATA_INFRASTRUCTURE_CONFIG (plan 010 stage 1)", () => {
  it("registers data-infrastructure with English-language content and the all-lessons-completion cert path", () => {
    expect(getCourseConfig("data-infrastructure")).toBe(DATA_INFRASTRUCTURE_CONFIG);
    expect(DATA_INFRASTRUCTURE_CONFIG.slug).toBe("data-infrastructure");
    expect(DATA_INFRASTRUCTURE_CONFIG.language).toBe("en");
    expect(DATA_INFRASTRUCTURE_CONFIG.basePath).toBe("/kurse/open-source/data-infrastructure");
    expect(DATA_INFRASTRUCTURE_CONFIG.coursePath).toBe(
      "/kurse/open-source/data-infrastructure/kurs",
    );
    expect(DATA_INFRASTRUCTURE_CONFIG.blockIds).toEqual([]);
  });
});

describe("DATA_ENGINEERING_FUNDAMENTALS_CONFIG (plan 011 stage 1)", () => {
  it("registers data-engineering-fundamentals with English-language content and the all-lessons-completion cert path", () => {
    expect(getCourseConfig("data-engineering-fundamentals")).toBe(
      DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
    );
    expect(DATA_ENGINEERING_FUNDAMENTALS_CONFIG.slug).toBe("data-engineering-fundamentals");
    expect(DATA_ENGINEERING_FUNDAMENTALS_CONFIG.language).toBe("en");
    expect(DATA_ENGINEERING_FUNDAMENTALS_CONFIG.basePath).toBe(
      "/kurse/open-source/data-engineering-fundamentals",
    );
    // Unlike codex/data-infrastructure, this course has no `/kurs`-nested
    // route at all (plan 011 stage 10 Done Criteria: chapters live directly
    // under `[chapterId]`) — coursePath must point at the real landing page,
    // not a route that 404s (plan 011 stage 14 fix).
    expect(DATA_ENGINEERING_FUNDAMENTALS_CONFIG.coursePath).toBe(
      "/kurse/open-source/data-engineering-fundamentals",
    );
    expect(DATA_ENGINEERING_FUNDAMENTALS_CONFIG.blockIds).toEqual([]);
  });
});

describe("DATA_SCIENCE_CONFIG (plan 012 stage 1)", () => {
  it("registers data-science with English-language content and the all-lessons-completion cert path", () => {
    expect(getCourseConfig("data-science")).toBe(DATA_SCIENCE_CONFIG);
    expect(DATA_SCIENCE_CONFIG.slug).toBe("data-science");
    expect(DATA_SCIENCE_CONFIG.language).toBe("en");
    expect(DATA_SCIENCE_CONFIG.basePath).toBe("/kurse/open-source/data-science");
    // Like data-engineering-fundamentals, this course has no `/kurs`-nested
    // route — chapters live directly under `[chapterSlug]`, and the
    // Overview renders at the course root — so coursePath must point at
    // the real landing page, not a route that 404s.
    expect(DATA_SCIENCE_CONFIG.coursePath).toBe("/kurse/open-source/data-science");
    expect(DATA_SCIENCE_CONFIG.blockIds).toEqual([]);
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
