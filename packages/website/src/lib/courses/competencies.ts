// ─── Earned competencies ("Kompetenzen") ──────────────────────────────────
//
// A person should be able to see WHAT they have learned, not just a percentage.
// Each certified German course grants a small set of named competencies once
// its record (Teilnahmebestätigung / Lernnachweis) is earned. This stays
// honest by construction:
//   • Competencies attach ONLY to the four certified courses that track real
//     completion — never to the external GitHub labs or applied courses.
//   • "Earned" uses the SAME bar as the certificate: the workshop quiz passed,
//     or (AI-Native) the capstone submitted. No new claim, no faked credential.
//   • Everything derives from the `UnifiedProgress` object that already syncs
//     to Supabase, so earned competencies are already cloud-saved per user.
//
// The functions are PURE (progress in, result out) so the /konto server
// component can compute them directly from the row it loads.

import type { CourseSlug } from "@/lib/course/types";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import type { UnifiedProgress } from "@/lib/progress/types";

/** One named thing a learner can demonstrably do after a course. */
export interface Competency {
  /** Stable id (kebab-case), unique across all courses. */
  readonly id: string;
  /** Short human label shown as a chip on the profile. */
  readonly label: string;
  /** One honest sentence describing the competency. */
  readonly description: string;
}

/** A competency joined to the course that granted it. */
export interface EarnedCompetency extends Competency {
  readonly courseSlug: CourseSlug;
  readonly courseTitle: string;
}

/**
 * Competencies granted per certified course. `Partial` because `CourseSlug`
 * also spans the 6 imported open-source courses, which grant competencies
 * only once their own plan flips them to a certified record — see
 * `isCourseRecordEarned`, which never looks up a slug outside `COURSE_CATALOG`.
 */
export const COURSE_COMPETENCIES: Partial<Record<CourseSlug, readonly Competency[]>> = {
  "ki-fuehrerschein": [
    {
      id: "ki-grundlagen-verstehen",
      label: "KI-Grundlagen verstehen",
      description: "Erkennt, was KI-Systeme leisten und wo ihre Grenzen liegen.",
    },
    {
      id: "eu-ai-act-artikel-4",
      label: "EU AI Act, Artikel 4",
      description: "Kennt die Pflicht zu KI-Kompetenz und wendet sie im Arbeitsalltag an.",
    },
    {
      id: "ki-output-pruefen",
      label: "KI-Output prüfen",
      description: "Bewertet KI-Ergebnisse kritisch und dokumentiert die Prüfung.",
    },
  ],
  "ki-und-gesellschaft": [
    {
      id: "ki-und-arbeit-einordnen",
      label: "KI und Arbeit einordnen",
      description: "Ordnet die Wirkung von KI auf Arbeit und Gesellschaft nüchtern ein.",
    },
    {
      id: "deepfakes-erkennen",
      label: "Deepfakes erkennen",
      description: "Erkennt manipulierte Medien und typische Fälschungsmuster.",
    },
    {
      id: "bias-und-ethik",
      label: "Bias und Ethik",
      description: "Versteht, wie algorithmischer Bias entsteht und wo ethische Grenzen liegen.",
    },
  ],
  "eu-ai-act-kurs": [
    {
      id: "risikoklassen-einordnen",
      label: "Risikoklassen einordnen",
      description: "Ordnet KI-Systeme nach Annex III in die Risikoklassen des EU AI Act ein.",
    },
    {
      id: "pflichten-hochrisiko-gpai",
      label: "Pflichten für Hochrisiko und GPAI",
      description: "Kennt die Anforderungen an Hochrisiko-Systeme und General-Purpose-KI.",
    },
    {
      id: "eu-ai-act-umsetzen",
      label: "Umsetzung planen",
      description: "Plant die Umsetzung entlang der Fristen bis 2028 im Mittelstand.",
    },
  ],
  "ai-native": [
    {
      id: "ai-native-arbeiten",
      label: "AI-native arbeiten",
      description: "Formuliert Intent, gibt Kontext und prüft Output systematisch.",
    },
    {
      id: "claude-stack-nutzen",
      label: "Den Claude-Stack nutzen",
      description: "Setzt Projects, Skills und MCP für wiederkehrende Aufgaben ein.",
    },
    {
      id: "automatisierung-mit-governance",
      label: "Automatisierung mit Governance",
      description: "Baut Automationen mit n8n und beachtet dabei den EU AI Act.",
    },
  ],
  // English course (plan 008 stage 10): the labels/descriptions stay English
  // to match the course's own content language (`CLAUDE_CONFIG.language`),
  // unlike the four German competency sets above.
  claude: [
    {
      id: "structured-prompting",
      label: "Structured prompting",
      description: "Writes role, context, task, constraints, examples, and format instead of guessing.",
    },
    {
      id: "context-engineering",
      label: "Context engineering",
      description: "Grounds Claude in real data and structures the context window deliberately.",
    },
    {
      id: "safe-team-workflows",
      label: "Safe team workflows",
      description: "Shares prompts and CLAUDE.md files safely, with evals and without leaking sensitive data.",
    },
  ],
  // English course (plan 009 stage 7): same reasoning as claude above.
  codex: [
    {
      id: "task-spec-authoring",
      label: "Task spec authoring",
      description: "Writes goal, constraints, acceptance criteria, and out-of-scope so an agent lands the PR right the first time.",
    },
    {
      id: "agent-pr-review",
      label: "Agent PR review",
      description: "Runs the review checklist that catches circular tests, scope creep, and Codex-specific security misses.",
    },
    {
      id: "parallel-agent-workflows",
      label: "Parallel agent workflows",
      description: "Decomposes work into independent tasks and runs multiple agents across git worktrees without merge conflicts.",
    },
  ],
  // English course (plan 010 stage 13): same reasoning as claude/codex above.
  "data-infrastructure": [
    {
      id: "system-design-tradeoffs",
      label: "System-design trade-offs",
      description: "Names the CAP/PACELC trade-off explicitly and matches storage/streaming choices to real latency and freshness targets.",
    },
    {
      id: "storage-format-internals",
      label: "Storage-format internals",
      description: "Reasons about row-vs-columnar layout, Parquet row groups, predicate pushdown, and lakehouse table formats at the byte level.",
    },
    {
      id: "ic5-interview-structure",
      label: "IC5 interview structure",
      description: "Runs the five-act system-design interview structure — clarify, skeleton, deep dive, failure modes, trade-offs — under time pressure.",
    },
  ],
};

