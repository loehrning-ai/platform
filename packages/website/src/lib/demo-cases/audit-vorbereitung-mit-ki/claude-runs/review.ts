/**
 * Our review of the recorded W05 takes (concept 6.6 and 6.7). The takes stay
 * untouched; this file says which take each question shows, and how a
 * reviewer read every quote mark the page would otherwise call "in keiner
 * Datei". A mark without an entry here fails v4.test.ts, so no take ships
 * with an unread "missing" mark.
 *
 * Verdicts:
 * - "not-a-claim": the quotation marks hold Claude's own words (a field name
 *   in German, a sentence it proposes to write), not a claim about a file.
 *   The page drops the mark.
 * - "confirmed": the text is presented as a quote and stands in no attached
 *   file. The page shows the mark.
 *
 * The reviews below were made on 27 October 2026 while building the scene,
 * by reading each mark in its take next to the kit files.
 */

export type MarkVerdict = "not-a-claim" | "confirmed";

export interface MarkReview {
  readonly verdict: MarkVerdict;
  readonly note: string;
}

export interface TakeReview {
  /** The take this question and variant shows first (one per question, locale and variant). */
  readonly selected?: true;
  /** By the quote as the probe reads it. */
  readonly marks?: Readonly<Record<string, MarkReview>>;
}

export const REVIEWED_ON = "2026-10-27";

export const TAKE_REVIEW: Readonly<Record<string, TakeReview>> = {
  "de-r7-with-1": { selected: true },
  "de-r7-without-1": { selected: true },
  "de-alle-with-1": {
    selected: true,
    marks: {
      "Rechtsgrundlage für die Übermittlung": {
        verdict: "not-a-claim",
        note: "Claude names the empty CSV column transfer_basis in German, next to „letzte Prüfung“ for last_review. It quotes no sentence of the file.",
      },
    },
  },
  "de-alle-without-5": {
    selected: true,
    marks: {
      "nur nach schriftlicher Mitteilung": {
        verdict: "confirmed",
        note: "Claude puts a German rendering of clause 7 (\"only after written notice\") in quotation marks. The request says it in English, so the quote is not verbatim.",
      },
      "keine weiteren Vorfälle mit Tannwald-Daten im Log": {
        verdict: "not-a-claim",
        note: "A note Claude proposes to add to the incident extract („mit dem Hinweis …“), not a quote from the log.",
      },
    },
  },
  "en-r7-with-1": { selected: true },
  "en-r7-without-1": { selected: true },
  "en-alle-with-1": { selected: true },
  "en-alle-without-1": { selected: true },
};

export function reviewOf(takeId: string): TakeReview {
  return TAKE_REVIEW[takeId] ?? {};
}
