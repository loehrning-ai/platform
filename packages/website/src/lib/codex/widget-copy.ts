// ─── Codex Course chrome-copy overrides (plan 009 stage 3) ──────────
//
// English chrome copy for the reused Tier-A widgets whose defaults were
// German with no (quiz) or no-until-now (compare/task-spec/flashcards)
// override mechanism. Source strings mirror `codex/js/widgets.js` and
// `codex/lessons/*.html` verbatim — codex's own widgets.js docstring cites
// itself as the ORIGINAL port source for quiz/compare/task-spec/flashcards,
// so these constants are the source's actual English chrome, not a
// translation.
//
// Found and fixed during this stage's live-browser-QA-mirroring source
// check (the same class of bug plan 008 caught only via a live QA pass):
// `compare.tsx`'s and `flashcards.tsx`'s `kindLabel` were hardcoded German
// with NO override prop at all (unlike claude's four reused widgets, which
// already had a `copy`-style mechanism from plan 008 stage 3); `task-spec.tsx`'s
// internal "schwach/mittel/stark" tier band was hardcoded German with no
// prop whatsoever. All three were extended with additive,
// default-preserving overrides in this same stage.

import type { QuizWidgetCopy } from "@/components/widgets/tier-a/quiz";
import type { FlashcardsWidgetCopy } from "@/components/widgets/tier-a/flashcards";
import type { TaskSpecTierLabels } from "@/components/widgets/tier-a/task-spec";

export const CODEX_QUIZ_COPY: QuizWidgetCopy = {
  kindLabel: "Check",
  optionsAriaLabel: "Answer options",
  correctLabel: "Correct.",
  incorrectLabel: "Not quite.",
};

/** Matches the source's own default: `opts.title || 'Quick check'`. */
export const CODEX_QUIZ_TITLE = "Quick check";

/** Matches `codex/js/widgets.js`'s Compare: `<span class="w-kind">Compare</span>`. */
export const CODEX_COMPARE_KIND_LABEL = "Compare";

/** Matches the source's tier vocabulary: `weak` / `meh` / `strong`. */
export const CODEX_TASK_SPEC_TIER_LABELS: TaskSpecTierLabels = {
  weak: "weak",
  meh: "meh",
  strong: "strong",
};

/**
 * Matches `codex/js/widgets.js`'s Flashcards verbatim, including its
 * "Flashcard N of M..." aria-label wording (not "Card").
 */
export const CODEX_FLASHCARDS_COPY: FlashcardsWidgetCopy = {
  kindLabel: "Review",
  revealHint: "Click to reveal ↻",
  backLabel: "Answer",
  flipBackHint: "Click to flip back",
  prevLabel: "← Prev",
  nextLabel: "Next →",
  emptyLabel: "No cards available.",
  ariaLabelTemplate: "Flashcard {current} of {total}. Press Space or click to flip.",
};
