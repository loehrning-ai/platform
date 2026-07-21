import { describe, it, expect } from "vitest";
import {
  CODEX_QUIZ_COPY,
  CODEX_QUIZ_TITLE,
  CODEX_COMPARE_KIND_LABEL,
  CODEX_TASK_SPEC_TIER_LABELS,
  CODEX_FLASHCARDS_COPY,
} from "./widget-copy";

describe("codex widget-copy (plan 009 stage 3)", () => {
  it("matches codex/js/widgets.js's real English chrome, not a German translation", () => {
    expect(CODEX_QUIZ_COPY).toEqual({
      kindLabel: "Check",
      optionsAriaLabel: "Answer options",
      correctLabel: "Correct.",
      incorrectLabel: "Not quite.",
    });
    expect(CODEX_QUIZ_TITLE).toBe("Quick check");
    expect(CODEX_COMPARE_KIND_LABEL).toBe("Compare");
    expect(CODEX_TASK_SPEC_TIER_LABELS).toEqual({
      weak: "weak",
      meh: "meh",
      strong: "strong",
    });
    expect(CODEX_FLASHCARDS_COPY.kindLabel).toBe("Review");
    expect(CODEX_FLASHCARDS_COPY.ariaLabelTemplate).toContain("Flashcard");
  });

  it("contains no German-only chrome words", () => {
    const values = [
      ...Object.values(CODEX_QUIZ_COPY),
      CODEX_QUIZ_TITLE,
      CODEX_COMPARE_KIND_LABEL,
      ...Object.values(CODEX_TASK_SPEC_TIER_LABELS),
      ...Object.values(CODEX_FLASHCARDS_COPY),
    ].join(" ");
    for (const german of ["Karten", "Vergleich", "schwach", "mittel", "stark", "Richtig", "Antwortoptionen"]) {
      expect(values).not.toContain(german);
    }
  });
});
