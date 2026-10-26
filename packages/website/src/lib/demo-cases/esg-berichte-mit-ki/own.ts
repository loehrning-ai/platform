/**
 * "Deine Sätze": the Nachweisprobe applied to the visitor's own sentence. It
 * judges what the visitor says about the file, not the file itself, with
 * fixed rules and no text scanning. Pure: the form state goes in, a status,
 * reasons, ban-list hits and the missing document come out, as codes the
 * copy pack words. Nothing here touches the network or browser storage.
 */
import { daysBetween, parseDate, weakest, type CalendarDate, type Status } from "./rules";

export const MAX_SENTENCE = 280;
export const MAX_ROWS = 20;

export const DESTINATIONS = ["questionnaire", "bank", "label", "website"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const EVIDENCE = [
  "bills",
  "certificate",
  "audit",
  "measurement",
  "statement",
  "offer",
  "draft",
  "offset",
  "nothing",
] as const;
export type Evidence = (typeof EVIDENCE)[number];

export type Scope = "yes" | "part" | "unsure";
export type Final = "yes" | "no" | "unsure";
export type GateId = "4c" | "4a" | "4b" | "2a" | "zukunft";
export const GATE_IDS: readonly GateId[] = ["4c", "4a", "4b", "2a", "zukunft"];

export interface OwnInput {
  readonly sentence: string;
  readonly destination: Destination;
  readonly evidence: Evidence;
  /** Months Jan to Dec the bills or measurements cover. */
  readonly months: readonly boolean[];
  /** The sentence speaks about the whole year (otherwise about the ticked months). */
  readonly wholeYear: boolean;
  /** TT.MM.JJJJ, for a certificate, audit or declaration. */
  readonly validUntil: string;
  /** TT.MM.JJJJ, the day the answer leaves the company. */
  readonly stichtag: string;
  readonly scope: Scope;
  readonly final: Final;
  /** Ban-list answers; undefined = not answered (4b then follows the scope answer). */
  readonly gates: Readonly<Partial<Record<GateId, boolean>>>;
  /** Only asked when "zukunft" is yes: a detailed plan, checked by independent experts. */
  readonly plan?: boolean;
}

export const EMPTY_INPUT: OwnInput = {
  sentence: "",
  destination: "questionnaire",
  evidence: "bills",
  months: Array.from({ length: 12 }, () => false),
  wholeYear: true,
  validUntil: "",
  stichtag: "",
  scope: "yes",
  final: "yes",
  gates: {},
};

/** Control characters out, length capped: what the visitor typed renders as text only. */
export function cleanSentence(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_SENTENCE);
}

export const isConsumer = (destination: Destination) => destination === "label" || destination === "website";
export const usesMonths = (evidence: Evidence) => evidence === "bills" || evidence === "measurement";
export const usesValidity = (evidence: Evidence) => evidence === "certificate" || evidence === "audit" || evidence === "statement";
/** A signed declaration is dated, not limited: its expiry date is optional. */
export const validityOptional = (evidence: Evidence) => evidence === "statement";
/** An offer, a draft or an offset certificate is never final. */
export const forcesNotFinal = (evidence: Evidence) => evidence === "offer" || evidence === "draft" || evidence === "offset";

export type FieldError = "sentenceEmpty" | "validUntilFormat" | "stichtagFormat" | "stichtagNeeded";
export type CheckState = "ok" | "fail" | "open";

export type Reason =
  | { readonly code: "nothing" }
  | { readonly code: "noMonths" }
  | { readonly code: "monthsMissing"; readonly months: readonly number[] }
  | { readonly code: "expired"; readonly days: number; readonly validUntil: string }
  | { readonly code: "noValidity" }
  | { readonly code: "noStichtag" }
  | { readonly code: "scopePart" }
  | { readonly code: "notFinal"; readonly evidence: Evidence }
  | { readonly code: "gate"; readonly gate: GateId };

export type MissingDoc =
  | { readonly code: "nothing" }
  | { readonly code: "months"; readonly months: readonly number[]; readonly year: number | null }
  | { readonly code: "valid"; readonly evidence: Evidence; readonly stichtag: string }
  | { readonly code: "signed" }
  | { readonly code: "released" }
  | { readonly code: "rest" };

