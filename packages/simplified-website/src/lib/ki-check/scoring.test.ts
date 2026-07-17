import { describe, expect, it } from "vitest";
import { QUESTIONS, DIMENSION_ORDER } from "./questions";
import {
  computeResult,
  normalizeRaw,
  ratingFor,
  stageBandFor,
  stageForScore,
} from "./scoring";
import type { Answer, DimensionId } from "./types";

/**
 * Build a full answer set. `perDim` overrides the Likert score used for both
 * questions of a dimension; anything unset uses `fallback`.
 */
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

describe("normalizeRaw", () => {
  it("maps the minimum raw sum to 0 and the maximum to 100", () => {
    expect(normalizeRaw(2, 2)).toBe(0); // 2 questions, both score 1
    expect(normalizeRaw(8, 2)).toBe(100); // both score 4
  });

  it("maps the midpoint to 50 and rounds to one decimal", () => {
    expect(normalizeRaw(5, 2)).toBe(50);
    expect(normalizeRaw(6, 2)).toBe(66.7);
  });

  it("clamps out-of-range sums and guards zero questions", () => {
    expect(normalizeRaw(0, 2)).toBe(0);
    expect(normalizeRaw(99, 2)).toBe(100);
    expect(normalizeRaw(4, 0)).toBe(0);
  });
});

describe("stageForScore", () => {
  it("uses 20-point bands with the lower bound belonging to the higher stage", () => {
    expect(stageForScore(0)).toBe(1);
    expect(stageForScore(19.9)).toBe(1);
    expect(stageForScore(20)).toBe(2);
    expect(stageForScore(40)).toBe(3);
    expect(stageForScore(60)).toBe(4);
    expect(stageForScore(80)).toBe(5);
    expect(stageForScore(100)).toBe(5);
  });

  it("stageBandFor returns the matching band label", () => {
    expect(stageBandFor(0).label).toBe("Neugierig");
    expect(stageBandFor(100).label).toBe("Souverän");
  });
});

describe("ratingFor", () => {
  it("labels the four rating bands", () => {
    expect(ratingFor(0).label).toBe("Startpunkt");
    expect(ratingFor(24.9).label).toBe("Startpunkt");
    expect(ratingFor(25).label).toBe("Im Aufbau");
    expect(ratingFor(50).label).toBe("Solide");
    expect(ratingFor(75).label).toBe("Stark");
    expect(ratingFor(100).label).toBe("Stark");
  });
});

describe("computeResult", () => {
  it("scores an all-minimum run as composite 0 / stage 1", () => {
    const result = computeResult(makeAnswers({}, 1));
    expect(result.compositeScore).toBe(0);
    expect(result.stageLevel).toBe(1);
    expect(result.stageLabel).toBe("Neugierig");
    expect(result.answeredCount).toBe(QUESTIONS.length);
    expect(result.totalQuestions).toBe(QUESTIONS.length);
    for (const dim of result.dimensions) {
      expect(dim.normalizedScore).toBe(0);
      expect(dim.stageLevel).toBe(1);
      expect(dim.ratingLabel).toBe("Startpunkt");
    }
  });

  it("scores an all-maximum run as composite 100 / stage 5", () => {
    const result = computeResult(makeAnswers({}, 4));
    expect(result.compositeScore).toBe(100);
    expect(result.stageLevel).toBe(5);
    expect(result.stageLabel).toBe("Souverän");
    for (const dim of result.dimensions) {
      expect(dim.normalizedScore).toBe(100);
      expect(dim.ratingLabel).toBe("Stark");
    }
  });

  it("scores an all-3 run as composite 66.7 / stage 4", () => {
    const result = computeResult(makeAnswers({}, 3));
    expect(result.compositeScore).toBe(66.7);
    expect(result.stageLevel).toBe(4);
    expect(result.stageLabel).toBe("Sicher");
  });

  it("returns dimensions in canonical order", () => {
    const result = computeResult(makeAnswers({}, 2));
    expect(result.dimensions.map((d) => d.id)).toEqual([...DIMENSION_ORDER]);
  });

  it("ranks strengths (strongest first) and gaps (weakest first)", () => {
    const result = computeResult(
      makeAnswers(
        {
          grundlagen: 4, // 100
          praxis: 4, // 100
          recht: 1, // 0
          urteil: 1, // 0
          verantwortung: 2, // ~33
        },
        1,
      ),
    );
    // Strengths: the two 100s, ranked by canonical order on the tie.
    expect(result.strengths.map((d) => d.id)).toEqual(["grundlagen", "praxis"]);
    // Gaps: the two 0s (weakest first, canonical order on tie).
    expect(result.gaps.map((d) => d.id)).toEqual(["urteil", "recht"]);
  });

  it("ignores duplicate and unknown answers", () => {
    const base = makeAnswers({}, 4);
    const noisy: Answer[] = [
      ...base,
      { questionId: "g1", dimensionId: "grundlagen", score: 1 }, // duplicate, ignored
      { questionId: "does-not-exist", dimensionId: "praxis", score: 1 }, // unknown, ignored
    ];
    const result = computeResult(noisy);
    expect(result.answeredCount).toBe(QUESTIONS.length);
    const grundlagen = result.dimensions.find((d) => d.id === "grundlagen");
    expect(grundlagen?.normalizedScore).toBe(100); // first g1 answer (4) kept
  });

  it("handles an empty answer set without throwing", () => {
    const result = computeResult([]);
    expect(result.answeredCount).toBe(0);
    expect(result.compositeScore).toBe(0);
    expect(result.dimensions).toHaveLength(DIMENSION_ORDER.length);
  });
});
