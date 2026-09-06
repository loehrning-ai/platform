// ─── Course configs (performance hardening) ────────────────────────
//
// The static `CourseConfig` objects live in their own module so client
// components that only need config (certificate, verification, workshop-quiz
// shell) can import them WITHOUT pulling the ~400 KB of lesson/quiz/glossary
// JSON that `./data` statically imports. `./data` re-exports everything here,
// so existing server-side imports keep working unchanged.

import type { BlockId, CourseConfig, CourseSlug } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { createLocalizedCourseConfig } from "./localization";
import { CODEX_CONFIG, CODEX_CONFIG_DE } from "@/lib/codex/config";
import {
  DATA_INFRASTRUCTURE_CONFIG,
  DATA_INFRASTRUCTURE_CONFIG_DE,
} from "@/lib/data-infrastructure/config";
import {
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
} from "@/lib/data-engineering-fundamentals/config";
import {
  DATA_SCIENCE_CONFIG,
  DATA_SCIENCE_CONFIG_DE,
} from "@/lib/data-science/config";
import {
  AI_NATIVE_OPERATOR_CONFIG,
  AI_NATIVE_OPERATOR_CONFIG_DE,
} from "@/lib/ai-native-operator/config";
import { createLocalizedTechnicalCourseConfig } from "@/lib/technical-courses/routes";

export { CODEX_CONFIG, CODEX_CONFIG_DE };
export { DATA_INFRASTRUCTURE_CONFIG, DATA_INFRASTRUCTURE_CONFIG_DE };
export {
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
};
export { DATA_SCIENCE_CONFIG, DATA_SCIENCE_CONFIG_DE };
export { AI_NATIVE_OPERATOR_CONFIG, AI_NATIVE_OPERATOR_CONFIG_DE };

// ─── KI-Führerschein ───────────────────────────────────────────

export const KI_FUEHRERSCHEIN_CONFIG: CourseConfig = {
  slug: "ki-fuehrerschein",
  title: "KI-Führerschein",
  language: "de",
  basePath: "/ki-fuehrerschein",
  coursePath: "/ki-fuehrerschein/kurs",
  blockIds: ["block_1", "block_2", "block_3", "block_4", "block_5"],
  workshopQuizQuestionCount: 20,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "KI-Führerschein",
  certificateSubtitle:
    "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "KI-Systeme erkennen und verstehen",
    "Datenschutz bei KI-Nutzung",
    "Praktische KI-Anwendung",
    "KI-Output verifizieren",
    "KI-Nutzungsrichtlinie erstellen",
  ],
  certificateReferenceLabel:
    "Persönliche Teilnahmebestätigung: KI im Alltag verstehen",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast den KI-Führerschein bestanden.",
  certificateFileStem: "KI-Fuehrerschein",
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
};

export const KI_FUEHRERSCHEIN_EN_CONFIG: CourseConfig =
  createLocalizedCourseConfig(KI_FUEHRERSCHEIN_CONFIG, "en", {
    title: "Everyday AI Literacy",
    certificateTitle: "Certificate of Participation: Everyday AI Literacy",
    certificateSubtitle:
      "Participation record. Issued by loehrning.ai, an independent learning platform. This record is not an accredited qualification.",
    certificateModules: [
      "Recognizing and understanding AI systems",
      "Data protection when using AI",
      "Practical AI use at work",
      "Checking AI output",
      "Creating an AI use policy",
    ],
    certificateReferenceLabel:
      "Personal participation record: understanding AI in everyday work",
    quizPassMessage: "You passed the Everyday AI Literacy workshop quiz.",
    certificateFileStem: "Everyday-AI-Literacy",
    recordNoun: {
      label: "Certificate of Participation",
      possessive: "Your certificate of participation",
      demonstrative: "This certificate of participation",
    },
  });

// ─── EU AI Act Kurs ────────────────────────────────────────────

