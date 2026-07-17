// KI-Check — deterministic scoring.
//
// Pure functions, no React, no side effects. Given the recorded Likert answers
// the module derives a per-dimension normalized score (0-100), a five-rung
// stage for each dimension and for the composite, plus the strengths and gaps.
// Mirrors the business ki-readiness engine's shape but self-contained: no
// scraped convergence, no blindspots, no benchmarks.

import {
  DIMENSION_ORDER,
  QUESTIONS,
  RATING_BANDS,
  STAGE_BANDS,
  dimensionMetaFor,
} from "./questions";
import type {
  Answer,
  DimensionId,
  DimensionResult,
  KiCheckResult,
  RatingBand,
  StageBand,
  StageLevel,
} from "./types";

const MIN_LIKERT = 1;
const MAX_LIKERT = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Number of questions belonging to a dimension. */
function questionCountFor(dimensionId: DimensionId): number {
  return QUESTIONS.filter((q) => q.dimensionId === dimensionId).length;
}

/**
 * Project a raw Likert sum onto 0-100 for a dimension with `questionCount`
 * questions. A sum of `count * 1` maps to 0, a sum of `count * 4` maps to 100.
 */
export function normalizeRaw(raw: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  const min = questionCount * MIN_LIKERT;
  const max = questionCount * MAX_LIKERT;
  const clamped = clamp(raw, min, max);
  return round1(((clamped - min) / (max - min)) * 100);
}

/** Five-rung stage from a 0-100 score using 20-point bands. */
export function stageForScore(score: number): StageLevel {
  if (score < 20) return 1;
  if (score < 40) return 2;
  if (score < 60) return 3;
  if (score < 80) return 4;
  return 5;
}

export function stageBandFor(score: number): StageBand {
  const level = stageForScore(score);
  return STAGE_BANDS[level - 1];
}

export function ratingFor(normalizedScore: number): RatingBand {
  for (const band of RATING_BANDS) {
    if (normalizedScore >= band.min && normalizedScore < band.max) {
      return band;
    }
  }
  // Exactly 100 (or any overflow) falls into the top band.
  return RATING_BANDS[RATING_BANDS.length - 1];
}

function computeDimension(
  dimensionId: DimensionId,
  answers: readonly Answer[],
): DimensionResult {
  const meta = dimensionMetaFor(dimensionId);
  const total = questionCountFor(dimensionId);
  const rawScore = answers.reduce((sum, a) => sum + a.score, 0);
  const maxRaw = total * MAX_LIKERT;
  const normalizedScore = normalizeRaw(rawScore, total);
  const rating = ratingFor(normalizedScore);

  return {
    id: dimensionId,
    name: meta.name,
    short: meta.short,
    accent: meta.accent,
    iconName: meta.iconName,
    rawScore,
    maxRaw,
    normalizedScore,
    stageLevel: stageForScore(normalizedScore),
    ratingLabel: rating.label,
    ratingToneVar: rating.toneVar,
  };
}

/**
 * Compute the full result from the recorded answers. Answers are grouped by
 * dimension; unknown question ids are ignored. Unanswered questions simply
 * lower the raw sum, so a partially answered check still returns a valid shape.
 */
export function computeResult(answers: readonly Answer[]): KiCheckResult {
  const byDimension = new Map<DimensionId, Answer[]>();
  const seen = new Set<string>();
  const validIds = new Set(QUESTIONS.map((q) => q.id));

  for (const answer of answers) {
    if (!validIds.has(answer.questionId)) continue;
    if (seen.has(answer.questionId)) continue; // ignore duplicate answers
    seen.add(answer.questionId);
    const bucket = byDimension.get(answer.dimensionId) ?? [];
    bucket.push(answer);
    byDimension.set(answer.dimensionId, bucket);
  }

  const dimensions = DIMENSION_ORDER.map((id) =>
    computeDimension(id, byDimension.get(id) ?? []),
  );

  const compositeScore = round1(
    dimensions.reduce((sum, d) => sum + d.normalizedScore, 0) /
      dimensions.length,
  );
  const band = stageBandFor(compositeScore);

  const canonicalIndex = (id: DimensionId) => DIMENSION_ORDER.indexOf(id);

  // Strengths: strongest first; gaps: weakest first. Ties keep canonical order
  // in both so the display stays stable and readable.
  const strengths = [...dimensions]
    .sort(
      (a, b) =>
        b.normalizedScore - a.normalizedScore ||
        canonicalIndex(a.id) - canonicalIndex(b.id),
    )
    .slice(0, 2);
  const gaps = [...dimensions]
    .sort(
      (a, b) =>
        a.normalizedScore - b.normalizedScore ||
        canonicalIndex(a.id) - canonicalIndex(b.id),
    )
    .slice(0, 2);

  return {
    answeredCount: seen.size,
    totalQuestions: QUESTIONS.length,
    compositeScore,
    stageLevel: band.level,
    stageLabel: band.label,
    stageBlurb: band.blurb,
    dimensions,
    strengths,
    gaps,
  };
}
