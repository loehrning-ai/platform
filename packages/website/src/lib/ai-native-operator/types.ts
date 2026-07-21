// ─── AI-Native Operator Course types (plan 013 stage 1) ─────────────────
//
// Own separate content module, keyed by its own `ModuleId` + lesson-number
// scheme (NOT the shared `BlockId` JSON system), mirroring
// `lib/ai-native`'s (the DIFFERENT, native German course) precedent of a
// `ModuleId`-keyed structural container. This course is net-new, so it goes
// straight into the shared `UnifiedLessonProgress`/`UnifiedCourseSlice`
// shape (`@/lib/progress/types`) rather than inventing a parallel
// legacy-bridging schema the way `lib/ai-native/progress.ts` did.
//
// Slug is "ai-native-operator", never "ai-native" — the native German
// AI-Native Arbeitskurs already owns the bare "ai-native" slug
// (`src/lib/ai-native/`, `src/app/ai-native/`). The upstream source folder
// is named `ai-native` (github.com/Mavengence/interactive-courses), which
// is exactly why this collision risk exists; every id/route/type in this
// module must stay namespaced under "ai-native-operator".

import type { BaseLesson } from "@/lib/course/types";

/**
 * 9 module ids, matching `course-data.js`'s `MODULES[].id` order exactly:
 * mindset, engineering, product, operations, talent, orgmodel, data,
 * governance, measurement.
 */
export const MODULE_IDS = [
  "mindset",
  "engineering",
  "product",
  "operations",
  "talent",
  "orgmodel",
  "data",
  "governance",
  "measurement",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && (MODULE_IDS as readonly string[]).includes(value);
}

/** Per-module lesson counts, matching `course-data.js`'s real `lessons_data.length` per module (39 total, not a 9x flat cartesian product). */
export const MODULE_LESSON_COUNTS: Record<ModuleId, number> = {
  mindset: 5,
  engineering: 5,
  product: 5,
  operations: 4,
  talent: 4,
  orgmodel: 4,
  data: 4,
  governance: 4,
  measurement: 4,
};

export const TOTAL_LESSON_COUNT: number = Object.values(MODULE_LESSON_COUNTS).reduce(
  (a, b) => a + b,
  0,
);

export interface AiNativeOperatorModuleMeta {
  readonly id: ModuleId;
  /** "M01".."M09", matching source `MODULES[].code`. */
  readonly code: string;
  readonly name: string;
  readonly tagline: string;
  readonly duration: string;
  readonly difficulty: string;
  readonly lessonCount: number;
}

