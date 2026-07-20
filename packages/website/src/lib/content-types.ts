/**
 * Shared content-type definitions for the KI-Kompetenzweg learning platform.
 *
 * These interfaces extend the existing lesson JSON structure (blockId → lessons[]
 * → sections[] → { content, keyTakeaway }) with optional source provenance fields.
 * Existing JSON without these fields remains valid (all fields are optional).
 *
 * Ownership: legal-source governance (legal-source-editorial-governance)
 * Extended by course-specific rewrites and the content-freshness governance cadence.
 */

/**
 * Source reference for a lesson section or quiz explanation.
 *
 * Used to link a factual or legal claim to its primary source.
 * At least one of `claimId` or `sourceUrl` should be provided for non-trivial claims.
 */
export interface LessonSourceRef {
  /** References a claimId in src/lib/legal-registry.ts (for legal/regulatory claims) */
  claimId?: string;
  /** Direct URL for non-legal factual claims (e.g. Bitkom study, BSI report) */
  sourceUrl?: string;
  /** Human-readable source name: "Bitkom KI-Studie 2025", "EU AI Office GPAI Guidance" */
  sourceTitle?: string;
  /** Year or precise month-year: "2025" or "Mai 2025" */
  sourceYear?: string;
  /** ISO date when this source reference was last verified: "2026-06-20" */
  lastVerified?: string;
  /**
   * If true, the section contains a deliberate simplification.
   * Renderer should add: "Diese Erklärung vereinfacht bewusst — in der rechtlichen Praxis
   * gibt es Ausnahmen."
   */
  simplified?: boolean;
}

/**
 * Optional source metadata for a lesson section.
 * Added to `sections[]` items in course JSON.
 */
export interface SectionSourceMeta {
  sources?: LessonSourceRef[];
}

/**
 * Optional source metadata for a quiz answer explanation.
 * Added to `quiz[].explanation`-bearing objects in course JSON.
 */
export interface QuizSourceMeta {
  sources?: LessonSourceRef[];
}