export interface OwnResult {
  readonly status: Status;
  /** Consumer claims: "raus" or "streichen"; answers to customers and banks go out with their status. */
  readonly decision: "raus" | "streichen" | "mitStatus";
  readonly checks: { readonly zeitraum: CheckState; readonly umfang: CheckState; readonly stand: CheckState };
  readonly reasons: readonly Reason[];
  readonly gates: readonly GateId[];
  readonly missing: readonly MissingDoc[];
}

/** Field errors shown inline under the field; an empty list means the probe can run. */
export function validate(input: OwnInput): readonly FieldError[] {
  const errors: FieldError[] = [];
  if (cleanSentence(input.sentence) === "") errors.push("sentenceEmpty");
  if (input.evidence !== "nothing" && usesValidity(input.evidence)) {
    if (input.validUntil.trim() !== "" && !parseDate(input.validUntil)) errors.push("validUntilFormat");
    if (input.stichtag.trim() === "") {
      if (input.validUntil.trim() !== "") errors.push("stichtagNeeded");
    } else if (!parseDate(input.stichtag)) errors.push("stichtagFormat");
  }
  return errors;
}

/** The ban-list answers as they count: 4b follows "only a part" until the visitor answers it. */
export function effectiveGates(input: OwnInput): readonly GateId[] {
  if (!isConsumer(input.destination)) return [];
  const hits: GateId[] = [];
  for (const gate of GATE_IDS) {
    const answer = input.gates[gate];
    const yes = gate === "4b" && answer === undefined ? input.scope !== "yes" : answer === true;
    if (!yes) continue;
    if (gate === "zukunft" && input.plan === true) continue;
    hits.push(gate);
  }
  return hits;
}

/** The first year the sentence names (2000 to 2099), so a request names it too: "Rechnungen für September 2025". */
export function sentenceYear(sentence: string): number | null {
  const match = /(?:^|\D)(20\d{2})(?!\d)/.exec(sentence);
  return match ? Number(match[1]) : null;
}

function missingMonths(months: readonly boolean[]): number[] {
  return months.flatMap((ticked, index) => (ticked ? [] : [index + 1]));
}

/**
 * The probe: ban list first for consumer claims, then Zeitraum, Umfang and
 * Freigabe; the weakest part decides. Precedence: a ban-list hit cuts the claim,
 * a part without a file is a LÜCKE, a part on an expired, estimated, draft or
 * unsigned file is SCHWACH, otherwise BELEGT.
 */
export function probeOwn(input: OwnInput): OwnResult {
  const gates = effectiveGates(input);
  const consumer = isConsumer(input.destination);
  const reasons: Reason[] = gates.map((gate) => ({ code: "gate", gate }) as const);
  const missing: MissingDoc[] = [];
  const year = sentenceYear(input.sentence);

  if (input.evidence === "nothing") {
    return {
      status: "luecke",
      decision: consumer ? "streichen" : "mitStatus",
      checks: { zeitraum: "open", umfang: "open", stand: "open" },
      reasons: [...reasons, { code: "nothing" }],
      gates,
      missing: [{ code: "nothing" }],
    };
  }

  const parts: Status[] = [];
  let zeitraum: CheckState = "ok";
  if (usesMonths(input.evidence)) {
    const ticked = input.months.filter(Boolean).length;
    if (ticked === 0) {
      zeitraum = "fail";
      parts.push("luecke");
      reasons.push({ code: "noMonths" });
      missing.push({ code: "months", months: missingMonths(input.months), year });
    } else if (input.wholeYear && ticked < 12) {
      zeitraum = "fail";
      parts.push("luecke");
      const gaps = missingMonths(input.months);
      reasons.push({ code: "monthsMissing", months: gaps });
      missing.push({ code: "months", months: gaps, year });
    }
  } else if (usesValidity(input.evidence)) {
    const until = parseDate(input.validUntil);
    const reference = parseDate(input.stichtag);
    if (!until) {
      if (!validityOptional(input.evidence)) {
        zeitraum = "open";
        parts.push("schwach");
        reasons.push({ code: "noValidity" });
      }
    } else if (reference && daysBetween(until, reference) > 0) {
      zeitraum = "fail";
      parts.push("schwach");
      reasons.push({ code: "expired", days: daysBetween(until, reference), validUntil: formatDate(until) });
      missing.push({ code: "valid", evidence: input.evidence, stichtag: formatDate(reference) });
    } else if (!reference) {
      zeitraum = "open";
      parts.push("schwach");
      reasons.push({ code: "noStichtag" });
    }
  }

  let umfang: CheckState = "ok";
  if (input.scope !== "yes") {
    umfang = "fail";
    parts.push("luecke");
    reasons.push({ code: "scopePart" });
    missing.push({ code: "rest" });
  }

  let stand: CheckState = "ok";
  if (forcesNotFinal(input.evidence) || input.final !== "yes") {
    stand = "fail";
    parts.push("schwach");
    reasons.push({ code: "notFinal", evidence: input.evidence });
    if (input.evidence === "offer") missing.push({ code: "signed" });
    if (input.evidence === "draft") missing.push({ code: "released" });
  }

  const status = weakest(parts);
  const decision = consumer ? (gates.length === 0 && status === "belegt" ? "raus" : "streichen") : "mitStatus";
  return { status, decision, checks: { zeitraum, umfang, stand }, reasons, gates, missing };
}

