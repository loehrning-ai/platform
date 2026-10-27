/**
 * Scene 1: the shelf card's three parts and the certificate lines that carry
 * them. A connection from a part to a line is a quote (Zitat: Datei und
 * Zeile). The accepted lines come from loesungen/LOESUNGEN.md, Durchsicht
 * rows 4 and 5, and the certificate's line 4 (the inspection body); the
 * tests read them back from the kit. A connection to any other line is not
 * wrong in a scoring sense: the copy pack says what that line says instead
 * and where to look (one hint per part and line).
 */
import { CERT_LINE, CERT_LINES } from "./kit";
import { weakest, type Status } from "./rules";

/** „Zertifizierte" (who says so), „Bio-Weinberge, alle Weine" (what it covers), „Stichtag 16.10.2026" (when). */
export const PARTS = ["zertifiziert", "flaeche", "stichtag"] as const;
export type PartId = (typeof PARTS)[number];

/** A document that does not exist yet, named so someone can ask for it. */
export type SlotId = "restCertificate" | "renewedCertificate";

export interface Thread {
  /** The line the guide glows after three misses. */
  readonly target: number;
  /** Every line that carries this part. */
  readonly accepted: readonly number[];
  /** What the quote proves on the Stichtag. */
  readonly status: Status;
  /** The empty document slot the connection runs on into, if the file does not cover the part. */
  readonly slot: SlotId | null;
}

export const THREADS: Readonly<Record<PartId, Thread>> = {
  // Lines 3 and 4: the certificate and the body that issued it. Freigabe and Zitat hold.
  zertifiziert: { target: CERT_LINE.body, accepted: [CERT_LINE.title, CERT_LINE.body], status: "belegt", slot: null },
  // Lines 6, 10, 11: 12 of 40 ha, the other 28 ha and the cellar are not certified (Umfang).
  flaeche: { target: CERT_LINE.scope, accepted: [CERT_LINE.scope, CERT_LINE.rest, CERT_LINE.cellar], status: "luecke", slot: "restCertificate" },
  // Lines 7 to 9: valid until 31.08.2026, renewal booked for 22.10.2026; on 16.10.2026 it has expired (Zeitraum).
  stichtag: { target: CERT_LINE.until, accepted: [CERT_LINE.from, CERT_LINE.until, CERT_LINE.renewal], status: "schwach", slot: "renewedCertificate" },
};

export interface Landing {
  readonly accepted: boolean;
  readonly status: Status | null;
}

/** What happens when a part is dropped on a line. Lines that do not exist never land. */
export function land(part: PartId, line: number): Landing {
  if (!(CERT_LINES as readonly number[]).includes(line)) return { accepted: false, status: null };
  const thread = THREADS[part];
  return thread.accepted.includes(line) ? { accepted: true, status: thread.status } : { accepted: false, status: null };
}

/** Lines that need a hint for a part: every certificate line that does not carry it. */
export function hintLines(part: PartId): readonly number[] {
  return CERT_LINES.filter((line) => !THREADS[part].accepted.includes(line));
}

/** After three misses on one part the guide glows its line and offers "Zeig mir die Zeile". */
export const MISSES_BEFORE_HELP = 3;

/** The card's status once every part has a quote: the weakest part decides. Null while one is open. */
export function verdict(links: Readonly<Partial<Record<PartId, number>>>): Status | null {
  const statuses: Status[] = [];
  for (const part of PARTS) {
    const line = links[part];
    if (line === undefined) return null;
    const landing = land(part, line);
    if (!landing.status) return null;
    statuses.push(landing.status);
  }
  return weakest(statuses);
}
