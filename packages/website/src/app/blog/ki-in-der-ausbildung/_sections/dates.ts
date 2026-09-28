/**
 * Legal dates for post Nº 02 come from the legal registry, never from copy
 * literals. German shows the registry's displayDateDE; English formats the
 * ISO date. Route states compare with the sheet's lastReviewed, never with
 * the clock, so the page renders the same on every request.
 */

import { requireLegalClaim } from "@/lib/legal-registry";
import type { Locale } from "@/lib/i18n/locale";
import { formatSheetDate } from "@/lib/vorlagen/question-sheet";

function isoOf(claimId: string): string {
  const claim = requireLegalClaim(claimId);
  const iso = claim.effectiveDate ?? claim.enforcementDate;
  if (!iso) throw new Error(`legal claim ${claimId} has no date`);
  return iso;
}

export function claimIso(claimId: string): string {
  return isoOf(claimId);
}

export function claimDate(claimId: string, locale: Locale): string {
  const claim = requireLegalClaim(claimId);
  if (locale === "de" && claim.displayDateDE) return claim.displayDateDE;
  return formatSheetDate(isoOf(claimId), locale);
}

/**
 * "1. Oktober 2026 bis 30. November 2026" (full), or the compact prose form
 * "1. Oktober bis 30. November 2026" when both dates share a year.
 */
export function claimRange(
  startId: string,
  endId: string,
  locale: Locale,
  { compact }: { compact: boolean },
): string {
  const start = claimDate(startId, locale);
  const end = claimDate(endId, locale);
  const joiner = locale === "de" ? " bis " : " to ";
  const startYear = isoOf(startId).slice(0, 4);
  const sameYear = startYear === isoOf(endId).slice(0, 4);
  const first =
    compact && sameYear && start.endsWith(` ${startYear}`)
      ? start.slice(0, -(startYear.length + 1))
      : start;
  return `${first}${joiner}${end}`;
}

export type StationState = "past" | "current" | "future";

/**
 * past: the (end) date is on or before the review date; current: the review
 * date falls inside the window; future: everything else.
 */
export function stationState(
  startIso: string,
  endIso: string,
  reviewedIso: string,
): StationState {
  if (endIso <= reviewedIso) return "past";
  if (startIso <= reviewedIso) return "current";
  return "future";
}
