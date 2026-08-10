// ─── Claude Course types ─────────────────────────
//
// Own separate content module, keyed by a flat lesson-id scheme (NOT the
// shared BlockId JSON system), mirroring `lib/ai-native`'s precedent of
// extending `BaseLesson` with a course-specific container id. Content loads
// per-lesson via dynamic `import()` (see ./data), not one eagerly-imported
// module, so no lesson route's bundle pays for a sibling lesson's content.

import type { BaseLesson } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";

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
export const CLAUDE_TRACKS_EN: readonly ClaudeTrack[] = [
  {
    id: "foundations",
    label: "Foundations",
    hint: "Start here. Mental model and the craft of prompting.",
  },
  {
    id: "workflows",
    label: "Everyday workflows",
    hint: "Reusable patterns for recurring work.",
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

export const CLAUDE_TRACKS_DE: readonly ClaudeTrack[] = [
  {
    id: "foundations",
    label: "Grundlagen",
    hint: "Beginne mit dem mentalen Modell und klar strukturierten Prompts.",
  },
  {
    id: "workflows",
    label: "Arbeitsabläufe",
    hint: "Wiederverwendbare Muster für regelmäßig anfallende Aufgaben.",
  },
  {
    id: "advanced",
    label: "Vertiefung",
    hint: "Agenten, Code-Reviews und Grounding gegen unbelegte Aussagen.",
  },
  {
    id: "team",
    label: "Team und Qualität",
    hint: "Prompts sicher teilen und ihre Ergebnisse nachvollziehbar prüfen.",
  },
];

export const CLAUDE_TRACKS_BY_LOCALE: Readonly<
  Record<Locale, readonly ClaudeTrack[]>
> = {
  de: CLAUDE_TRACKS_DE,
  en: CLAUDE_TRACKS_EN,
};

/** Backward-compatible name for the reviewed canonical English source. */
export const CLAUDE_TRACKS = CLAUDE_TRACKS_EN;

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
 * end-of-lesson quiz block, every `Quiz` mount IS the lesson's quiz content,
 * represented as a `"quiz"` kind widget instead (see ./lessons/*.ts).
 */
export interface ClaudeLesson extends BaseLesson {
  readonly id: ClaudeLessonId;
  readonly trackId: ClaudeTrackId;
  readonly hook: string;
}
