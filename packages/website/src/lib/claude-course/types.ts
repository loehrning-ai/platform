// ─── Claude Course types (plan 008 stage 2) ─────────────────────────
//
// Own separate content module, keyed by a flat lesson-id scheme (NOT the
// shared BlockId JSON system) — mirroring `lib/ai-native`'s precedent of
// extending `BaseLesson` with a course-specific container id. Content loads
// per-lesson via dynamic `import()` (see ./data), not one eagerly-imported
// module, so no lesson route's bundle pays for a sibling lesson's content.

import type { BaseLesson } from "@/lib/course/types";

export const CLAUDE_TRACK_IDS = [
  "foundations",
  "workflows",
  "advanced",
  "team",
] as const;

export type ClaudeTrackId = (typeof CLAUDE_TRACK_IDS)[number];

export interface ClaudeTrack {
  readonly id: ClaudeTrackId;
  readonly label: string;
  readonly hint: string;
}

/** Four tracks, ported verbatim from `claude/js/lessons.js`'s `window.TRACKS`. */
export const CLAUDE_TRACKS: readonly ClaudeTrack[] = [
  {
    id: "foundations",
    label: "Foundations",
    hint: "Start here. Mental model and the craft of prompting.",
  },
  {
    id: "workflows",
    label: "Everyday workflows",
    hint: "Where Claude saves you hours every week.",
  },
  {
    id: "advanced",
    label: "Going deeper",
    hint: "Agents, code review, grounding against hallucinations.",
  },
  {
    id: "team",
    label: "Team and rigor",
    hint: "Share it safely, measure it honestly.",
  },
];

/** 12 lesson ids, ported verbatim from `claude/js/lessons.js`'s `window.LESSONS`. */
export const CLAUDE_LESSON_IDS = [
  "mental-model",
  "anatomy",
  "context",
  "claude-md",
  "iteration",
  "gdocs",
  "agents",
  "reviews",
  "grounding",
  "team",
  "evals",
  "safety",
] as const;

export type ClaudeLessonId = (typeof CLAUDE_LESSON_IDS)[number];

export function isClaudeLessonId(value: unknown): value is ClaudeLessonId {
  return (
    typeof value === "string" &&
    (CLAUDE_LESSON_IDS as readonly string[]).includes(value)
  );
}

/**
 * ClaudeLesson: folds into the shared `BaseLesson` (sections/quiz/keyConcepts/
 * widgets) and adds the two Claude-Course-specific fields: which of the 4
 * tracks it belongs to, and the one-line hook shown on its lesson card.
 * `quiz` stays `[]` for every lesson: the source course has no separate
 * end-of-lesson quiz block — every `Quiz` mount IS the lesson's quiz content,
 * represented as a `"quiz"` kind widget instead (see ./lessons/*.ts).
 */
export interface ClaudeLesson extends BaseLesson {
  readonly trackId: ClaudeTrackId;
  readonly hook: string;
}
