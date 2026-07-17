// ─── Course configs (performance hardening) ────────────────────────
//
// The static `CourseConfig` objects live in their own module so client
// components that only need config (certificate, verification, workshop-quiz
// shell) can import them WITHOUT pulling the ~400 KB of lesson/quiz/glossary
// JSON that `./data` statically imports. `./data` re-exports everything here,
// so existing server-side imports keep working unchanged.

import type { BlockId, CourseConfig, CourseSlug } from "./types";

// ─── KI-Führerschein ───────────────────────────────────────────

export const KI_FUEHRERSCHEIN_CONFIG: CourseConfig = {
  slug: "ki-fuehrerschein",
  title: "KI-Führerschein",
  basePath: "/ki-fuehrerschein",
  coursePath: "/ki-fuehrerschein/kurs",
  blockIds: ["block_1", "block_2", "block_3", "block_4", "block_5"],
  workshopQuizQuestionCount: 20,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "KI-Führerschein",
  certificateSubtitle: "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "KI-Systeme erkennen und verstehen",
    "Datenschutz bei KI-Nutzung",
    "Praktische KI-Anwendung",
    "KI-Output verifizieren",
    "KI-Nutzungsrichtlinie erstellen",
  ],
  certificateReferenceLabel: "Persönliche Teilnahmebestätigung: KI im Alltag verstehen",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast den KI-Führerschein bestanden.",
  certificateFileStem: "KI-Fuehrerschein",
};

// ─── EU AI Act Kurs ────────────────────────────────────────────

export const EU_AI_ACT_KURS_CONFIG: CourseConfig = {
  slug: "eu-ai-act-kurs",
  title: "EU AI Act Kurs",
  basePath: "/eu-ai-act-kurs",
  coursePath: "/eu-ai-act-kurs/kurs",
  blockIds: ["block_1", "block_2", "block_3", "block_4", "block_5", "block_6"],
  workshopQuizQuestionCount: 27,
  workshopQuizTimeLimitMinutes: 30,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "EU AI Act Kurs",
  certificateSubtitle:
    "Teilnahme bestätigt. Dieser Kurs vermittelt Wissen im Bereich KI-Kompetenz. Art. 4 EU AI Act verpflichtet Betreiber zu KI-Kompetenzmaßnahmen, schreibt jedoch weder ein Zertifikat noch ein bestimmtes Format vor. (Quelle: Europäische Kommission, FAQ KI-Kompetenz, Mai 2025.)",
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
};

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
  basePath: "/ai-native",
  coursePath: "/ai-native/kurs",
  blockIds: [],
  workshopQuizQuestionCount: 20,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "AI-Native Arbeitskurs",
  certificateSubtitle: "Teilnahmebestätigung. Ausgestellt von loehrning.ai, einer unabhängigen Bildungsplattform. Diese Bestätigung ist kein akkreditierter Abschluss.",
  certificateModules: [
    "Die Mindset-Operation: orchestrieren statt ausführen",
    "Der Claude-Stack: Projects, Skills, Plugins, MCP",
    "Zweites Gehirn: Obsidian + Claude als Business-Intelligence",
    "Automatisierung mit n8n, Local AI und EU AI Act",
  ],
  certificateReferenceLabel: "Capstone selbst eingereicht (nicht fremdbeurteilt)",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast den AI-Native Arbeitskurs bestanden.",
  certificateFileStem: "AI-Native-Arbeitskurs",
};

// ─── KI und Gesellschaft (KI und Gesellschaft course review) ───────────────────────────

export const KI_UND_GESELLSCHAFT_CONFIG: CourseConfig = {
  slug: "ki-und-gesellschaft",
  title: "KI und Gesellschaft",
  basePath: "/ki-und-gesellschaft",
  coursePath: "/ki-und-gesellschaft/kurs",
  blockIds: ["block_1", "block_2", "block_3"],
  workshopQuizQuestionCount: 15,
  workshopQuizTimeLimitMinutes: 20,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Lernnachweis: KI und Gesellschaft",
  certificateSubtitle: "Arbeit · Deepfakes · Ethik",
  certificateModules: ["KI und Arbeit", "Deepfakes erkennen", "Ethik und Bias"],
  certificateReferenceLabel: "Selbst ausgestellt: lokal generiert, nicht servergeprüft",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast KI und Gesellschaft abgeschlossen.",
  certificateFileStem: "lernnachweis-ki-gesellschaft",
};

// ─── Config registry ───────────────────────────────────────────

// All three courses are registered in the shared engine ().
// `config()` guards every lookup with a clear error so any future
// unregistered slug fails loudly instead of returning `undefined`.
const COURSE_CONFIGS: Partial<Record<CourseSlug, CourseConfig>> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_CONFIG,
  "eu-ai-act-kurs": EU_AI_ACT_KURS_CONFIG,
  "ai-native": AI_NATIVE_CONFIG,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT_CONFIG,
};

function config(courseSlug: CourseSlug): CourseConfig {
  const data = COURSE_CONFIGS[courseSlug];
  if (!data) {
    throw new Error(
      `Course "${courseSlug}" is not registered in the shared engine.`,
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

export function getCourseConfig(courseSlug: CourseSlug): CourseConfig {
  return config(courseSlug);
}

export function getCourseBlockIds(courseSlug: CourseSlug): readonly BlockId[] {
  return config(courseSlug).blockIds;
}

// ─── Workshop quiz config queries ──────────────────────────────

export function getWorkshopPassThreshold(courseSlug: CourseSlug): number {
  return config(courseSlug).workshopQuizPassThreshold;
}

export function getWorkshopQuestionCount(courseSlug: CourseSlug): number {
  return config(courseSlug).workshopQuizQuestionCount;
}

export function getWorkshopTimeLimitMinutes(courseSlug: CourseSlug): number {
  return config(courseSlug).workshopQuizTimeLimitMinutes;
}
