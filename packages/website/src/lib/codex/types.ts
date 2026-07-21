// ─── Codex Course types ──────────────────────────
//
// Own separate content module, keyed by the source's own flat lesson-id
// scheme ("L01".."L12", matching `codex/js/lessons/L01.js`..`L12.js` and the
// `data-bespoke="L01"` mount points in the source HTML) — NOT the shared
// BlockId JSON system, mirroring `lib/claude-course`'s precedent of
// extending `BaseLesson` with a course-specific container id. Content loads
// per-lesson via dynamic `import()` (see ./data), not one eagerly-imported
// module.
//
// Unlike claude-course's plain-markdown sections, codex's source HTML
// repeats four distinct non-widget presentational patterns throughout every
// lesson (prose, pull-quote, callout, card-grid) that don't collapse
// cleanly onto flowing markdown (the card-grid especially: a 3-column card
// layout has no markdown equivalent). `CodexBlock` represents these
// structurally so `CodexLessonReader` can render each with source-faithful
// chrome instead of losing the distinction inside one markdown string.

import type { BaseLesson, LessonSection } from "@/lib/course/types";

export const CODEX_LESSON_IDS = [
  "L01",
  "L02",
  "L03",
  "L04",
  "L05",
  "L06",
  "L07",
  "L08",
  "L09",
  "L10",
  "L11",
  "L12",
] as const;

export type LessonId = (typeof CODEX_LESSON_IDS)[number];

export function isCodexLessonId(value: unknown): value is LessonId {
  return (
    typeof value === "string" &&
    (CODEX_LESSON_IDS as readonly string[]).includes(value)
  );
}

export const CODEX_TRACK_IDS = [
  "fundamentals",
  "task-craft",
  "in-the-loop",
  "advanced",
] as const;

export type Track = (typeof CODEX_TRACK_IDS)[number];

export interface CodexTrack {
  readonly id: Track;
  /** Numbered heading, e.g. "Track 01 — Fundamentals". */
  readonly label: string;
  /** Thematic title, e.g. "The mental model". */
  readonly title: string;
  readonly hint: string;
}

/** Four tracks, ported verbatim from `codex/js/lessons.js`'s `window.TRACKS`. */
export const CODEX_TRACKS: readonly CodexTrack[] = [
  {
    id: "fundamentals",
    label: "Track 01, Fundamentals",
    title: "The mental model",
    hint: "Three lessons on what Codex is and how it sees your repo.",
  },
  {
    id: "task-craft",
    label: "Track 02, Task Craft",
    title: "Writing tasks that work",
    hint: "Where most of the quality lives. Spec it right, ship it right.",
  },
  {
    id: "in-the-loop",
    label: "Track 03, In the Loop",
    title: "Working with the agent",
    hint: "Review, iterate, give it the tools it needs to finish the job.",
  },
  {
    id: "advanced",
    label: "Track 04, Advanced",
    title: "Scale it into your workflow",
    hint: "Parallel agents, proven patterns, and the daily loop.",
  },
];

// ─── CodexBlock — recurring non-widget presentational patterns ─────

export interface CodexProseBlock {
  readonly kind: "prose";
  /** Markdown content, rendered via the shared MarkdownRenderer. */
  readonly markdown: string;
}

/** Source `.pull-quote`: a large centered decorative quote between prose. */
export interface CodexPullQuoteBlock {
  readonly kind: "pull-quote";
  readonly text: string;
}

/** Source `.callout`: an icon-prefixed bordered box, e.g. "The contract rule." */
export interface CodexCalloutBlock {
  readonly kind: "callout";
  readonly title?: string;
  readonly body: string;
}

export interface CodexCardGridCard {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}

/** Source `.grid-3` / `.card`: a 3-column card grid. */
export interface CodexCardGridBlock {
  readonly kind: "card-grid";
  readonly cards: readonly CodexCardGridCard[];
}

export type CodexBlock =
  | CodexProseBlock
  | CodexPullQuoteBlock
  | CodexCalloutBlock
  | CodexCardGridBlock;

/**
 * CodexSection extends the shared LessonSection (so `sections: readonly
 * CodexSection[]` stays assignable to BaseLesson's `readonly LessonSection[]`)
 * and adds the structured `blocks` the reader actually renders. `content`
 * is a derived plain-markdown fallback (the concatenation of every prose
 * block), kept for compatibility with any generic LessonSection consumer.
 */
export interface CodexSection extends LessonSection {
  readonly blocks: readonly CodexBlock[];
}

/**
 * CodexLesson: folds into the shared `BaseLesson` (keyConcepts/widgets) and
 * adds the two Codex-Course-specific fields: which of the 4 tracks it
 * belongs to, and the one-line hook shown on its lesson card. `quiz` stays
 * `[]` for every lesson: the source course has no separate end-of-lesson
 * quiz block, every `Quiz` mount IS the lesson's quiz content, represented
 * as a `"quiz"` kind widget instead (see ./lessons/*.ts).
 */
export interface CodexLesson extends BaseLesson {
  readonly id: LessonId;
  readonly sections: readonly CodexSection[];
  readonly trackId: Track;
  readonly hook: string;
}
