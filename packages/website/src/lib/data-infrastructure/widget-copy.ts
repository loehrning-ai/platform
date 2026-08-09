// ─── Data Infrastructure chrome-copy overrides ───
//
// English chrome copy for the reused Tier-A widgets (`quiz`/`flashcards`),
// mirroring `lib/codex/widget-copy.ts`'s precedent. Source strings ported
// verbatim from `js/widgets.js`'s `Quiz`/`Flashcards` functions — this
// course's own `widgets.js` docstring ("Widgets — vanilla JS. Quiz +
// Flashcards.") is the direct port source for these two constants.

import type { QuizWidgetCopy } from "@/components/widgets/tier-a/quiz";
import type { FlashcardsWidgetCopy } from "@/components/widgets/tier-a/flashcards";

export const DATA_INFRA_QUIZ_COPY: QuizWidgetCopy = {
  kindLabel: "Check",
  optionsAriaLabel: "Answer options",
  correctLabel: "Correct.",
  incorrectLabel: "Not quite.",
};

/** Matches the source's own default: `opts.title || 'Quick check'`. */
export const DATA_INFRA_QUIZ_TITLE = "Quick check";

/**
 * Matches `js/widgets.js`'s Flashcards verbatim, including its own
 * "Activate to reveal the answer" aria wording (not codex's "Press Space or
 * click to flip" — the two source courses phrase this differently).
 */
export const DATA_INFRA_FLASHCARDS_COPY: FlashcardsWidgetCopy = {
  kindLabel: "Review",
  revealHint: "Click or press Enter to reveal ↻",
  backLabel: "Answer",
  flipBackHint: "Click or press Enter to flip back",
  prevLabel: "← Prev",
  nextLabel: "Next →",
  emptyLabel: "No cards available.",
  ariaLabelTemplate:
    "Flashcard {current} of {total}. Activate to reveal the answer.",
};
