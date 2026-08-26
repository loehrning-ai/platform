import { describe, it, expect } from "vitest";
import { gradeField, type RctfcFieldCriteria } from "./rctfc-checklist";

/**
 * rctfc-checklist.test.ts (regression coverage)
 *
 * Guards the pure rule-based grader `gradeField` behind the RCTFC-Checklist
 * exercise. Each field is graded on a minimum-length check and an optional
 * case-insensitive keyword requirement, in that order. Mirrors the sibling
 * pure-grader tests (pii-spotter / workflow-builder): real string inputs ->
 * real { passed, reason } outputs. Reason strings are asserted by substring so
 * a copy tweak keeps them green, but the pass/fail decision is asserted exactly.
 */

const crit = (over: Partial<RctfcFieldCriteria> = {}): RctfcFieldCriteria => ({
  minChars: 10,
  hint: "Hinweis zum Feld",
  ...over,
});

describe("rctfc-checklist · gradeField", () => {
  it("fails a value shorter than minChars and reports the counts", () => {
    const r = gradeField("kurz", crit({ minChars: 10 })); // 4 chars
    expect(r.passed).toBe(false);
    expect(r.reason).toContain("Zu kurz");
    expect(r.reason).toContain("(4 / min. 10");
  });

  it("trims surrounding whitespace before measuring length", () => {
    const r = gradeField("   ab   ", crit({ minChars: 5 })); // trimmed -> 2
    expect(r.passed).toBe(false);
    expect(r.reason).toContain("(2 / min. 5");
  });

  it("passes at exactly minChars (the boundary is inclusive)", () => {
    const r = gradeField("abcde", crit({ minChars: 5 })); // len 5, no keyword
    expect(r.passed).toBe(true);
    expect(r.reason).toBe("Kriterium erfüllt.");
  });

  it("passes a long-enough value when no keyword is required", () => {
    const r = gradeField(
      "Eine ausreichend lange Antwort.",
      crit({ minChars: 10 }),
    );
    expect(r.passed).toBe(true);
  });

  it("fails when the required keyword is absent and names the keyword", () => {
    const r = gradeField(
      "Genug Zeichen sind vorhanden hier.",
      crit({ minChars: 5, mustInclude: "Fachanwalt" }),
    );
    expect(r.passed).toBe(false);
    expect(r.reason).toContain("Fachanwalt");
    expect(r.reason).toContain("erwähnen");
  });

  it("matches the required keyword case-insensitively", () => {
    const r = gradeField(
      "Bitte den FACHANWALT frühzeitig einbeziehen.",
      crit({ minChars: 5, mustInclude: "fachanwalt" }),
    );
    expect(r.passed).toBe(true);
    expect(r.reason).toBe("Kriterium erfüllt.");
  });

  it("checks length before the keyword (a short value fails on length)", () => {
    // The value contains the keyword, but is below minChars, so length wins.
    const r = gradeField("ab", crit({ minChars: 5, mustInclude: "ab" }));
    expect(r.passed).toBe(false);
    expect(r.reason).toContain("Zu kurz");
  });
});
