// ─── Covered course outcomes ───────────────────────────────────────────────
//
// A completed course can show which outcomes its curriculum covered. It cannot
// prove that the learner demonstrated every named ability. The account model
// therefore attaches course outcomes only after the record gate is met, and
// presents them as covered content rather than individual ability claims.
//
// The functions are PURE (progress in, result out) so the /konto server
// component can compute them directly from the row it loads.

import type { CourseSlug } from "@/lib/course/types";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import type { Locale } from "@/lib/i18n/locale";
import type { UnifiedProgress } from "@/lib/progress/types";
import { isCourseCompletionEarned } from "./completion";

/** One named topic or outcome covered by a course. */
export interface CourseOutcome {
  /** Stable id (kebab-case), unique across all courses. */
  readonly id: string;
  /** Short human label shown as a chip on the profile. */
  readonly label: string;
  /** One sentence describing what the course covers. */
  readonly description: string;
}

/** A course outcome joined to the completed course that covered it. */
export interface CoveredCourseOutcome extends CourseOutcome {
  readonly courseSlug: CourseSlug;
  readonly courseTitle: string;
}

/**
 * Outcomes covered per course. `Partial` because `CourseSlug` also spans
 * courses that do not publish an outcome list — see
 * `isCourseRecordEarned`, which never looks up a slug outside `COURSE_CATALOG`.
 */
export const COURSE_OUTCOMES: Partial<
  Record<CourseSlug, readonly CourseOutcome[]>