export const EU_AI_ACT_KURS_CONFIG: CourseConfig = {
  slug: "eu-ai-act-kurs",
  title: "EU AI Act Kurs",
  language: "de",
  basePath: "/eu-ai-act-kurs",
  coursePath: "/eu-ai-act-kurs/kurs",
  blockIds: ["block_1", "block_2", "block_3", "block_4", "block_5", "block_6"],
  workshopQuizQuestionCount: 27,
  workshopQuizTimeLimitMinutes: 30,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "EU AI Act Kurs",
  certificateSubtitle:
    "Teilnahme bestätigt. Dieser Kurs vermittelt Wissen im Bereich KI-Kompetenz. Art. 4 EU AI Act verlangt von Anbietern und Betreibern kontextbezogene Maßnahmen zur Unterstützung der KI-Kompetenz, schreibt jedoch weder ein Zertifikat noch ein bestimmtes Format vor. (Quelle: Art. 4 in der Fassung der Verordnung (EU) 2026/1744.)",
  certificateModules: [
    "Geltungsbereich und Rollen",
    "Risikoklassen und Entscheidungsbaum",
    "Pflichten für Hochrisiko-Systeme",
    "GPAI, Art. 4 und Transparenz",
    "Governance und Sanktionen",
    "Umsetzung im Mittelstand",
  ],
  certificateReferenceLabel: "Kursinhalt: Verordnung (EU) 2024/1689",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast den EU AI Act Kurs bestanden.",
  certificateFileStem: "EU-AI-Act-Kurs",
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
};

export const EU_AI_ACT_KURS_EN_CONFIG: CourseConfig =
  createLocalizedCourseConfig(EU_AI_ACT_KURS_CONFIG, "en", {
    title: "EU AI Act Course",
    certificateTitle: "Certificate of Participation: EU AI Act",
    certificateSubtitle:
      "Participation record. Issued by loehrning.ai, an independent learning platform. This record confirms completion of this course only; it is not an accredited qualification, legal advice, or evidence of regulatory compliance.",
    certificateModules: [
      "Scope, roles, and application dates",
      "Risk categories and classification",
      "High-risk system obligations",
      "GPAI, AI literacy, and transparency",
      "Governance and penalties",
      "Implementation for small and medium-sized organizations",
    ],
    certificateReferenceLabel:
      "Course content: Regulation (EU) 2024/1689, as amended",
    quizPassMessage: "You passed the EU AI Act Course workshop quiz.",
    certificateFileStem: "EU-AI-Act-Course",
    recordNoun: {
      label: "Certificate of Participation",
      possessive: "Your certificate of participation",
      demonstrative: "This certificate of participation",
    },
  });

// ─── AI-Native (shared course architecture) ────────────
//
// AI-Native folds into the shared engine so it gets the same workshop-quiz +
// certificate + verification components as the two free courses. Its lessons
// live in `lib/ai-native` (keyed by `ModuleId`, not `BlockId`), so `blockIds`
// is intentionally empty. The `coursePath` is `/ai-native/kurs` while
// `basePath` is `/ai-native` (the verifizierung route sits at the base path,
// like the other two courses).

export const AI_NATIVE_CONFIG: CourseConfig = {
  slug: "ai-native",
  title: "AI-Native Arbeitskurs",
  language: "de",
  basePath: "/ai-native",
  coursePath: "/ai-native/kurs",
  blockIds: [],
  workshopQuizQuestionCount: 20,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "AI-Native Arbeitskurs",
  certificateSubtitle:
    "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "Die Mindset-Operation: orchestrieren statt ausführen",
    "Der Claude-Stack: Projects, Skills, Plugins, MCP",
    "Zweites Gehirn: Obsidian + Claude als Business-Intelligence",
    "Automatisierung mit n8n, Local AI und EU AI Act",
  ],
  certificateReferenceLabel:
    "Capstone selbst eingereicht (nicht fremdbeurteilt)",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast den AI-Native Arbeitskurs bestanden.",
  certificateFileStem: "AI-Native-Arbeitskurs",
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
};

