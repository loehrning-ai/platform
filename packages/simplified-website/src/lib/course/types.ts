// ─── Course Types (Multi-course: KI-Führerschein + EU AI Act Kurs) ─

import type { Widget } from "@/lib/widgets/types";

export const BLOCK_IDS = [
  "block_1",
  "block_2",
  "block_3",
  "block_4",
  "block_5",
  "block_6",
] as const;

export type BlockId = (typeof BLOCK_IDS)[number];

// All three courses now share the one course engine (shared course architecture,
//). 'ai-native' is part of the union so its lessons,
// progress, and config flow through the same shared types + components.
export const COURSE_SLUGS = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ai-native",
  "ki-und-gesellschaft",
] as const;

export type CourseSlug = (typeof COURSE_SLUGS)[number];

export interface LessonSection {
  readonly id: string;
  readonly title: string;
  readonly readTimeMinutes: number;
  readonly content: string;
  readonly keyTakeaway?: string;
  /**
   * Optional source references for this section (legal-source governance).
   * When a section contains a legal claim, add a sources entry with claimId
   * pointing to src/lib/legal-registry.ts. The section-reader renders a
   * <LegalClaimBadge> for the first entry with a claimId.
   */
  readonly sources?: readonly {
    readonly claimId?: string;
    readonly sourceUrl?: string;
    readonly sourceTitle?: string;
    readonly sourceYear?: string;
    readonly lastVerified?: string;
    readonly simplified?: boolean;
  }[];
}

export interface LessonQuizQuestion {
  readonly id: string;
  readonly questionText: string;
  readonly answerOptions: readonly {
    readonly id: string;
    readonly text: string;
    readonly isCorrect: boolean;
  }[];
  readonly explanation: string;
}

/**
 * BaseLesson: the lesson fields every course shares (shared course architecture,
 *). KI-Führerschein/EU-AI-Act `Lesson` and AI-Native's
 * `AiNativeLesson` both extend this. Course-specific containers (blockId vs
 * moduleId) and richer fields (widgets, etc.) are added by each extension.
 */
export interface BaseLesson {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly sections: readonly LessonSection[];
  readonly quiz: readonly LessonQuizQuestion[];
  readonly keyConcepts: readonly string[];
  /**
   * Interactive widgets embedded in the lesson reader (shared course architecture).
   * Course-agnostic via the shared widget registry. Optional: most lessons
   * carry none. Each widget declares its `placement` slot ("after-intro",
   * "before-quiz", "end") and a `props` bag forwarded to the registered
   * component (Tier-A widgets read `lessonId` + `cpId` from there to award
   * unified-store checkpoints).
   */
  readonly widgets?: readonly Widget[];
}

export interface Lesson extends BaseLesson {
  readonly blockId: BlockId;
}

export interface BlockDefinition {
  readonly id: BlockId;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly orderIndex: number;
  readonly lessons: readonly Lesson[];
}

/**
 * Slim, serializable block shape the course-hub SERVER pages derive from
 * `BlockDefinition` and pass to their client content components.
 * Carries lesson IDs only — never full lesson bodies — so the
 * hub routes ship no lesson JSON in their client bundles or RSC payload.
 */
export interface BlockSummary {
  readonly id: BlockId;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly orderIndex: number;
  readonly lessonIds: readonly string[];
}

// ─── Quiz Types ─────────────────────────────────────────────────

export interface QuizAnswerOption {
  readonly id: string;
  readonly text: string;
  readonly isCorrect: boolean;
}

export interface QuizQuestion {
  readonly id: string;
  readonly questionType: string;
  readonly difficulty: string;
  readonly questionText: string;
  readonly answerOptions: readonly QuizAnswerOption[];
  readonly explanation: string;
  readonly version: number;
  readonly active: boolean;
}

// ─── Progress Types (localStorage) ──────────────────────────────

export interface LessonProgressEntry {
  readonly sectionsRead: readonly string[];
  readonly quizScore: number | null;
  readonly quizTotal: number | null;
  readonly completed: boolean;
}

export interface WorkshopQuizProgress {
  readonly passed: boolean;
  readonly score: number;
  readonly completedAt: string | null;
}

export interface CourseProgress {
  readonly lessons: Record<string, LessonProgressEntry>;
  readonly workshopQuiz: WorkshopQuizProgress;
  readonly startedAt: string;
  readonly lastActivity: string;
}

// ─── Glossary Types ─────────────────────────────────────────────

export type GlossaryCategory = "regulatorik" | "technik" | "praxis";

export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
  readonly english: string;
  readonly category: GlossaryCategory;
  readonly relatedTerms?: readonly string[];
  readonly relatedBlocks?: readonly BlockId[];
}

// ─── Course Configuration ───────────────────────────────────────

export interface CourseConfig {
  readonly slug: CourseSlug;
  readonly title: string;
  readonly basePath: string; // e.g., "/ki-fuehrerschein"
  /**
   * Root path the course lives under for shared route components. Same as
   * `basePath` for the free courses; differs for AI-Native ("/ai-native").
   */
  readonly coursePath: string; // e.g., "/ki-fuehrerschein/kurs"
  readonly blockIds: readonly BlockId[];
  readonly workshopQuizQuestionCount: number;
  readonly workshopQuizTimeLimitMinutes: number;
  readonly workshopQuizPassThreshold: number;
  readonly certificateTitle: string;
  readonly certificateSubtitle: string;
  readonly certificateModules: readonly string[];
  readonly certificateReferenceLabel: string;
  /** Localized "you passed" line on the workshop quiz result screen. */
  readonly quizPassMessage: string;
  /** File-name stem for the downloaded certificate (no extension). */
  readonly certificateFileStem: string;
}
