import type { LearningStage } from "@/lib/learning-graph/types";
import type { Locale } from "@/lib/i18n/locale";

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
  readonly language: Locale;
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
const metaDe = require("../../content/wie-ki-funktioniert/meta.json") as WieKiMeta;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l1De = require("../../content/wie-ki-funktioniert/lektion-1-vorhersage.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l2De = require("../../content/wie-ki-funktioniert/lektion-2-trainingsdaten.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l3De = require("../../content/wie-ki-funktioniert/lektion-3-halluzinationen.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l4De = require("../../content/wie-ki-funktioniert/lektion-4-grenzen.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const metaEn = require("../../content/wie-ki-funktioniert/en/meta.json") as WieKiMeta;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l1En = require("../../content/wie-ki-funktioniert/en/lektion-1-vorhersage.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l2En = require("../../content/wie-ki-funktioniert/en/lektion-2-trainingsdaten.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l3En = require("../../content/wie-ki-funktioniert/en/lektion-3-halluzinationen.json") as WieKiLektion;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const l4En = require("../../content/wie-ki-funktioniert/en/lektion-4-grenzen.json") as WieKiLektion;

export interface WieKiContentBundle {
  readonly meta: WieKiMeta;
  readonly lektionen: readonly WieKiLektion[];
}

const CONTENT_BY_LOCALE: Readonly<Record<Locale, WieKiContentBundle>> = {
  de: {
    meta: metaDe,
    lektionen: [l1De, l2De, l3De, l4De],
  },
  en: {
    meta: metaEn,
    lektionen: [l1En, l2En, l3En, l4En],
  },
};

export const WIE_KI_META: WieKiMeta = CONTENT_BY_LOCALE.de.meta;

export const WIE_KI_LEKTIONEN: readonly WieKiLektion[] =
  CONTENT_BY_LOCALE.de.lektionen;

export function getWieKiContent(locale: Locale): WieKiContentBundle {
  return CONTENT_BY_LOCALE[locale];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getLektionById(
  id: string,
  locale: Locale = "de",
): WieKiLektion | undefined {
  return getWieKiContent(locale).lektionen.find((l) => l.id === id);
}

export function getPrevLektion(
  id: string,
  locale: Locale = "de",
): WieKiLektion | undefined {
  const lektionen = getWieKiContent(locale).lektionen;
  const idx = lektionen.findIndex((l) => l.id === id);
  return idx > 0 ? lektionen[idx - 1] : undefined;
}

export function getNextLektion(
  id: string,
  locale: Locale = "de",
): WieKiLektion | undefined {
  const lektionen = getWieKiContent(locale).lektionen;
  const idx = lektionen.findIndex((l) => l.id === id);
  return idx >= 0 && idx < lektionen.length - 1
    ? lektionen[idx + 1]
    : undefined;
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

export function formatReviewDate(isoDate: string, locale: Locale): string {
  if (locale === "de") return formatGermanDate(isoDate);

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