export const AI_NATIVE_EN_CONFIG: CourseConfig = createLocalizedCourseConfig(
  AI_NATIVE_CONFIG,
  "en",
  {
    title: "AI-Native Workflow Course",
    certificateTitle: "Certificate of Participation: AI-Native Workflow Course",
    certificateSubtitle:
      "Participation record. Issued by loehrning.ai, an independent learning platform. This record confirms course completion only; it is not an accredited qualification or an external assessment.",
    certificateModules: [
      "From task to workflow",
      "Claude as a work assistant",
      "A searchable knowledge base",
      "Automating repeatable work with controls",
    ],
    certificateReferenceLabel:
      "Capstone rubric self-reported; no external assessment",
    quizPassMessage: "You passed the AI-Native Workflow Course workshop quiz.",
    certificateFileStem: "AI-Native-Workflow-Course",
    recordNoun: {
      label: "Certificate of Participation",
      possessive: "Your certificate of participation",
      demonstrative: "This certificate of participation",
    },
  },
);

// ─── KI und Gesellschaft (KI und Gesellschaft course review) ───────────────────────────

export const KI_UND_GESELLSCHAFT_CONFIG: CourseConfig = {
  slug: "ki-und-gesellschaft",
  title: "KI und Gesellschaft",
  language: "de",
  basePath: "/ki-und-gesellschaft",
  coursePath: "/ki-und-gesellschaft/kurs",
  blockIds: ["block_1", "block_2", "block_3"],
  workshopQuizQuestionCount: 15,
  workshopQuizTimeLimitMinutes: 20,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Lernnachweis: KI und Gesellschaft",
  certificateSubtitle: "Arbeit · Deepfakes · Ethik",
  certificateModules: ["KI und Arbeit", "Deepfakes erkennen", "Ethik und Bias"],
  certificateReferenceLabel:
    "Selbst ausgestellt: lokal generiert, nicht servergeprüft",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast KI und Gesellschaft abgeschlossen.",
  certificateFileStem: "lernnachweis-ki-gesellschaft",
  recordNoun: {
    label: "Lernnachweis",
    possessive: "Dein Lernnachweis",
    demonstrative: "Dieser Lernnachweis",
  },
};

export const KI_UND_GESELLSCHAFT_EN_CONFIG: CourseConfig =
  createLocalizedCourseConfig(KI_UND_GESELLSCHAFT_CONFIG, "en", {
    title: "AI and Society",
    certificateTitle: "Certificate of Participation: AI and Society",
    certificateSubtitle: "Work · Deepfakes · Bias and ethics",
    certificateModules: [
      "AI and work",
      "Assessing deepfakes",
      "Bias, ethics, and accountability",
    ],
    certificateReferenceLabel:
      "Self-issued: generated locally, not server-verified",
    quizPassMessage: "You passed the AI and Society workshop quiz.",
    certificateFileStem: "AI-and-Society-course-record",
    recordNoun: {
      label: "Certificate of Participation",
      possessive: "Your certificate of participation",
      demonstrative: "This certificate of participation",
    },
  });

