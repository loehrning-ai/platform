// ─── AI-Native Operator Course types ─────────────────
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
import type { Locale } from "@/lib/i18n/locale";

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
  return (
    typeof value === "string" &&
    (MODULE_IDS as readonly string[]).includes(value)
  );
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

export const TOTAL_LESSON_COUNT: number = Object.values(
  MODULE_LESSON_COUNTS,
).reduce((a, b) => a + b, 0);

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

/** Canonical English module copy. IDs, codes, order and lesson counts are immutable. */
export const MODULE_META: Record<ModuleId, AiNativeOperatorModuleMeta> = {
  mindset: {
    id: "mindset",
    code: "M01",
    name: "Mindset & Culture",
    tagline: "Select tasks by error cost, evidence, and review requirements.",
    duration: "85 min",
    difficulty: "Foundational",
    lessonCount: 5,
  },
  engineering: {
    id: "engineering",
    code: "M02",
    name: "Engineering Practices",
    tagline:
      "Use specifications, isolated work, evaluations, release criteria, and accountable review.",
    duration: "110 min",
    difficulty: "Core",
    lessonCount: 5,
  },
  product: {
    id: "product",
    code: "M03",
    name: "Product Building",
    tagline:
      "Define model-dependent product boundaries, fallbacks, evaluation, and observability.",
    duration: "95 min",
    difficulty: "Core",
    lessonCount: 5,
  },
  operations: {
    id: "operations",
    code: "M04",
    name: "Operations & Workflows",
    tagline:
      "Choose coordination formats, controlled drafting, and risk-based triage.",
    duration: "78 min",
    difficulty: "Foundational",
    lessonCount: 4,
  },
  talent: {
    id: "talent",
    code: "M05",
    name: "Talent & Skills",
    tagline:
      "Use work samples, role-specific capability expectations, and defensible compensation evidence.",
    duration: "88 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  orgmodel: {
    id: "orgmodel",
    code: "M06",
    name: "Org Structure",
    tagline:
      "Set team boundaries, specialist checkpoints, and decision authority from workload and risk.",
    duration: "90 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  data: {
    id: "data",
    code: "M07",
    name: "Data & Infrastructure",
    tagline:
      "Build authorized retrieval with provenance, freshness contracts, and deletion handling.",
    duration: "102 min",
    difficulty: "Core",
    lessonCount: 4,
  },
  governance: {
    id: "governance",
    code: "M08",
    name: "Governance & Safety",
    tagline:
      "Maintain inventories, release controls, workload identities, and audit evidence.",
    duration: "95 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
  measurement: {
    id: "measurement",
    code: "M09",
    name: "Measurement & ROI",
    tagline:
      "Separate adoption from outcomes and make claims against credible comparisons.",
    duration: "82 min",
    difficulty: "Leadership",
    lessonCount: 4,
  },
};

export const MODULE_META_DE: Record<ModuleId, AiNativeOperatorModuleMeta> = {
  mindset: {
    id: "mindset",
    code: "M01",
    name: "Mindset und Arbeitskultur",
    tagline:
      "Aufgaben anhand von Fehlerkosten, Belegen und Prüfanforderungen auswählen.",
    duration: "85 Min.",
    difficulty: "Grundlagen",
    lessonCount: 5,
  },
  engineering: {
    id: "engineering",
    code: "M02",
    name: "Technische Praxis",
    tagline:
      "Spezifikationen, isolierte Arbeit, Evaluationen, Freigabekriterien und verantwortliche Prüfung einsetzen.",
    duration: "110 Min.",
    difficulty: "Kern",
    lessonCount: 5,
  },
  product: {
    id: "product",
    code: "M03",
    name: "Produktentwicklung",
    tagline:
      "Modellabhängige Produktgrenzen, Rückfälle, Evaluation und Beobachtbarkeit definieren.",
    duration: "95 Min.",
    difficulty: "Kern",
    lessonCount: 5,
  },
  operations: {
    id: "operations",
    code: "M04",
    name: "Betrieb und Abläufe",
    tagline:
      "Abstimmungsformen, kontrollierte Entwürfe und risikobasierte Ticket-Sichtung gestalten.",
    duration: "78 Min.",
    difficulty: "Grundlagen",
    lessonCount: 4,
  },
  talent: {
    id: "talent",
    code: "M05",
    name: "Personal und Kompetenzen",
    tagline:
      "Arbeitsproben, rollenspezifische Kompetenzerwartungen und belastbare Vergütungsbelege einsetzen.",
    duration: "88 Min.",
    difficulty: "Führung",
    lessonCount: 4,
  },
  orgmodel: {
    id: "orgmodel",
    code: "M06",
    name: "Organisationsstruktur",
    tagline:
      "Teamgrenzen, fachliche Prüfpunkte und Entscheidungsbefugnisse aus Arbeitslast und Risiko ableiten.",
    duration: "90 Min.",
    difficulty: "Führung",
    lessonCount: 4,
  },
  data: {
    id: "data",
    code: "M07",
    name: "Daten und Infrastruktur",
    tagline:
      "Berechtigten Abruf mit Herkunft, Aktualitätszusagen und Löschbehandlung aufbauen.",
    duration: "102 Min.",
    difficulty: "Kern",
    lessonCount: 4,
  },
  governance: {
    id: "governance",
    code: "M08",
    name: "Steuerung und Sicherheit",
    tagline:
      "Register, Freigabekontrollen, Dienstidentitäten und Prüfbelege führen.",
    duration: "95 Min.",
    difficulty: "Führung",
    lessonCount: 4,
  },
  measurement: {
    id: "measurement",
    code: "M09",
    name: "Messung und Wirtschaftlichkeit",
    tagline:
      "Nutzung von Ergebnissen trennen und Aussagen an belastbaren Vergleichen prüfen.",
    duration: "82 Min.",
    difficulty: "Führung",
    lessonCount: 4,
  },
};

export function getModuleMeta(
  moduleId: ModuleId,
  locale: Locale = "en",
): AiNativeOperatorModuleMeta {
  return locale === "de" ? MODULE_META_DE[moduleId] : MODULE_META[moduleId];
}

/** Ordered module ids for syllabus rendering (same order as `MODULE_IDS`). */
export function orderedModuleMetas(
  locale: Locale = "en",
): readonly AiNativeOperatorModuleMeta[] {
  return MODULE_IDS.map((id) => getModuleMeta(id, locale));
}

/** Canonical English course copy. */
export interface AiNativeOperatorCourseMeta {
  readonly title: string;
  readonly subtitle: string;
  readonly duration: string;
  readonly outcomes: readonly string[];
}

export const COURSE_META: AiNativeOperatorCourseMeta = {
  title: "AI-Native Operator",
  subtitle:
    "A nine-module course on selecting, building, operating, governing, and measuring model-assisted workflows.",
  duration: "About 14 hours of reading and 30 exercises",
  outcomes: [
    "Select model-assisted tasks using error cost, evidence, and review requirements.",
    "Write specifications, evaluations, release controls, and rollback criteria.",
    "Design workflow, team, retrieval, authorization, and decision boundaries.",
    "Maintain registries, audit trails, guardrails, and credible outcome comparisons.",
  ],
};

export const COURSE_META_DE: AiNativeOperatorCourseMeta = {
  title: "AI-Native Operator",
  subtitle:
    "Ein Kurs in neun Modulen zur Auswahl, Entwicklung, zum Betrieb, zur Steuerung und zur Messung modellgestützter Abläufe.",
  duration: "Etwa 14 Stunden Lesezeit und 30 Übungen",
  outcomes: [
    "Modellgestützte Aufgaben anhand von Fehlerkosten, Belegen und Prüfanforderungen auswählen.",
    "Spezifikationen, Evaluationen, Freigabekontrollen und Rücknahmekriterien schreiben.",
    "Grenzen für Abläufe, Teams, Abruf, Berechtigungen und Entscheidungen gestalten.",
    "Register, Prüfpfade, Schutzgrößen und belastbare Ergebnisvergleiche führen.",
  ],
};

export function getCourseMeta(
  locale: Locale = "en",
): AiNativeOperatorCourseMeta {
  return locale === "de" ? COURSE_META_DE : COURSE_META;
}

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
 * questions total, explanations authored fresh in — the
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
export function lessonProgressKey(
  moduleId: ModuleId,
  lessonNumber: number,
): string {
  return `${moduleId}/${lessonNumber}`;
}