> = {
  "ki-fuehrerschein": [
    {
      id: "ki-grundlagen-verstehen",
      label: "KI-Grundlagen verstehen",
      description:
        "Behandelt Leistungen, Grenzen und typische Fehler von KI-Systemen.",
    },
    {
      id: "eu-ai-act-artikel-4",
      label: "EU AI Act, Artikel 4",
      description:
        "Behandelt die Pflicht zu kontextbezogenen KI-Kompetenzmaßnahmen im Arbeitsalltag.",
    },
    {
      id: "ki-output-pruefen",
      label: "KI-Output prüfen",
      description:
        "Behandelt kritische Prüfung und Dokumentation von KI-Ergebnissen.",
    },
  ],
  "ki-und-gesellschaft": [
    {
      id: "ki-und-arbeit-einordnen",
      label: "KI und Arbeit einordnen",
      description: "Behandelt Wirkungen von KI auf Arbeit und Gesellschaft.",
    },
    {
      id: "deepfakes-erkennen",
      label: "Deepfakes erkennen",
      description:
        "Behandelt manipulierte Medien und typische Fälschungsmuster.",
    },
    {
      id: "bias-und-ethik",
      label: "Bias und Ethik",
      description:
        "Behandelt Ursachen algorithmischer Verzerrung und ethische Grenzen.",
    },
  ],
  "eu-ai-act-kurs": [
    {
      id: "risikoklassen-einordnen",
      label: "Risikoklassen einordnen",
      description: "Behandelt die Risikoklassen des EU AI Act und Annex III.",
    },
    {
      id: "pflichten-hochrisiko-gpai",
      label: "Pflichten für Hochrisiko und GPAI",
      description:
        "Behandelt Anforderungen an Hochrisiko-Systeme und General-Purpose-KI.",
    },
    {
      id: "eu-ai-act-umsetzen",
      label: "Umsetzung planen",
      description:
        "Behandelt Umsetzungsplanung und die anwendbaren Fristen bis 2028.",
    },
  ],
  "ai-native": [
    {
      id: "ai-native-arbeiten",
      label: "AI-native arbeiten",
      description:
        "Behandelt Intent, Kontext und systematische Output-Prüfung.",
    },
    {
      id: "claude-stack-nutzen",
      label: "Den Claude-Stack nutzen",
      description:
        "Behandelt Projects, Skills und MCP für wiederkehrende Aufgaben.",
    },
    {
      id: "automatisierung-mit-governance",
      label: "Automatisierung mit Governance",
      description:
        "Behandelt n8n-Automationen, Kontrollen und EU-AI-Act-Grenzen.",
    },
  ],
  // English course: the labels/descriptions stay English
  // to match the course's own content language (`CLAUDE_CONFIG.language`),
  // unlike the four foundation-path outcome sets above.
  claude: [
    {
      id: "structured-prompting",
      label: "Structured prompting",
      description:
        "Covers explicit role, context, task, constraints, examples, and output format.",
    },
    {
      id: "context-engineering",
      label: "Context engineering",
      description:
        "Covers grounding Claude in source data and structuring the context window.",
    },
    {
      id: "safe-team-workflows",
      label: "Safe team workflows",
      description:
        "Covers safe prompt and CLAUDE.md sharing, evaluations, and data boundaries.",
    },
  ],
  // English course: same reasoning as claude above.
  codex: [
    {
      id: "task-spec-authoring",
      label: "Task spec authoring",
      description:
        "Covers goals, constraints, acceptance criteria, and explicit non-goals for agent tasks.",
    },
    {
      id: "agent-pr-review",
      label: "Agent PR review",
      description:
        "Covers review checks for circular tests, scope creep, and agent-specific security gaps.",
    },
    {
      id: "parallel-agent-workflows",
      label: "Parallel agent workflows",
      description:
        "Covers task decomposition and conflict-aware parallel work across git worktrees.",
    },
  ],
  // English course: same reasoning as claude/codex above.
  "data-engineering-fundamentals": [
    {
      id: "idempotent-pipeline-writes",
      label: "Idempotent pipeline writes",
      description:
        "Covers date-keyed idempotent writes for safe retries and backfills.",
    },
    {
      id: "streaming-boundary-guards",
      label: "Streaming boundary guards",
      description:
        "Covers event deduplication and watermark-based late-data handling as separate guards.",
    },
    {
      id: "data-quality-signal-barrier",
      label: "Data-quality signal barrier",
      description:
        "Covers downstream release through an explicit quality signal after row-count, freshness, schema, and uniqueness checks.",
    },
  ],
  // English course: same reasoning as claude/codex above.
  "data-science": [
    {
      id: "metric-before-model",
      label: "Choosing the metric before the model",
      description:
        "Covers selecting precision, recall, F1, or PR-AUC from decision costs.",
    },
    {
      id: "sampling-clt-intuition",
      label: "Sampling & CLT intuition",
      description:
        "Covers sampling distributions, the central limit theorem, and confidence intervals.",
    },
    {
      id: "causal-dag-literacy",
      label: "Causal DAG literacy",
      description:
        "Covers DAGs, confounders, mediators, colliders, and adjustment choices.",
    },
  ],
  // English course: same reasoning as claude/codex above.
  "data-infrastructure": [
    {
      id: "system-design-tradeoffs",
      label: "System-design trade-offs",
      description:
        "Covers CAP and PACELC trade-offs against latency and freshness targets.",
    },
    {
      id: "storage-format-internals",
      label: "Storage-format internals",
      description:
        "Covers row and columnar layouts, Parquet row groups, predicate pushdown, and lakehouse formats.",
    },
    {
      id: "ic5-interview-structure",
      label: "IC5 interview structure",
      description:
        "Covers a five-part system-design interview structure from clarification through trade-offs.",
    },
  ],
  // English course: same reasoning as claude/codex above.
  "ai-native-operator": [
    {
      id: "maturity-self-diagnosis",
      label: "Honest AI-maturity self-diagnosis",
      description:
        "Covers task-specific AI maturity, trust calibration, and error costs.",
    },
    {
      id: "spec-first-delegation",
      label: "Spec-first delegation",
      description:
        "Covers bounded agent specifications with goals, non-goals, and test cases.",
    },
    {
      id: "governance-as-speed",
      label: "Governance as a speed enabler",
      description:
        "Covers model registries, evaluation-driven release gates, and agent-identity audit trails.",
    },
  ],
};

const COURSE_TITLE: Record<string, string> = Object.fromEntries(
  COURSE_CATALOG.map((c) => [c.slug, c.title]),
);

type CourseOutcomeCopy = Pick<CourseOutcome, "label" | "description">;