// ─── Claude Course ───────────────────────────
//
// First imported course folded into the shared engine ( widened
// CourseSlug + added the "en" language + "certificate" RecordKind for this
// purpose). Content lives in `lib/claude-course` keyed by its own flat
// lesson-id scheme (NOT the shared BlockId JSON system), mirroring
// AI_NATIVE_CONFIG's `blockIds: []` precedent above. Registering the config
// here does not itself expose any UI: the catalog entry stays
// `nativeStatus: "pending"` and `COURSE_FACTS.claude` stays
// `{record: "none", external: true}` until ships the real
// routes and flips both in the same commit (mirroring own
// "machinery now, flip later" sequencing so no misleading badge ships early).
//
// Progress-budget audit (, see src/lib/claude-course/
// progress-budget.test.ts for the computation): the course's 46 checkpoints
// (its lesson widgets that award one, more than the plan's original "~34-40"
// estimate) do NOT count against this course's own per-course progress row.
// `checkpoints` lives on `UnifiedProgress` itself, one level up from
// `UnifiedCourseSlice`, and persists server-side in the shared "_meta" row
// (course_slug = "_meta", src/lib/progress/server-sync.ts's
// META_ROW_COURSE_SLUG), not the "claude" row. Both rows share the same
// 65536-byte pg_column_size CHECK constraint (supabase/migrations/
// 009_user_course_progress_per_course.sql). Measured worst case: this
// course's own row (12 lessons, every section read, quiz passed) serializes
// to ~2-3 KB, under 5% of the cap; its 46 checkpoint keys add ~970 bytes to
// the shared "_meta" row, under 1.5 KB even generously rounded, comfortable
// headroom alongside every other course's checkpoints in that same row.

export const CLAUDE_CONFIG: CourseConfig & { readonly slug: "claude" } = {
  slug: "claude",
  title: "Claude Course",
  language: "en",
  basePath: "/kurse/open-source/claude",
  coursePath: "/kurse/open-source/claude/kurs",
  blockIds: [],
  // Bank size equals served count for this course. The 19-question bank
  // reuses all 19 already-authored inline lesson quiz questions verbatim.
  workshopQuizQuestionCount: 19,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Claude Course",
  certificateSubtitle:
    "Certificate of participation. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Foundations: mental model, prompt anatomy, context windows",
    "Workflows: CLAUDE.md, iteration, Google Docs",
    "Going deeper: agents and tool use, code review, grounding",
    "Team and rigor: sharing prompts, evals, safety",
  ],
  certificateReferenceLabel:
    "Personal certificate of participation: prompting Claude effectively",
  quizPassMessage:
    "Congratulations! You passed the Claude Course workshop quiz.",
  certificateFileStem: "Claude-Course",
  recordNoun: {
    label: "Certificate of Participation",
    possessive: "Your certificate of participation",
    demonstrative: "This certificate of participation",
  },
};

export const CLAUDE_CONFIG_DE = createLocalizedTechnicalCourseConfig(
  CLAUDE_CONFIG,
  "de",
  {
    title: "Claude-Kurs",
    certificateTitle: "Teilnahmebestätigung: Claude-Kurs",
    certificateSubtitle:
      "Teilnahmebestätigung für den abgeschlossenen Claude-Kurs. Ausgestellt von loehrning.ai, einer unabhängigen Lernplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
    certificateModules: [
      "Grundlagen: mentales Modell, Prompt-Struktur und Kontextfenster",
      "Arbeitsabläufe: CLAUDE.md, Iteration und Google Docs",
      "Vertiefung: Agenten, Tool-Nutzung, Code-Review und Grounding",
      "Team und Qualität: Prompts teilen, Evals und Sicherheit",
    ],
    certificateReferenceLabel:
      "Persönliche Teilnahmebestätigung: Claude strukturiert einsetzen",
    quizPassMessage: "Du hast das Abschlussquiz des Claude-Kurses bestanden.",
    certificateFileStem: "Claude-Kurs",
    recordNoun: {
      label: "Teilnahmebestätigung",
      possessive: "Deine Teilnahmebestätigung",
      demonstrative: "Diese Teilnahmebestätigung",
    },
  },
);

// ─── Config registry ───────────────────────────────────────────

// All registered courses share the engine (). `config()`
// guards every lookup with a clear error so any future unregistered slug
// fails loudly instead of returning `undefined`.
const COURSE_CONFIGS: Partial<Record<CourseSlug, CourseConfig>> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_CONFIG,
  "eu-ai-act-kurs": EU_AI_ACT_KURS_CONFIG,
  "ai-native": AI_NATIVE_CONFIG,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT_CONFIG,
  claude: CLAUDE_CONFIG_DE,
  codex: CODEX_CONFIG_DE,
  "data-infrastructure": DATA_INFRASTRUCTURE_CONFIG_DE,
  "data-engineering-fundamentals": DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
  "data-science": DATA_SCIENCE_CONFIG_DE,
  "ai-native-operator": AI_NATIVE_OPERATOR_CONFIG_DE,
};

