// ─── Shared Widget System Types ───────────────────────────────────
//
// Course-agnostic widget schema. Promoted out of `lib/ai-native/types.ts`
// (shared course architecture) so all three courses (KI-Führerschein, EU-AI-Act-Kurs,
// AI-Native) share one registry + one type vocabulary.
//
// A Widget is the umbrella term for any embedded slot content inside a
// lesson. The two primary WidgetKinds are "demo" (stateless viz/interaction)
// and "exercise" (graded interaction with rubric).
//
// Placement is a lesson-level enum: exactly where in the reader the widget
// appears. Section-level placement was considered and rejected for v1
// simplicity — see AI-native lesson system.

/**
 * Course slugs a widget can belong to. Kept independent from
 * `lib/course` `CourseSlug` so the widget system stays decoupled until the
 * engine union is widened (shared course architecture). Includes 'ai-native' upfront
 * so a ported widget can declare its host course without churn.
 */
export const WIDGET_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ai-native",
  "claude",
  "codex",
] as const;

export type WidgetCourseSlug = (typeof WIDGET_COURSE_SLUGS)[number];

/** Widget kind identifiers — keep sorted; see registry for components. */
export const DEMO_KINDS = [
  "demo-chat-rag",
  "demo-compliance",
  "demo-roi",
  "demo-doc",
  "demo-agent",
  "demo-finetune",
  "demo-workflow",
  "demo-maturity",
  "demo-observ",
  "demo-excel",
  "demo-word",
  "demo-logistics",
] as const;

export const EXERCISE_KINDS = [
  "exercise-fix-prompt",
  "exercise-pii-spotter",
  "exercise-context-budget",
  "exercise-prompt-diff",
  "exercise-workflow-builder",
  "exercise-role-scenario",
  "exercise-rctfc-checklist",
  "exercise-free-response",
] as const;

/**
 * Tier-A drop-in widgets ported from `github.com/Mavengence/interactive-courses`
 * (shared course architecture). Course-agnostic, German copy, ExerciseShell-framed,
 * reduced-motion + keyboard-nav aware. Unlike the AI-Native `exercise-*`
 * kinds these do not call the Haiku grader — they award checkpoint XP via the
 * unified store (`useCheckpoint`).
 */
export const TIER_A_KINDS = [
  "quiz",
  "flashcards",
  "compare",
  "task-spec",
  "self-rate",
  "plays",
  // ─── Tier-A+ exercise widgets (shared course architecture) ───
  // Graded interactions ported from the GitHub course, German Mittelstand
  // scenarios, deterministic (no API). Each awards a checkpoint once.
  "failure-tagger",
  "redaction-drill",
  "drag-reorder",
  // ─── Interactive diagram primitive + presets (shared course architecture) ───
  // `InteractiveDiagram` (variant stack/flow/compare) distilled from the
  // GitHub course canvas widgets (StackFlow + LayerCake). The two presets
  // carry the canonical EU-AI-Act German content. Award a checkpoint once the
  // learner traces / inspects the diagram.
  "interactive-diagram",
  "risk-pyramid",
  "obligation-layers",
] as const;

/**
 * Practice Room widgets (shared course architecture). Optionally call live Claude via
 * `/api/ai-native/practice` (feature-flagged OFF by default). When the
 * flag/API is absent they show a deterministic STATIC quality score plus an
 * honest "Live-Modus nicht verfügbar" note. Ported from the GitHub course
 * (`claude/js/widgets.js`: PromptOrrery, PromptTransform, SemanticSpace).
 */
export const PRACTICE_KINDS = [
  "prompt-orrery",
  "prompt-transform",
  "semantic-space",
] as const;

/**
 * Claude Course native widget kinds (plan 008), ported from
 * `claude/js/widgets.js`. Unlike PRACTICE_KINDS these never call a live
 * Claude API — the source course itself never did (its own `claude-demo.js`
 * comment confirms this); all "AI" behavior is a deterministic canned
 * responder in `lib/claude-course/simulated-claude.ts`. Registered
 * incrementally as each batch of components lands (plan 008 stages 4-6).
 */
export const CLAUDE_KINDS = [
  "prompt-sandbox",
  "prompt-compare",
  "prompt-grader",
  "rewrite-arena",
  "fill-blank",
  "prompt-diff",
  "socratic-tutor",
  "agent-loop",
  "tokenizer",
  "claude-md-builder",
  "prompt-library-shaper",
] as const;

