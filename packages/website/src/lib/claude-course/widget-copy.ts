// ─── Claude Course chrome-copy overrides (plan 008 stage 3) ─────────
//
// English chrome copy for the 4 reused Tier-A widgets (quiz, drag-reorder,
// failure-tagger, redaction-drill), passed as their `copy` prop from every
// claude-course lesson so button/status text renders in English instead of
// the components' German defaults. Source strings mirror the wording used
// in `claude/js/widgets.js` and `claude/lessons/*.html` themselves.

import type { QuizWidgetCopy } from "@/components/widgets/tier-a/quiz";
import type { DragReorderWidgetCopy } from "@/components/widgets/tier-a/drag-reorder";
import type { FailureTaggerWidgetCopy } from "@/components/widgets/tier-a/failure-tagger";
import type { RedactionDrillWidgetCopy } from "@/components/widgets/tier-a/redaction-drill";

export const CLAUDE_QUIZ_COPY: QuizWidgetCopy = {
  kindLabel: "Quick check",
  optionsAriaLabel: "Answer options",
  correctLabel: "Correct.",
  incorrectLabel: "Not quite.",
};

export const CLAUDE_DRAG_REORDER_COPY: DragReorderWidgetCopy = {
  kindLabel: "Order the sections",
  shuffleLabel: "Shuffle",
  moveUpSuffix: "move up",
  moveDownSuffix: "move down",
  correctStatusLabel: "Perfect, that's the template.",
  wrongStatusLabel: "Not quite. Green rows are in the right place.",
  idleStatusLabel: "Order them, then check.",
  checkLabel: "Check order",
};

export const CLAUDE_FAILURE_TAGGER_COPY: FailureTaggerWidgetCopy = {
  kindLabel: "Eval drill",
  promptLabel: "Prompt",
  outputLabel: "Claude's output",
  tagAriaLabelPrefix: "Failure mode for:",
  correctSuffix: "correct",
  taggedSuffix: "tagged",
  submitLabel: "Check my tags",
  passedLabel: "You know what a failure looks like",
  retryPromptLabel: "Reread the mode descriptions",
  resetLabel: "Try again",
  perCaseCorrectLabel: "Correct.",
  perCaseWrongLabel: "Actually:",
};

export const CLAUDE_REDACTION_DRILL_COPY: RedactionDrillWidgetCopy = {
  kindLabel: "Drill: before you paste",
  chooseScenarioAriaLabel: "Choose scenario",
  scenarioWord: "Scenario",
  redactedTag: "<REDACTED>",
  redactedAriaPrefix: "Redacted:",
  redactedAriaSuffix: "(click to restore)",
  riskyAriaPrefix: "Risky:",
  riskyAriaSuffix: "(click to redact)",
  legendRiskyLabel: "risky, click to redact",
  legendRedactedChip: "redacted",
  legendCleanedLabel: "cleaned",
  countSuffix: "caught",
  submitLabel: "Submit paste",
  resetLabel: "Reset & try again",
  cleanStatusLabel: "Safe",
  leakStatusLabel: "Leaky",
  allScenariosCleanLabel: "Both scenarios cleaned",
  scenarioOfWord: "of",
  safeHeadline: "Safe to paste.",
  safeBodyTemplate:
    "All {n} sensitive fields caught, no false positives. This is the habit, read before you paste.",
  notSafeHeadline: "Don't send this yet.",
  missingSingularTemplate: "{n} sensitive field is still exposed (highlighted red).",
  missingPluralTemplate: "{n} sensitive fields are still exposed (highlighted red).",
  mistakesSingularTemplate:
    "You over-redacted {n} safe field, fine, but unnecessary.",
  mistakesPluralTemplate:
    "You over-redacted {n} safe fields, fine, but unnecessary.",
};