// Locale-specific config stays JSON-free so client components can select
// reviewed copy without importing lesson, glossary, or quiz bodies. English
// foundation configs are registered only with their complete audited bundle.
const COURSE_CONFIGS_BY_LOCALE: Partial<
  Record<CourseSlug, Partial<Record<Locale, CourseConfig>>>
> = {
  "ki-fuehrerschein": {
    de: KI_FUEHRERSCHEIN_CONFIG,
    en: KI_FUEHRERSCHEIN_EN_CONFIG,
  },
  "eu-ai-act-kurs": {
    de: EU_AI_ACT_KURS_CONFIG,
    en: EU_AI_ACT_KURS_EN_CONFIG,
  },
  "ai-native": { de: AI_NATIVE_CONFIG, en: AI_NATIVE_EN_CONFIG },
  "ki-und-gesellschaft": {
    de: KI_UND_GESELLSCHAFT_CONFIG,
    en: KI_UND_GESELLSCHAFT_EN_CONFIG,
  },
  claude: { de: CLAUDE_CONFIG_DE, en: CLAUDE_CONFIG },
  codex: { de: CODEX_CONFIG_DE, en: CODEX_CONFIG },
  "data-infrastructure": {
    de: DATA_INFRASTRUCTURE_CONFIG_DE,
    en: DATA_INFRASTRUCTURE_CONFIG,
  },
  "data-engineering-fundamentals": {
    de: DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
    en: DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  },
  "data-science": { de: DATA_SCIENCE_CONFIG_DE, en: DATA_SCIENCE_CONFIG },
  "ai-native-operator": {
    de: AI_NATIVE_OPERATOR_CONFIG_DE,
    en: AI_NATIVE_OPERATOR_CONFIG,
  },
};

function config(courseSlug: CourseSlug, locale?: Locale): CourseConfig {
  const data =
    locale === undefined
      ? COURSE_CONFIGS[courseSlug]
      : COURSE_CONFIGS_BY_LOCALE[courseSlug]?.[locale];
  if (!data) {
    throw new Error(
      locale === undefined
        ? `Course "${courseSlug}" is not registered in the shared engine.`
        : `Course "${courseSlug}" has no audited "${locale}" config registered.`,
    );
  }
  return data;
}

/** Slugs registered in the shared engine (excludes not-yet-folded courses). */
export function getRegisteredCourseSlugs(): readonly CourseSlug[] {
  return Object.keys(COURSE_CONFIGS) as CourseSlug[];
}

export function isCourseRegistered(courseSlug: CourseSlug): boolean {
  return COURSE_CONFIGS[courseSlug] !== undefined;
}

export function getCourseConfig(
  courseSlug: CourseSlug,
  locale?: Locale,
): CourseConfig {
  return config(courseSlug, locale);
}

export function getCourseBlockIds(
  courseSlug: CourseSlug,
  locale?: Locale,
): readonly BlockId[] {
  return config(courseSlug, locale).blockIds;
}

// ─── Workshop quiz config queries ──────────────────────────────

export function getWorkshopPassThreshold(
  courseSlug: CourseSlug,
  locale?: Locale,
): number {
  return config(courseSlug, locale).workshopQuizPassThreshold;
}

export function getWorkshopQuestionCount(
  courseSlug: CourseSlug,
  locale?: Locale,
): number {
  return config(courseSlug, locale).workshopQuizQuestionCount;
}

export function getWorkshopTimeLimitMinutes(
  courseSlug: CourseSlug,
  locale?: Locale,
): number {
  return config(courseSlug, locale).workshopQuizTimeLimitMinutes;
}