/**
 * Only copy that differs from an outcome's source language belongs here.
 * Stable outcome IDs remain the cross-locale identity.
 */
const ENGLISH_COURSE_OUTCOME_COPY: Readonly<Record<string, CourseOutcomeCopy>> =
  {
    "ki-grundlagen-verstehen": {
      label: "Understand AI fundamentals",
      description:
        "Covers what AI systems can do, their limits, and common failure modes.",
    },
    "eu-ai-act-artikel-4": {
      label: "EU AI Act, Article 4",
      description:
        "Covers the duty to provide context-specific AI literacy measures at work.",
    },
    "ki-output-pruefen": {
      label: "Review AI output",
      description: "Covers critical review and documentation of AI output.",
    },
    "ki-und-arbeit-einordnen": {
      label: "Put AI and work in context",
      description:
        "Covers effects of AI on work and society without overclaiming.",
    },
    "deepfakes-erkennen": {
      label: "Recognise deepfakes",
      description: "Covers manipulated media and common signs of fabrication.",
    },
    "bias-und-ethik": {
      label: "Bias and ethics",
      description:
        "Covers causes of algorithmic bias and relevant ethical limits.",
    },
    "risikoklassen-einordnen": {
      label: "Classify risk categories",
      description: "Covers EU AI Act risk categories and Annex III.",
    },
    "pflichten-hochrisiko-gpai": {
      label: "Duties for high-risk AI and GPAI",
      description:
        "Covers requirements for high-risk systems and general-purpose AI.",
    },
    "eu-ai-act-umsetzen": {
      label: "Plan implementation",
      description:
        "Covers implementation planning and applicable deadlines through 2028.",
    },
    "ai-native-arbeiten": {
      label: "Work with AI systematically",
      description: "Covers intent, context, and systematic output review.",
    },
    "claude-stack-nutzen": {
      label: "Use the Claude tool stack",
      description: "Covers Projects, Skills, and MCP for repeatable tasks.",
    },
    "automatisierung-mit-governance": {
      label: "Automation with governance",
      description:
        "Covers n8n automation, explicit controls, and EU AI Act boundaries.",
    },
  };

const GERMAN_COURSE_OUTCOME_COPY: Readonly<Record<string, CourseOutcomeCopy>> =
  {
    "structured-prompting": {
      label: "Strukturiertes Prompting",
      description:
        "Behandelt Rolle, Kontext, Aufgabe, Grenzen, Beispiele und Ausgabeformat.",
    },
    "context-engineering": {
      label: "Kontextgestaltung",
      description:
        "Behandelt Datengrundlage und bewusste Strukturierung des Kontextfensters.",
    },
    "safe-team-workflows": {
      label: "Sichere Team-Workflows",
      description:
        "Behandelt sichere Freigabe von Prompts und CLAUDE.md-Dateien, Tests und Datengrenzen.",
    },
    "task-spec-authoring": {
      label: "Aufgabenspezifikationen verfassen",
      description:
        "Behandelt Ziel, Grenzen, Akzeptanzkriterien und Nicht-Ziele für Coding-Agenten.",
    },
    "agent-pr-review": {
      label: "Agenten-PRs prüfen",
      description:
        "Behandelt Prüfungen auf zirkuläre Tests, unnötigen Umfang und Sicherheitslücken.",
    },
    "parallel-agent-workflows": {
      label: "Parallele Agenten-Workflows",
      description:
        "Behandelt Aufgabenteilung und konfliktarme parallele Arbeit in Git-Worktrees.",
    },
    "idempotent-pipeline-writes": {
      label: "Idempotente Pipeline-Schreibvorgänge",
      description:
        "Behandelt wiederholbare Schreibvorgänge für sichere Retries und Backfills.",
    },
    "streaming-boundary-guards": {
      label: "Schutz an Streaming-Grenzen",
      description:
        "Behandelt Ereignis-Deduplizierung und Watermarks als unabhängige Schutzmechanismen.",
    },
    "data-quality-signal-barrier": {
      label: "Freigabe durch Datenqualitätssignal",
      description:
        "Behandelt explizite Freigabesignale nach bestandenen Qualitätsprüfungen.",
    },
    "metric-before-model": {
      label: "Metrik vor dem Modell wählen",
      description:
        "Behandelt die Wahl von Bewertungsmetriken anhand realer Fehlerkosten.",
    },
    "sampling-clt-intuition": {
      label: "Stichproben und zentralen Grenzwertsatz einordnen",
      description:
        "Behandelt Stichprobenverteilungen, zentralen Grenzwertsatz und Konfidenzintervalle.",
    },
    "causal-dag-literacy": {
      label: "Kausale Diagramme lesen",
      description:
        "Behandelt DAGs, Confounder, Mediatoren, Collider und Anpassungsentscheidungen.",
    },
    "system-design-tradeoffs": {
      label: "Zielkonflikte im Systemdesign",
      description:
        "Behandelt CAP- und PACELC-Zielkonflikte sowie Latenz- und Aktualitätsziele.",
    },
    "storage-format-internals": {
      label: "Interna von Speicherformaten",
      description:
        "Behandelt Zeilen- und Spaltenlayout, Parquet-Row-Groups und Tabellenformate.",
    },
    "ic5-interview-structure": {
      label: "IC5-Systemdesign-Interview strukturieren",
      description:
        "Behandelt eine feste Interviewstruktur von Anforderungen bis Zielkonflikten.",
    },
    "maturity-self-diagnosis": {
      label: "KI-Reife nüchtern einordnen",
      description:
        "Behandelt aufgabenspezifische KI-Reife, Prüfpraxis und Fehlerkosten.",
    },
    "spec-first-delegation": {
      label: "Delegation mit Spezifikation",
      description:
        "Behandelt abgegrenzte Agentenspezifikationen mit Ziel, Nicht-Zielen und Tests.",
    },
    "governance-as-speed": {
      label: "Governance als Betriebskontrolle",
      description:
        "Behandelt Modellregister, Evaluationsgates und Agentenidentität als Betriebskontrollen.",
    },
  };

