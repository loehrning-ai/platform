import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { computeResult } from "./scoring";
import { FOUNDATION_THRESHOLD, recommend } from "./recommend";
import type { Answer, DimensionId } from "./types";

function makeAnswers(
  perDim: Partial<Record<DimensionId, number>> = {},
  fallback = 1,
): Answer[] {
  return QUESTIONS.map((q) => ({
    questionId: q.id,
    dimensionId: q.dimensionId,
    score: perDim[q.dimensionId] ?? fallback,
  }));
}

function recommendFor(
  perDim: Partial<Record<DimensionId, number>>,
  fallback = 1,
) {
  return recommend(computeResult(makeAnswers(perDim, fallback)));
}

describe("recommend", () => {
  it("routes a complete beginner to the KI-Führerschein (foundation)", () => {
    const rec = recommendFor({}, 1);
    expect(rec.kind).toBe("foundation");
    expect(rec.slug).toBe("ki-fuehrerschein");
    expect(rec.courseHref).toBe("/ki-fuehrerschein");
    expect(rec.focusDimensionId).toBe("grundlagen");
    expect(rec.reasoning.length).toBeGreaterThan(0);
    expect(rec.reasoning).toContain("KI-Führerschein");
  });

  it("forces the foundation course while grundlagen is below the threshold", () => {
    // grundlagen at score 2 (~33) is below FOUNDATION_THRESHOLD even though
    // everything else is worse.
    const rec = recommendFor({ grundlagen: 2 }, 1);
    expect(rec.kind).toBe("foundation");
    expect(rec.slug).toBe("ki-fuehrerschein");
  });

  it("routes a solid grundlagen with a recht gap to the EU AI Act course", () => {
    const rec = recommendFor({ recht: 1 }, 4);
    expect(rec.kind).toBe("gap");
    expect(rec.slug).toBe("eu-ai-act-kurs");
    expect(rec.focusDimensionId).toBe("recht");
  });

  it("routes a praxis gap to the AI-Native course", () => {
    const rec = recommendFor({ praxis: 1 }, 4);
    expect(rec.slug).toBe("ai-native");
    expect(rec.focusDimensionId).toBe("praxis");
  });

  it("routes an urteil gap to KI und Gesellschaft", () => {
    const rec = recommendFor({ urteil: 1 }, 4);
    expect(rec.slug).toBe("ki-und-gesellschaft");
    expect(rec.focusDimensionId).toBe("urteil");
  });

  it("routes a verantwortung gap to the EU AI Act course", () => {
    const rec = recommendFor({ verantwortung: 1 }, 4);
    expect(rec.slug).toBe("eu-ai-act-kurs");
    expect(rec.focusDimensionId).toBe("verantwortung");
  });

  it("never returns grundlagen as a gap focus when the basics are solid", () => {
    // grundlagen is the single weakest but still above the threshold.
    const rec = recommendFor({ grundlagen: 3 }, 4);
    expect(rec.kind).toBe("gap");
    expect(rec.focusDimensionId).not.toBe("grundlagen");
  });

  it("carries a badge, an icon name and a kupfer accent for the core course", () => {
    const rec = recommendFor({}, 1);
    expect(rec.badge.length).toBeGreaterThan(0);
    expect(rec.iconName.length).toBeGreaterThan(0);
    expect(rec.accent).toBe("kupfer");
    expect(rec.startHref.length).toBeGreaterThan(0);
  });

  it("keeps FOUNDATION_THRESHOLD at the solid boundary", () => {
    expect(FOUNDATION_THRESHOLD).toBe(50);
  });

  it("localizes the English recommendation title, paths, badge, and reasoning", () => {
    const result = computeResult(makeAnswers({}, 1));
    const rec = recommend(result, "en");

    expect(rec.courseTitle).toBe("AI Fundamentals");
    expect(rec.courseHref).toBe("/en/ki-fuehrerschein");
    expect(rec.startHref).toBe("/en/ki-fuehrerschein/kurs");
    expect(rec.badge).toContain("DE + EN");
    expect(rec.badge).toContain("participation record");
    expect(rec.reasoning).toContain("AI Fundamentals");
    expect(rec.reasoning).not.toMatch(/\b(?:Du|dein|Kurs)\b/);
  });
});
