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
  blockIds: ["block_1", "block_2", "block_3", "block_4"],
  workshopQuizQuestionCount: 20,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "KI-Führerschein",
  certificateSubtitle:
    "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "Daten einstufen und schwärzen",
    "Prüfbare Aufträge schreiben",
    "KI-Ausgaben gegen Quellen prüfen",
    "Freigaben und Team-Richtlinie",
  ],
  certificateReferenceLabel:
    "Persönliche Teilnahmebestätigung: KI im Alltag verstehen",
  quizPassMessage:
    "Du hast den KI-Führerschein bestanden.",
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
    certificateTitle: "Certificate of participation: Everyday AI Literacy",
    certificateSubtitle:
      "Participation record. Issued by loehrning.ai, an independent learning platform. This record is not an accredited qualification.",
    certificateModules: [
      "Classifying and redacting data",
      "Writing checkable briefs",
      "Checking AI output against sources",
      "Approvals and a team policy",
    ],
    certificateReferenceLabel:
      "Personal participation record: understanding AI in everyday work",
    quizPassMessage: "You passed the Everyday AI Literacy final quiz.",
    certificateFileStem: "Everyday-AI-Literacy",
    recordNoun: {
      label: "Certificate of participation",
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
    "Sie haben den EU AI Act Kurs bestanden.",
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
    certificateTitle: "Certificate of participation: EU AI Act",
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
    quizPassMessage: "You passed the EU AI Act Course final quiz.",
    certificateFileStem: "EU-AI-Act-Course",
    recordNoun: {
      label: "Certificate of participation",
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
  title: "Mit KI arbeiten",
  language: "de",
  basePath: "/ai-native",
  coursePath: "/ai-native/kurs",
  blockIds: [],
  workshopQuizQuestionCount: 15,
  workshopQuizTimeLimitMinutes: 20,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Mit KI arbeiten",
  certificateSubtitle:
    "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "Messen statt glauben: Netto-Zeit und Triage",
    "Kontext und Werkzeuge: schlanker Kontext, minimale Rechte",
    "Wissen, das zitiert werden kann",
    "Ein Workflow mit Freigabe und Pilotplan",
  ],
  certificateReferenceLabel:
    "Pilotplan selbst erstellt (nicht fremdbeurteilt)",
  quizPassMessage:
    "Du hast die Abschlussprüfung von Mit KI arbeiten bestanden.",
  certificateFileStem: "Mit-KI-arbeiten",
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
    title: "Working with AI",
    certificateTitle: "Certificate of participation: Working with AI",
    certificateSubtitle:
      "Participation record. Issued by loehrning.ai, an independent learning platform. This record confirms course completion only; it is not an accredited qualification or an external assessment.",
    certificateModules: [
      "Measure, don't guess: net time and triage",
      "Context and tools: lean context, least privilege",
      "Knowledge you can cite",
      "A workflow with approval and a pilot plan",
    ],
    certificateReferenceLabel:
      "Pilot plan self-authored; no external assessment",
    quizPassMessage: "You passed the Working with AI final quiz.",
    certificateFileStem: "Working-with-AI",
    recordNoun: {
      label: "Certificate of participation",
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
    "Du hast KI und Gesellschaft abgeschlossen.",
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
    certificateTitle: "Certificate of participation: AI and Society",
    certificateSubtitle: "Work · Deepfakes · Bias and ethics",
    certificateModules: [
      "AI and work",
      "Assessing deepfakes",
      "Bias, ethics, and accountability",
    ],
    certificateReferenceLabel:
      "Self-issued: generated locally, not server-verified",
    quizPassMessage: "You passed the AI and Society final quiz.",
    certificateFileStem: "AI-and-Society-course-record",
    recordNoun: {
      label: "Certificate of participation",
      possessive: "Your certificate of participation",
      demonstrative: "This certificate of participation",
    },
  });

// ─── Config registry ───────────────────────────────────────────

// All registered courses share the engine (). `config()`
// guards every lookup with a clear error so any future unregistered slug
// fails loudly instead of returning `undefined`.
const COURSE_CONFIGS: Partial<Record<CourseSlug, CourseConfig>> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_CONFIG,
  "eu-ai-act-kurs": EU_AI_ACT_KURS_CONFIG,
  "ai-native": AI_NATIVE_CONFIG,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT_CONFIG,
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

// ─── Final quiz config queries ──────────────────────────────

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