const COURSE_TITLE: Record<string, string> = Object.fromEntries(
  COURSE_CATALOG.map((c) => [c.slug, c.title]),
);

/**
 * True when a course's record has been earned — the SAME bar as the
 * certificate: the workshop quiz passed, or the capstone submitted (AI-Native).
 * Returns false for a missing slice or null progress.
 */
export function isCourseRecordEarned(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): boolean {
  const slice = progress?.courses[slug];
  if (!slice) return false;
  return slice.workshopQuiz.passed || slice.capstoneSubmitted;
}

/**
 * Every competency the learner has actually earned, in course order. Empty for
 * null progress or a learner who has not completed any certified course.
 */
export function earnedCompetencies(
  progress: UnifiedProgress | null,
): readonly EarnedCompetency[] {
  if (!progress) return [];
  const earned: EarnedCompetency[] = [];
  for (const course of COURSE_CATALOG) {
    if (!isCourseRecordEarned(progress, course.slug)) continue;
    for (const competency of COURSE_COMPETENCIES[course.slug] ?? []) {
      earned.push({
        ...competency,
        courseSlug: course.slug,
        courseTitle: COURSE_TITLE[course.slug] ?? course.title,
      });
    }
  }
  return earned;
}

/** Total number of competencies on offer across all certified courses. */
export function totalCompetencyCount(): number {
  return Object.values(COURSE_COMPETENCIES).reduce(
    (sum, list) => sum + list.length,
    0,
  );
}

/** Earned vs total competency counts, for a headline like "7 von 12". */
export function competencyProgress(progress: UnifiedProgress | null): {
  readonly earned: number;
  readonly total: number;
} {
  return {
    earned: earnedCompetencies(progress).length,
    total: totalCompetencyCount(),
  };
}