function localizeCourseOutcome(
  outcome: CourseOutcome,
  locale: Locale,
): CourseOutcome {
  const copy =
    locale === "en"
      ? ENGLISH_COURSE_OUTCOME_COPY[outcome.id]
      : GERMAN_COURSE_OUTCOME_COPY[outcome.id];
  return copy ? { ...outcome, ...copy } : outcome;
}

/**
 * True when a course's record has been earned — the SAME bar as the
 * certificate: all canonical lessons plus the configured final assessment.
 * Returns false for a missing slice or null progress.
 */
export function isCourseRecordEarned(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): boolean {
  return isCourseCompletionEarned(progress, slug);
}

/**
 * Outcomes covered by courses whose record gate is complete, in course order.
 * This does not claim that the learner demonstrated each outcome.
 */
export function coveredCourseOutcomes(
  progress: UnifiedProgress | null,
  locale: Locale = "de",
): readonly CoveredCourseOutcome[] {
  if (!progress) return [];
  const covered: CoveredCourseOutcome[] = [];
  for (const course of COURSE_CATALOG) {
    if (!isCourseRecordEarned(progress, course.slug)) continue;
    for (const outcome of COURSE_OUTCOMES[course.slug] ?? []) {
      const localizedOutcome = localizeCourseOutcome(outcome, locale);
      const localizedCourse = localizeCatalogCourse(course, locale);
      covered.push({
        ...localizedOutcome,
        courseSlug: course.slug,
        courseTitle:
          localizedCourse.title ?? COURSE_TITLE[course.slug] ?? course.title,
      });
    }
  }
  return covered;
}

/** Total number of outcomes covered across courses with published outcome lists. */
export function totalCourseOutcomeCount(): number {
  return Object.values(COURSE_OUTCOMES).reduce(
    (sum, list) => sum + list.length,
    0,
  );
}

/** Covered vs total course-outcome counts, for a headline like "7 von 12". */
export function courseOutcomeCoverage(progress: UnifiedProgress | null): {
  readonly covered: number;
  readonly total: number;
} {
  return {
    covered: coveredCourseOutcomes(progress).length,
    total: totalCourseOutcomeCount(),
  };
}
