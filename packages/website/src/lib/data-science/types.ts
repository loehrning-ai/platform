// ─── Data Science course types ────────────────────
//
// Own separate content module (mirroring `lib/ai-native`'s precedent), keyed
// by the source's own flat chapter-id scheme ("home".."cap", matching
// `src/v8/App.js`'s `CHAPTERS` array), NOT the shared BlockId JSON system.
// This course has no track/module grouping in source — 13 chapters, flat
// (Overview + 12 numbered chapters).
//
// Route split: "home" (the Overview) renders at the course root
// `page.tsx`, not as a `[chapterSlug]` dynamic-route entry — the numbered
// chapters ("fund".."cap") are the only 12 slugs `generateStaticParams`
// returns (Done Criteria: no home route collision).

import type { BaseLesson, LessonSection } from "@/lib/course/types";

export const DS_CHAPTER_IDS = [
  "home",
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
  "deploy",
  "cap",
] as const;

export type DsChapterId = (typeof DS_CHAPTER_IDS)[number];

export function isDsChapterId(value: unknown): value is DsChapterId {
  return (
    typeof value === "string" &&
    (DS_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

/** The 12 numbered chapters routed under `[chapterSlug]` — excludes "home". */
export const DS_NUMBERED_CHAPTER_IDS = [
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
  "deploy",
  "cap",
] as const;

export type DsNumberedChapterId = (typeof DS_NUMBERED_CHAPTER_IDS)[number];

export function isDsNumberedChapterId(
  value: unknown,
): value is DsNumberedChapterId {
  return (
    typeof value === "string" &&
    (DS_NUMBERED_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

/** Per-chapter metadata, ported verbatim from `App.js`'s `CHAPTERS` array. */
export interface ChapterMeta {
  readonly id: DsChapterId;
  /** 0-based order, matching source array position. */
  readonly number: number;
  /** Source's own display label ("—", "01".."12"). */
  readonly displayNumber: string;
  readonly title: string;
  readonly subtitle: string;
  /** Parsed from source's "N min" string. */
  readonly estimatedMinutes: number;
}

/**
 * Verbatim port of `App.js`'s `CHAPTERS` array. Cheap and eager (unlike the
 * heavier per-chapter body content in ./chapters, which loads via
 * per-chapter dynamic `import()`).
 */
export const DS_CHAPTERS: readonly ChapterMeta[] = [
  { id: "home", number: 0, displayNumber: "—", title: "Overview", subtitle: "The whole DS loop, animated", estimatedMinutes: 3 },
  { id: "fund", number: 1, displayNumber: "01", title: "Fundamentals", subtitle: "Sample vs population, the loop", estimatedMinutes: 7 },
  { id: "explore", number: 2, displayNumber: "02", title: "Explore", subtitle: "Distributions · outliers · corr", estimatedMinutes: 8 },
  { id: "clean", number: 3, displayNumber: "03", title: "Clean", subtitle: "Missingness · scaling · leakage", estimatedMinutes: 7 },
  { id: "feature", number: 4, displayNumber: "04", title: "Feature", subtitle: "Encoding · interactions · leak", estimatedMinutes: 8 },
  { id: "model", number: 5, displayNumber: "05", title: "Model", subtitle: "Bias/variance live", estimatedMinutes: 9 },
  { id: "eval", number: 6, displayNumber: "06", title: "Evaluate", subtitle: "Confusion · threshold · ROC/PR", estimatedMinutes: 8 },
  { id: "interp", number: 7, displayNumber: "07", title: "Interpret", subtitle: "SHAP · feature importance", estimatedMinutes: 7 },
  { id: "exp", number: 8, displayNumber: "08", title: "Experiment", subtitle: "A/B · power · MDE", estimatedMinutes: 9 },
  { id: "causal", number: 9, displayNumber: "09", title: "Causal", subtitle: "DAGs · confounders · backdoors", estimatedMinutes: 8 },
  { id: "peek", number: 10, displayNumber: "10", title: "Peeking & CUPED", subtitle: "How p-values lie", estimatedMinutes: 7 },
  { id: "deploy", number: 11, displayNumber: "11", title: "Deploy", subtitle: "Drift · monitoring · retrain", estimatedMinutes: 7 },
  { id: "cap", number: 12, displayNumber: "12", title: "Capstone", subtitle: "The full loop, end to end", estimatedMinutes: 12 },
];

export function getDsChapterMeta(id: DsChapterId): ChapterMeta {
  const meta = DS_CHAPTERS.find((c) => c.id === id);
  if (!meta) {
    throw new Error(`Unknown data-science chapter id "${id}".`);
  }
  return meta;
}

/**
 * DsChapter: folds into the shared `BaseLesson` (kept for consistency with
 * every other course's content module + the shared progress/certificate
 * types, even though this course has no quiz mechanism — see below).
 * `quiz` stays `[]`: grepping all 15 source files for a "Quiz" component
 * returns nothing. `widgets` stays unset: none of this course's bespoke
 * simulators map to the shared Tier-A widget registry — every one is a
 * one-off, always-inline, RAF/SVG-driven component, deliberately kept out
 * of `src/lib/widgets/types.ts` per the plan's own scope decision.
 */
export interface DsChapter extends BaseLesson {
  readonly id: DsChapterId;
  readonly sections: readonly LessonSection[];
}
