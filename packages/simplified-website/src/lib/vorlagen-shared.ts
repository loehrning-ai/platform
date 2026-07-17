/**
 * Shared types and constants for the Governance-Vorlagen surface.
 *
 * This module is safe to import from both server components and client
 * components. The server-only file `@/lib/vorlagen.ts` adds filesystem loading
 * on top of these types.
 */

export type VorlageCategory = "pflicht" | "hygiene" | "werkzeug";

export interface VorlageDownload {
  readonly format: "md" | "pdf" | "csv";
  readonly label: string;
  readonly href: string;
  readonly bytesApprox?: number;
}

export interface VorlageSource {
  readonly title: string;
  readonly url: string;
}

export interface VorlageMeta {
  readonly slug: string;
  readonly title: string;
  readonly category: VorlageCategory;
  readonly pflicht: boolean;
  readonly articleRefs: readonly string[];
  readonly pages: number;
  readonly jobToBeDone: string;
  readonly audience: readonly string[];
  readonly estReadMinutes: number;
  readonly estCompleteMinutes: number;
  readonly relatedSlugs: readonly string[];
  readonly editorNotes: readonly string[];
  readonly sources: readonly VorlageSource[];
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly riskClass: string;
  readonly downloads: readonly VorlageDownload[];
}

export interface Vorlage extends VorlageMeta {
  readonly body: string;
}

export const CATEGORY_LABELS: Record<VorlageCategory, string> = {
  pflicht: "Compliance-Pflicht",
  hygiene: "Governance-Hygiene",
  werkzeug: "Operative Werkzeuge",
};

export const CATEGORY_DESCRIPTIONS: Record<VorlageCategory, string> = {
  pflicht: "Gesetzlich gefordert oder bei Hochrisiko-Systemen Pflicht.",
  hygiene:
    "Aufsichtsfeste Governance-Artefakte für Audit, Datenschutz und Vendor-Steuerung.",
  werkzeug: "Entscheidungshilfen für Priorisierung und strukturierte Umsetzung.",
};