export function formatDate(date: CalendarDate): string {
  return `${String(date.day).padStart(2, "0")}.${String(date.month).padStart(2, "0")}.${date.year}`;
}

/** One row of the visitor's list. */
export interface OwnRow {
  readonly sentence: string;
  readonly destination: Destination;
  readonly evidence: Evidence;
  readonly result: OwnResult;
  /** The safe wording, or null when the claim is cut. */
  readonly safe: string | null;
  readonly period: string;
}

/** Adds a row unless the list is full; returns the same list when it is. */
export function addRow(rows: readonly OwnRow[], next: OwnRow): readonly OwnRow[] {
  return rows.length >= MAX_ROWS ? rows : [...rows, next];
}

/**
 * The "Eigene Angabe prüfen" door: four segmented rows, one control each
 * (Zitat, Zeitraum, Umfang, Freigabe), plus one switch for a marketing claim.
 * fromClaim() maps them onto the probe's input, so the rules above stay the
 * only place that decides a status.
 */
export interface ClaimInput {
  readonly sentence: string;
  /** "Datei und Zeile bekannt" or "Weiß ich nicht". */
  readonly zitat: "known" | "unknown";
  readonly file: string;
  readonly line: string;
  /** Monthly values (bills, readings) or a document valid until a date. */
  readonly zeitraum: "months" | "validUntil";
  readonly months: readonly boolean[];
  readonly validUntil: string;
  readonly stichtag: string;
  readonly umfang: "all" | "part" | "unsure";
  readonly freigabe: "yes" | "no" | "unsure";
  /** For a label, a shelf or a website: the ban list comes first. */
  readonly marketing: boolean;
  readonly gates: Readonly<Partial<Record<GateId, boolean>>>;
}

export const EMPTY_CLAIM: ClaimInput = {
  sentence: "",
  zitat: "known",
  file: "",
  line: "",
  zeitraum: "months",
  months: Array.from({ length: 12 }, () => true),
  validUntil: "",
  stichtag: "",
  umfang: "all",
  freigabe: "yes",
  marketing: false,
  gates: {},
};

export function fromClaim(claim: ClaimInput): OwnInput {
  const evidence: Evidence = claim.zitat === "unknown" ? "nothing" : claim.zeitraum === "months" ? "bills" : "certificate";
  return {
    sentence: claim.sentence,
    destination: claim.marketing ? "website" : "questionnaire",
    evidence,
    months: claim.months,
    wholeYear: true,
    validUntil: claim.validUntil,
    stichtag: claim.stichtag,
    scope: claim.umfang === "all" ? "yes" : claim.umfang === "part" ? "part" : "unsure",
    final: claim.freigabe,
    gates: claim.gates,
  };
}

/** "strom_2025.csv, Zeile 3" as the visitor typed it, or "" when the quote is not known. */
export function quoteOf(claim: ClaimInput): string {
  if (claim.zitat === "unknown") return "";
  // eslint-disable-next-line no-control-regex -- a file name must not carry control characters into the sheet
  const file = claim.file.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80);
  const line = claim.line.replace(/[^\d,\s-]/g, "").trim().slice(0, 20);
  return [file, line].filter(Boolean).join(" ");
}
