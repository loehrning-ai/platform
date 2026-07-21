// ─── Course configs (performance hardening) ────────────────────────
//
// The static `CourseConfig` objects live in their own module so client
// components that only need config (certificate, verification, workshop-quiz
// shell) can import them WITHOUT pulling the ~400 KB of lesson/quiz/glossary
// JSON that `./data` statically imports. `./data` re-exports everything here,
// so existing server-side imports keep working unchanged.

import type { BlockId, CourseConfig, CourseSlug } from "./types";
import { CODEX_CONFIG } from "@/lib/codex/config";
import { DATA_INFRASTRUCTURE_CONFIG } from "@/lib/data-infrastructure/config";
import { DATA_ENGINEERING_FUNDAMENTALS_CONFIG } from "@/lib/data-engineering-fundamentals/config";
import { DATA_SCIENCE_CONFIG } from "@/lib/data-science/config";

export { CODEX_CONFIG };
export { DATA_INFRASTRUCTURE_CONFIG };
export { DATA_ENGINEERING_FUNDAMENTALS_CONFIG };
export { DATA_SCIENCE_CONFIG };

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
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
};

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
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
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
  language: "de",
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
  recordNoun: {
    label: "Teilnahmebestätigung",
    possessive: "Deine Teilnahmebestätigung",
    demonstrative: "Diese Teilnahmebestätigung",
  },
};

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
  certificateReferenceLabel: "Selbst ausgestellt: lokal generiert, nicht servergeprüft",
  quizPassMessage:
    "Herzlichen Glückwunsch! Du hast KI und Gesellschaft abgeschlossen.",
  certificateFileStem: "lernnachweis-ki-gesellschaft",
  recordNoun: {
    label: "Lernnachweis",
    possessive: "Dein Lernnachweis",
    demonstrative: "Dieser Lernnachweis",
  },
};

// ─── Claude Course (plan 008 stage 1) ───────────────────────────
//
// First imported course folded into the shared engine (plan 007 widened
// CourseSlug + added the "en" language + "certificate" RecordKind for this
// purpose). Content lives in `lib/claude-course` keyed by its own flat
// lesson-id scheme (NOT the shared BlockId JSON system), mirroring
// AI_NATIVE_CONFIG's `blockIds: []` precedent above. Registering the config
// here does not itself expose any UI: the catalog entry stays
// `nativeStatus: "pending"` and `COURSE_FACTS.claude` stays
// `{record: "none", external: true}` until plan 008 stage 10 ships the real
// routes and flips both in the same commit (mirroring plan 007's own
// "machinery now, flip later" sequencing so no misleading badge ships early).
//
// Progress-budget audit (plan 008 stage 12, see src/lib/claude-course/
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

export const CLAUDE_CONFIG: CourseConfig = {
  slug: "claude",
  title: "Claude Course",
  language: "en",
  basePath: "/kurse/open-source/claude",
  coursePath: "/kurse/open-source/claude/kurs",
  blockIds: [],
  // Bank size equals served count (matches every other course's convention:
  // ki-fuehrerschein 20/20, eu-ai-act-kurs 27/27, ai-native 24/24,
  // ki-und-gesellschaft 15/15). The 19-question bank (stage 11) reuses all
  // 19 already-authored inline lesson Quiz questions verbatim.
  workshopQuizQuestionCount: 19,
  workshopQuizTimeLimitMinutes: 25,
  workshopQuizPassThreshold: 0.7,
  certificateTitle: "Claude Course",
  certificateSubtitle:
    "Certificate of completion. Issued by loehrning.ai, an independent education platform. This confirmation is not an accredited qualification.",
  certificateModules: [
    "Foundations: mental model, prompt anatomy, context windows",
    "Workflows: CLAUDE.md, iteration, Google Docs",
    "Going deeper: agents and tool use, code review, grounding",
    "Team and rigor: sharing prompts, evals, safety",
  ],
  certificateReferenceLabel:
    "Personal certificate of completion: prompting Claude effectively",
  quizPassMessage:
    "Congratulations! You passed the Claude Course workshop quiz.",
  certificateFileStem: "Claude-Course",
  recordNoun: {
    label: "Certificate of Completion",
    possessive: "Your certificate of completion",
    demonstrative: "This certificate of completion",
  },
};

// ─── Config registry ───────────────────────────────────────────

// All registered courses share the engine (). `config()`
// guards every lookup with a clear error so any future unregistered slug
// fails loudly instead of returning `undefined`.
const COURSE_CONFIGS: Partial<Record<CourseSlug, CourseConfig>> = {
  "ki-fuehrerschein": KI_FUEHRERSCHEIN_CONFIG,
  "eu-ai-act-kurs": EU_AI_ACT_KURS_CONFIG,
  "ai-native": AI_NATIVE_CONFIG,
  "ki-und-gesellschaft": KI_UND_GESELLSCHAFT_CONFIG,
  claude: CLAUDE_CONFIG,
  codex: CODEX_CONFIG,
  "data-infrastructure": DATA_INFRASTRUCTURE_CONFIG,
  "data-engineering-fundamentals": DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  "data-science": DATA_SCIENCE_CONFIG,
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