export type DemoKind = (typeof DEMO_KINDS)[number];
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];
export type TierAKind = (typeof TIER_A_KINDS)[number];
export type PracticeKind = (typeof PRACTICE_KINDS)[number];
export type ClaudeKind = (typeof CLAUDE_KINDS)[number];
export type WidgetKind = DemoKind | ExerciseKind | TierAKind | PracticeKind | ClaudeKind;

export const ALL_WIDGET_KINDS: readonly WidgetKind[] = [
  ...DEMO_KINDS,
  ...EXERCISE_KINDS,
  ...TIER_A_KINDS,
  ...PRACTICE_KINDS,
  ...CLAUDE_KINDS,
];

/** Placement slots inside a lesson. Additions require schema migration. */
export const WIDGET_PLACEMENTS = ["after-intro", "before-quiz", "end"] as const;
export type WidgetPlacement = (typeof WIDGET_PLACEMENTS)[number];

export interface Widget {
  readonly kind: WidgetKind;
  readonly placement: WidgetPlacement;
  /**
   * Optional host course. Course-agnostic: a widget spec can declare which
   * course it belongs to so a shared registry can resolve scenario copy.
   * Omitted by legacy AI-Native specs (defaults to the host course).
   */
  readonly courseSlug?: WidgetCourseSlug;
  /** Kind-specific configuration (exercise rubric, demo variant, etc.). */
  readonly props?: Readonly<Record<string, unknown>>;
}

// ─── Exercise specification + result ───────────────────────────

export interface ExerciseSpec {
  readonly kind: ExerciseKind;
  /** Unique id within a lesson — used for localStorage keying + analytics. */
  readonly id: string;
  /** Optional host course (course-agnostic; see Widget.courseSlug). */
  readonly courseSlug?: WidgetCourseSlug;
  /** Author-facing scenario text shown above the exercise. */
  readonly scenario: string;
  /** Free-form rubric data — shape depends on kind. */
  readonly rubric: Readonly<Record<string, unknown>>;
}

/** Per-criterion feedback entry from Haiku grading (or rule-based fallback). */
export interface AiRubricEntry {
  readonly id: string;
  readonly passed: boolean;
  readonly rationale: string;
}

export type GradingSource = "ai" | "fallback" | "rule";

export interface ExerciseResult {
  readonly exerciseId: string;
  readonly kind: ExerciseKind;
  readonly completed: boolean;
  /** Normalized 0..1 — null when the exercise has no score. */
  readonly score: number | null;
  readonly attempts: number;
  readonly completedAt: string | null;
  /** True if the user used the escape hatch ("ich hab's verstanden"). */
  readonly skipped: boolean;
  /** AI- or rule-based per-criterion feedback (optional; schema v1 compatible). */
  readonly aiFeedback?: readonly AiRubricEntry[];
  /** 1-2 sentence overall summary in German. */
  readonly summary?: string;
  /** Where the grading came from — "ai" (Haiku), "fallback" (AI failed, rule
   * used), or "rule" (exercise never tried AI). */
  readonly gradingSource?: GradingSource;
}

// ─── Type guards ───────────────────────────────────────────────

export function isWidgetKind(value: unknown): value is WidgetKind {
  return (
    typeof value === "string" &&
    (ALL_WIDGET_KINDS as readonly string[]).includes(value)
  );
}

export function isExerciseKind(value: unknown): value is ExerciseKind {
  return (
    typeof value === "string" &&
    (EXERCISE_KINDS as readonly string[]).includes(value)
  );
}

export function isDemoKind(value: unknown): value is DemoKind {
  return (
    typeof value === "string" &&
    (DEMO_KINDS as readonly string[]).includes(value)
  );
}

export function isTierAKind(value: unknown): value is TierAKind {
  return (
    typeof value === "string" &&
    (TIER_A_KINDS as readonly string[]).includes(value)
  );
}

export function isPracticeKind(value: unknown): value is PracticeKind {
  return (
    typeof value === "string" &&
    (PRACTICE_KINDS as readonly string[]).includes(value)
  );
}

export function isClaudeKind(value: unknown): value is ClaudeKind {
  return (
    typeof value === "string" &&
    (CLAUDE_KINDS as readonly string[]).includes(value)
  );
}

export function isWidgetPlacement(value: unknown): value is WidgetPlacement {
  return (
    typeof value === "string" &&
    (WIDGET_PLACEMENTS as readonly string[]).includes(value)
  );
}
