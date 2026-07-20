import { describe, it, expect } from "vitest";
import {
  isWidgetKind,
  isExerciseKind,
  isDemoKind,
  isWidgetPlacement,
  ALL_WIDGET_KINDS,
  DEMO_KINDS,
  EXERCISE_KINDS,
  WIDGET_PLACEMENTS,
  AI_NATIVE_STORAGE_KEY,
  AI_NATIVE_SCHEMA_VERSION,
} from "./types";

describe("ai-native types — guards", () => {
  it("isWidgetKind accepts all registered kinds", () => {
    ALL_WIDGET_KINDS.forEach((kind) => {
      expect(isWidgetKind(kind)).toBe(true);
    });
  });

  it("isWidgetKind rejects unknown strings", () => {
    expect(isWidgetKind("demo-unknown")).toBe(false);
    expect(isWidgetKind("")).toBe(false);
    expect(isWidgetKind("EXERCISE-FIX-PROMPT")).toBe(false); // case-sensitive
  });

  it("isWidgetKind rejects non-string values", () => {
    expect(isWidgetKind(null)).toBe(false);
    expect(isWidgetKind(undefined)).toBe(false);
    expect(isWidgetKind(42)).toBe(false);
    expect(isWidgetKind({})).toBe(false);
  });

  it("isDemoKind and isExerciseKind are mutually exclusive; Tier-A kinds are neither", () => {
    // Since shared course architecture, ALL_WIDGET_KINDS also includes the course-agnostic
    // Tier-A drop-ins (quiz/flashcards/...), which are neither demo nor exercise.
    const demoSet = new Set(DEMO_KINDS);
    const exerciseSet = new Set(EXERCISE_KINDS);
    ALL_WIDGET_KINDS.forEach((k) => {
      const isDemo = isDemoKind(k);
      const isExercise = isExerciseKind(k);
      // a kind is at most one of demo / exercise (never both)
      expect(isDemo && isExercise).toBe(false);
      if (isDemo) expect(demoSet.has(k as never)).toBe(true);
      else if (isExercise) expect(exerciseSet.has(k as never)).toBe(true);
      else {
        // neither → it is a Tier-A kind
        expect(demoSet.has(k as never)).toBe(false);
        expect(exerciseSet.has(k as never)).toBe(false);
      }
    });
  });

  it("isWidgetPlacement accepts all registered placements", () => {
    WIDGET_PLACEMENTS.forEach((p) => {
      expect(isWidgetPlacement(p)).toBe(true);
    });
  });

  it("isWidgetPlacement rejects unknowns", () => {
    expect(isWidgetPlacement("after-section-3")).toBe(false);
    expect(isWidgetPlacement("")).toBe(false);
    expect(isWidgetPlacement(null)).toBe(false);
  });
});

describe("ai-native types — constants", () => {
  it("storage key and schema version are as expected", () => {
    expect(AI_NATIVE_STORAGE_KEY).toBe("ai-native-progress-v1");
    expect(AI_NATIVE_SCHEMA_VERSION).toBe(1);
  });

  it("has 12 demos and 8 exercises", () => {
    expect(DEMO_KINDS.length).toBe(12);
    expect(EXERCISE_KINDS.length).toBe(8);
  });

  it("widget placements has exactly 3 slots", () => {
    expect(WIDGET_PLACEMENTS.length).toBe(3);
    expect(WIDGET_PLACEMENTS).toEqual(["after-intro", "before-quiz", "end"]);
  });
});
