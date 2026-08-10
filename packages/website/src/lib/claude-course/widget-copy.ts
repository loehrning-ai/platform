// ─── Claude Course chrome-copy overrides ─────────
//
// English chrome copy for four reused Tier-A widgets (quiz, drag-reorder,
// failure-tagger, redaction-drill). Every English Claude lesson passes these
// overrides so the shared components do not fall back to German copy.

import type { QuizWidgetCopy } from "@/components/widgets/tier-a/quiz";
import type { DragReorderWidgetCopy } from "@/components/widgets/tier-a/drag-reorder";
import type { FailureTaggerWidgetCopy } from "@/components/widgets/tier-a/failure-tagger";
import type { RedactionDrillWidgetCopy } from "@/components/widgets/tier-a/redaction-drill";
import type {
  SemanticSpaceCopy,
  Point as SemanticSpacePoint,
  Cluster as SemanticSpaceCluster,
  QuadrantLabel as SemanticSpaceQuadrantLabel,
} from "@/components/widgets/practice/semantic-space";

export const CLAUDE_QUIZ_COPY: QuizWidgetCopy = {
  kindLabel: "Quick check",
  optionsAriaLabel: "Answer options",
  correctLabel: "Correct.",
  incorrectLabel: "Not quite.",
};

/**
 * QuizWidget's `title` is a separate prop from `copy` (an existing per-instance
 * override, not course-wide chrome: see the redaction-drill instance in
 * content/ki-fuehrerschein/block-2-datenschutz-lessons.json for a real
 * bespoke-title precedent), so it defaults to the German "Schneller Check"
 * independently of `copy`. Every claude-course quiz instance must pass this
 * explicitly alongside `copy: CLAUDE_QUIZ_COPY`.
 */
export const CLAUDE_QUIZ_TITLE = "Quick Check";

export const CLAUDE_DRAG_REORDER_COPY: DragReorderWidgetCopy = {
  kindLabel: "Order the sections",
  shuffleLabel: "Shuffle",
  moveUpSuffix: "move up",
  moveDownSuffix: "move down",
  correctStatusLabel: "Matches the example order.",
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
  passedLabel: "Required classifications complete",
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
  submitLabel: "Check redaction",
  resetLabel: "Reset & try again",
  cleanStatusLabel: "Required fields redacted",
  leakStatusLabel: "Protected data remains",
  allScenariosCleanLabel: "Both scenarios cleaned",
  scenarioOfWord: "of",
  safeHeadline: "Required fields are redacted.",
  safeBodyTemplate:
    "All {n} fields defined by this exercise are redacted. Apply your actual data policy before submission.",
  notSafeHeadline: "Don't send this yet.",
  missingSingularTemplate:
    "{n} sensitive field is still exposed (highlighted red).",
  missingPluralTemplate:
    "{n} sensitive fields are still exposed (highlighted red).",
  mistakesSingularTemplate:
    "You redacted {n} non-sensitive field defined by this exercise.",
  mistakesPluralTemplate:
    "You redacted {n} non-sensitive fields defined by this exercise.",
};

// ─── SemanticSpace overrides ─────────────────────
//
// The internal cluster ids stay the component's own German ones
// (technik/vertrieb/werkstatt/verwaltung/user, never displayed), but the
// SEED points, the offline keyword-matching lists, and the quadrant overlay
// labels are all overridden with the source's real English content; the
// keyword lists are the functionally load-bearing part: without this
// override an English word like "sprint" would never match anything, since
// the component's own default keyword lists are German words.

export const CLAUDE_SEMANTIC_SPACE_SEED: readonly SemanticSpacePoint[] = [
  { w: "database", x: 0.08, y: 0.18, cluster: "technik" },
  { w: "kubernetes", x: 0.22, y: 0.14, cluster: "technik" },
  { w: "server", x: 0.1, y: 0.38, cluster: "technik" },
  { w: "commit", x: 0.25, y: 0.32, cluster: "technik" },
  { w: "pr review", x: 0.08, y: 0.58, cluster: "technik" },
  { w: "roadmap", x: 0.7, y: 0.14, cluster: "vertrieb" },
  { w: "okr", x: 0.86, y: 0.22, cluster: "vertrieb" },
  { w: "stakeholder", x: 0.68, y: 0.38, cluster: "vertrieb" },
  { w: "kickoff", x: 0.88, y: 0.44, cluster: "vertrieb" },
  { w: "espresso", x: 0.4, y: 0.74, cluster: "werkstatt" },
  { w: "latte", x: 0.56, y: 0.78, cluster: "werkstatt" },
  { w: "cortado", x: 0.46, y: 0.9, cluster: "werkstatt" },
  { w: "grinder", x: 0.62, y: 0.92, cluster: "werkstatt" },
  { w: "violin", x: 0.1, y: 0.78, cluster: "verwaltung" },
  { w: "sonata", x: 0.22, y: 0.9, cluster: "verwaltung" },
  { w: "concerto", x: 0.08, y: 0.92, cluster: "verwaltung" },
];

export const CLAUDE_SEMANTIC_SPACE_KEYWORDS: Record<
  Exclude<SemanticSpaceCluster, "user">,
  readonly string[]
> = {
  technik: [
    "database",
    "kubernetes",
    "server",
    "commit",
    "pr review",
    "algorithm",
    "sprint",
    "deploy",
    "api",
    "cache",
    "compiler",
    "kernel",
    "docker",
    "merge",
  ],
  vertrieb: [
    "roadmap",
    "okr",
    "stakeholder",
    "kickoff",
    "backlog",
    "milestone",
    "standup",
    "retro",
    "scope",
  ],
  werkstatt: [
    "espresso",
    "latte",
    "cortado",
    "grinder",
    "cappuccino",
    "mocha",
    "brew",
    "beans",
    "flat white",
  ],
  verwaltung: [
    "violin",
    "sonata",
    "concerto",
    "cello",
    "piano",
    "fugue",
    "symphony",
    "opera",
    "tempo",
    "melody",
  ],
};

export const CLAUDE_SEMANTIC_SPACE_QUADRANT_LABELS: readonly SemanticSpaceQuadrantLabel[] =
  [
    { label: "tech", x: 16, y: 4 },
    { label: "product", x: 82, y: 4 },
    { label: "music", x: 16, y: 68 },
    { label: "coffee", x: 58, y: 68 },
  ];

export const CLAUDE_SEMANTIC_SPACE_CLUSTER_LABELS: Record<
  Exclude<SemanticSpaceCluster, "user">,
  string
> = {
  technik: "tech",
  vertrieb: "product",
  werkstatt: "coffee",
  verwaltung: "music",
};

export const CLAUDE_SEMANTIC_SPACE_COPY: SemanticSpaceCopy = {
  kindLabel: "Local illustration",
  canvasAriaLabel: "Semantic space with placed words",
  placeholder: "Try: sprint, cappuccino, algorithm, cello…",
  inputAriaLabel: "New word",
  placingLabel: "Placing…",
  placeLabel: "Place in space →",
  landedNearText: "landed near",
  emptyStatusText: "Enter a word to run the local topic-matching rule.",
  nearPlacedTemplate: "the local keyword list maps it to the {cluster} group.",
  heuristicTemplate:
    "no keyword matched, so the local fallback selected this group.",
};
