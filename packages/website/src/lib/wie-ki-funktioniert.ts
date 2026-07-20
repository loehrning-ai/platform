import type { LearningStage } from "@/lib/learning-graph/types";

// ---------------------------------------------------------------------------
// TypeScript interfaces
// ---------------------------------------------------------------------------

export interface WieKiSection {
  readonly id: string;
  readonly title: string;
  readonly readTimeMinutes: number;
  readonly content: string;
  readonly keyTakeaway: string;
}

export interface WieKiLektion {
  readonly id: string;
  readonly blockId: string;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly keyConcepts: readonly string[];
  readonly sections: readonly WieKiSection[];
}

export interface WieKiMeta {
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly lessonCount: number;
  readonly stage: LearningStage;
  readonly access: "public";
  readonly language: "de";
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly reviewCadence: string;
  readonly riskClass: string;
  readonly owner: string;
}

// ---------------------------------------------------------------------------
// Static data — loaded at module import time (SSG-friendly, no I/O at runtime)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const metaRaw = require("../../content/wie-ki-funktioniert/meta.json") as WieKiMeta;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l1 = require("../../content/wie-ki-funktioniert/lektion-1-vorhersage.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l2 = require("../../content/wie-ki-funktioniert/lektion-2-trainingsdaten.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l3 = require("../../content/wie-ki-funktioniert/lektion-3-halluzinationen.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l4 = require("../../content/wie-ki-funktioniert/lektion-4-grenzen.json") as WieKiLektion;

export const WIE_KI_META: WieKiMeta = metaRaw;

export const WIE_KI_LEKTIONEN: readonly WieKiLektion[] = [l1, l2, l3, l4];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getLektionById(id: string): WieKiLektion | undefined {
  return WIE_KI_LEKTIONEN.find((l) => l.id === id);
}

export function getPrevLektion(id: string): WieKiLektion | undefined {
  const idx = WIE_KI_LEKTIONEN.findIndex((l) => l.id === id);
  return idx > 0 ? WIE_KI_LEKTIONEN[idx - 1] : undefined;
}

export function getNextLektion(id: string): WieKiLektion | undefined {
  const idx = WIE_KI_LEKTIONEN.findIndex((l) => l.id === id);
  return idx >= 0 && idx < WIE_KI_LEKTIONEN.length - 1 ? WIE_KI_LEKTIONEN[idx + 1] : undefined;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const GERMAN_MONTHS: readonly string[] = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/** Converts ISO date string like "2026-06-22" to "Juni 2026" */
export function formatGermanDate(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const monthNum = parseInt(month ?? "1", 10);
  const monthName = GERMAN_MONTHS[monthNum - 1] ?? "unbekannt";
  return `${monthName} ${year}`;
}