/** Ported verbatim from `course-data.js`'s `MODULES[]` (id/code/name/tagline/duration/difficulty). */
export const MODULE_META: Record<ModuleId, AiNativeOperatorModuleMeta> = {
  mindset: {
    id: "mindset",
    code: "M01",
    name: "Mindset & Culture",
    tagline: "The default move on every task is now an AI delegation. Build the muscle.",
    duration: "85 min",
    difficulty: "Foundational",
    lessonCount: 5,
  },
  engineering: {
    id: "engineering",
    code: "M02",
    name: "Engineering Practices",
    tagline:
      "The unit of engineering work is no longer the keystroke. It is the spec, the eval, and the review.",
    duration: "110 min",
    difficulty: "Core",
    lessonCount: 5,
  },
  product: {
    id: "product",
    code: "M03",
    name: "Product Building",
    tagline: "AI features are dead. AI products are the only kind that matters.",
    duration: "95 min",
    difficulty: "Core",
    lessonCount: 5,
  },
  operations: {
    id: "operations",
    code: "M04",
    name: "Operations & Workflows",
    tagline:
      "Meetings shrink to decisions. Docs draft themselves. Status reports become live dashboards.",
    duration: "78 min",
    difficulty: "Foundational",
    lessonCount: 4,
  },
  talent: {
    id: "talent",
    code: "M05",
    name: "Talent & Skills",
    tagline: "Hire generalists who multiply themselves with agents. Performance is leverage, not hours.",
    duration: "88 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  orgmodel: {
    id: "orgmodel",
    code: "M06",
    name: "Org Structure",
    tagline: "Two humans + a fleet of agents will own a P&L line. The org chart flattens.",
    duration: "90 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  data: {
    id: "data",
    code: "M07",
    name: "Data & Infrastructure",
    tagline: "Without context, your AI is a stranger giving advice on your business.",
    duration: "102 min",
    difficulty: "Core",
    lessonCount: 4,
  },
  governance: {
    id: "governance",
    code: "M08",
    name: "Governance & Safety",
    tagline: "Governance is not a brake. It is the system that lets you go faster.",
    duration: "95 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  measurement: {
    id: "measurement",
    code: "M09",
    name: "Measurement & ROI",
    tagline: "Track AI leverage like you track revenue. Tie comp to it. Make it boring.",
    duration: "82 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
};

/** Ordered module ids for syllabus rendering (same order as `MODULE_IDS`). */
export function orderedModuleMetas(): readonly AiNativeOperatorModuleMeta[] {
  return MODULE_IDS.map((id) => MODULE_META[id]);
}

/** Ported verbatim from `course-data.js`'s `COURSE_META` (title/subtitle/outcomes). */
export const COURSE_META = {
  title: "The AI-Native Operator",
  subtitle:
    "A 9-module course for individuals, leaders, and executives who intend to compete in 2026 and beyond.",
  duration: "~14 hours of reading + 30 exercises",
  outcomes: [
    "Diagnose your own AI maturity across 9 dimensions, honestly.",
    'Operate at "L3 — Conductor": directing fleets of agents, not keystroking.',
    "Redesign a product, a team, or an org around AI-native primitives.",
    "Build a governance + measurement system that lets you go faster, not slower.",
  ],
} as const;

// ─── Callouts ────────────────────────────────────────────────────

/** Ported from `course-app.js`'s `Callout` component (quote/spec/note/warn). */
export interface AiNativeOperatorQuoteCallout {
  readonly kind: "quote";
  readonly text: string;
  readonly attr: string;
}

export interface AiNativeOperatorSpecCallout {
  readonly kind: "spec";
  readonly h: string;
  readonly lines: readonly string[];
}

export interface AiNativeOperatorNoteCallout {
  readonly kind: "note" | "warn";
  readonly h: string;
  readonly text: string;
}

export type AiNativeOperatorCallout =
  | AiNativeOperatorQuoteCallout
  | AiNativeOperatorSpecCallout
  | AiNativeOperatorNoteCallout;

// ─── Lessons ─────────────────────────────────────────────────────

export type AiNativeOperatorLessonKind = "reading" | "quiz";

/**
 * Which TIER_A widget kind renders a reading lesson's single exercise.
 * Discriminant kept on the lesson itself (in addition to `widgets`) so
 * content authoring and the widget-mapping guard test can assert the
 * fidelity claim ("23 reflect-box, 1 matrix-grid, 1 self-rate, 1 plays, 4
 * slot-fill = 30 total") directly against lesson data, independent of how
 * the reader wires `widgets`. `undefined` for quiz-kind lessons (no single
 * exercise — the lesson IS a knowledge-check).
 */
export type AiNativeOperatorExerciseKind =
  | "reflect-box"
  | "matrix-grid"
  | "slot-fill"
  | "self-rate"
  | "plays";

/**
 * AiNativeOperatorLesson: folds into the shared `BaseLesson`
 * (sections/quiz/keyConcepts/widgets) and adds this course's own
 * module-container id, lesson kind, learning objective, and optional
 * callout. `sections`/`objective` are meaningful for `kind: "reading"`
 * lessons; `kind: "quiz"` lessons carry their questions in the shared
 * `quiz: readonly LessonQuizQuestion[]` field instead (9 lessons, ~22
 * questions total, explanations authored fresh in plan 013 stage 3 — the
 * source has none).
 */
export interface AiNativeOperatorLesson extends BaseLesson {
  readonly moduleId: ModuleId;
  /** 1-based lesson number within its module, matching source `l.n`. */
  readonly lessonNumber: number;
  readonly kind: AiNativeOperatorLessonKind;
  readonly objective: string;
  readonly callout?: AiNativeOperatorCallout;
  readonly exerciseKind?: AiNativeOperatorExerciseKind;
}

/** Canonical progress-key scheme, matching the source's own `${moduleId}/${lessonNum}` (course-app.js:83). */
export function lessonProgressKey(moduleId: ModuleId, lessonNumber: number): string {
  return `${moduleId}/${lessonNumber}`;
}
