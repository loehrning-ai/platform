import { describe, it, expect } from "vitest";
import {
  TIER_A_KINDS,
  ALL_WIDGET_KINDS,
  isTierAKind,
  isWidgetKind,
  isExerciseKind,
} from "./types";

/**
 * the Tier-A drop-in kinds () and the Tier-A+ graded
 * exercise kinds () are registered as first-class WidgetKinds and
 * recognised by the guards (so the registry render path resolves them rather
 * than hitting the "unknown kind" fallback).
 */

describe("Tier-A widget kinds", () => {
  it("registers the drop-in, Tier-A+ exercise, and diagram kinds", () => {
    expect([...TIER_A_KINDS]).toEqual([
      "quiz",
      "flashcards",
      "compare",
      "task-spec",
      "self-rate",
      "plays",
      "failure-tagger",
      "redaction-drill",
      "drag-reorder",
      // — InteractiveDiagram primitive + EU-AI-Act presets.
      "interactive-diagram",
      "risk-pyramid",
      "obligation-layers",
      // — Codex Course (plan 009 stage 2): the two genuinely new widget
      // kinds, ported from codex/js/widgets.js's Terminal and Diff.
      "terminal-replay",
      "diff-viewer",
      // — AI-Native Operator Course (plan 013 stage 5): the three genuinely
      // new widget kinds, ported from ai-native-operator/course-app.js's
      // ReflectBox, MatrixEx, and Slots.
      "reflect-box",
      "matrix-grid",
      "slot-fill",
    ]);
  });

  it("includes them in ALL_WIDGET_KINDS", () => {
    for (const k of TIER_A_KINDS) {
      expect(ALL_WIDGET_KINDS).toContain(k);
    }
  });

  it("isTierAKind narrows correctly", () => {
    expect(isTierAKind("quiz")).toBe(true);
    expect(isTierAKind("flashcards")).toBe(true);
    expect(isTierAKind("failure-tagger")).toBe(true);
    expect(isTierAKind("redaction-drill")).toBe(true);
    expect(isTierAKind("drag-reorder")).toBe(true);
    expect(isTierAKind("terminal-replay")).toBe(true);
    expect(isTierAKind("diff-viewer")).toBe(true);
    expect(isTierAKind("reflect-box")).toBe(true);
    expect(isTierAKind("matrix-grid")).toBe(true);
    expect(isTierAKind("slot-fill")).toBe(true);
    expect(isTierAKind("demo-roi")).toBe(false);
    expect(isTierAKind("nope")).toBe(false);
  });

  it("isWidgetKind accepts Tier-A kinds; isExerciseKind does not", () => {
    expect(isWidgetKind("task-spec")).toBe(true);
    expect(isExerciseKind("task-spec")).toBe(false);
  });
});
