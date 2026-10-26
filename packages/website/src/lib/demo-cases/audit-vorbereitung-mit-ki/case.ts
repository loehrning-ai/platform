/**
 * The Vardar case as the demo reads it: the eight request items with their
 * verbatim English text (parsed from request_tannwald.md), what each item
 * needs (scope, a record rather than a policy, a computed threshold), the
 * files a name match links them to, the candidate files and where the
 * answering words sit in each. No status lives here: evidence.ts computes
 * every status from the kit texts.
 */

import type { ItemId } from "./classify";
import { kitText, type FolderFile } from "./kit";

export type { ItemId } from "./classify";

/** What the four tests run against: the audit date and the request's own rules. */
export interface AuditContext {
  readonly customer: string;
  readonly audit: string;
  readonly windowStart: string;
  /** Training share the request names, 0.95. */
  readonly trainingShare: number;
  /** Hours the request allows until the customer is told, 48. */
  readonly noticeHours: number;
  /** The systems of the system list, the scope of "every system". */
  readonly systems: readonly string[];
  /** The deadline the gap owners get. */
  readonly due: string;
}

export type Check = "storage" | "transfer" | "share" | "notice";

export interface Candidate {
  readonly file: FolderFile;
  /** Finds the words in the file that answer the item; null when none do. */
  readonly quote: RegExp;
  /** The words report that the item is not met (an unapproved tool in use), so they never cover it. */
  readonly showsNotMet?: true;
}

export interface Item {
  readonly id: ItemId;
  readonly label: { readonly de: string; readonly en: string };
  /** One or two words for the stage rows. */
  readonly short: { readonly de: string; readonly en: string };
  /** The request text, word for word (English, from request_tannwald.md). */
  readonly request: string;
  readonly section: string;
  /** Practice items: only a RECORD can answer them. */
  readonly needsRecord: boolean;
  /** "all": every system of the system list; "period": the whole evidence window. */
  readonly scopeNeed: readonly ("all-systems" | "period")[];
  readonly check?: Check;
  /** The file a name match links the item to (the first screen). */
  readonly naive: FolderFile;
  /** Files that could answer, best first when they tie. */
  readonly candidates: readonly Candidate[];
  /** What closes a gap, and who owns it (English for the templates, German for the page). */
  readonly closing: {
    readonly de: string;
    readonly en: string;
    /** For the template sentence: "made" or "approved", and the coverage. */
    readonly verb: "made" | "approved";
    readonly coveringEn: string;
    readonly coveringDe: string;
  };
  readonly owner: "it" | "hr" | "md";
}

export const OWNERS = {
  it: { de: "IT-Leitung", en: "IT lead", first: "Goran" },
  hr: { de: "HR-Leitung", en: "HR lead", first: "Marija" },
  md: { de: "Geschäftsführung", en: "Managing Director", first: "Dragan" },
} as const;

interface RequestRow {
  readonly text: string;
  readonly section: string;
}

/** The R1 to R8 table of request_tannwald.md. */
export function requestRows(text = kitText("request_tannwald.md")): Readonly<Record<string, RequestRow>> {
  const rows: Record<string, RequestRow> = {};
  for (const match of text.matchAll(/^\| (R[1-8]) \| (.+?) \| ([\d.]+) \|$/gm)) {
    rows[match[1] as string] = { text: match[2] as string, section: match[3] as string };
  }
  return rows;
}

const ROWS = requestRows();
const req = (id: ItemId) => ROWS[id] as RequestRow;

const POLICY_V3 = "infosec-policy_v3_FINAL.md" as const;
const NOTES = "it-notes_2026-10-06.md" as const;

export const ITEMS: readonly Item[] = [
  {
    id: "R1",
    label: { de: "Systeme mit Speicherland", en: "Systems with storage country" },
    short: { de: "Systeme", en: "Systems" },
    request: req("R1").text,
    section: req("R1").section,
    needsRecord: false,
    scopeNeed: [],
    check: "storage",
    naive: "system-list_2026-09.csv",
    candidates: [{ file: "system-list_2026-09.csv", quote: /United States \(see [^)]+\)/ }],
    closing: { de: "", en: "", verb: "approved", coveringEn: "", coveringDe: "" },
    owner: "it",
  },
  {
    id: "R2",
    label: { de: "Unterauftragnehmer + Rechtsgrundlage", en: "Sub-processors + legal basis" },
    short: { de: "Unterauftrag", en: "Sub-processors" },
    request: req("R2").text,
    section: req("R2").section,
    needsRecord: false,
    scopeNeed: [],
    check: "transfer",
    naive: "subprocessors_2026-09.csv",
    candidates: [{ file: "subprocessors_2026-09.csv", quote: /^Anthropic,.*$/m }],
    closing: {
      de: "Übermittlungsgrundlage aus den Datenschutzbedingungen des Anbieters im Register, dazu eine datierte Prüfung",
      en: "the transfer mechanism from the vendor's data processing terms entered in the register, with a dated review",
      verb: "made",
      coveringEn: "the Anthropic row of the sub-processor register",
      coveringDe: "die Zeile Anthropic im Register der Unterauftragnehmer",
    },
    owner: "it",
  },
  {
    id: "R3",
    label: { de: "KI-Werkzeuge, letzte 12 Monate", en: "AI tools, last 12 months" },
    short: { de: "KI-Werkzeuge", en: "AI tools" },
    request: req("R3").text,
    section: req("R3").section,
    needsRecord: false,
    scopeNeed: ["period"],
    naive: "ai-use-rule_v1.md",
    candidates: [
      { file: "ai-use-rule_v1.md", quote: /Valid from [^.]+\./ },
      { file: NOTES, quote: /Until September[^.]+\./, showsNotMet: true },
    ],
    closing: {
      de: "Aufstellung der KI-Nutzung vom 10.12.2025 bis 30.09.2026 (Werkzeug, Daten, Speicherland), unterschrieben",
      en: "a record of AI use from 10 December 2025 to 30 September 2026 (tool, data, storage country), signed",
      verb: "made",
      coveringEn: "all staff on the Tannwald desk, 10 December 2025 to 30 September 2026",
      coveringDe: "alle Beschäftigten am Tannwald-Platz, 10.12.2025 bis 30.09.2026",
    },
    owner: "it",
  },
  {
    id: "R4",
    label: { de: "Prüfung der Admin-Konten", en: "Admin account review" },
    short: { de: "Admin-Konten", en: "Admin accounts" },
    request: req("R4").text,
    section: req("R4").section,
    needsRecord: true,
    scopeNeed: ["all-systems"],
    naive: "access-review_2026-08-14.csv",
    candidates: [
      { file: "access-review_2026-08-14.csv", quote: /Review of administrator accounts in \w+/ },
      { file: POLICY_V3, quote: /Administrator access is reviewed[^.]+\./ },
      { file: NOTES, quote: /Admin access is checked[^.]+\./ },
    ],
    closing: {
      de: "Prüfung der Admin-Konten der drei anderen Systeme, datiert und freigegeben",
      en: "an admin account review of the three other systems, dated and approved",
      verb: "approved",
      coveringEn: "Sprechband, Nordlager and Claude Team",
      coveringDe: "Sprechband, Nordlager und Claude Team",
    },
    owner: "it",
  },
  {
    id: "R5",
    label: { de: "Schulung, mindestens 95 %", en: "Training, at least 95%" },
    short: { de: "Schulung", en: "Training" },
    request: req("R5").text,
    section: req("R5").section,
    needsRecord: true,
    scopeNeed: [],
    check: "share",
    naive: "training-records_2026.csv",
    candidates: [
      { file: "training-records_2026.csv", quote: /Staff on [^:]+: \d+\./ },
      { file: POLICY_V3, quote: /All staff complete[^.]+\./ },
    ],
    closing: {
      de: "Schulungsnachweis über mindestens 114 von 120 oder ein datierter Plan",
      en: "a training record reaching at least 114 of 120 staff, or a dated plan",
      verb: "made",
      coveringEn: "all 120 staff",
      coveringDe: "alle 120 Beschäftigten",
    },
    owner: "hr",
  },
  {
    id: "R6",
    label: { de: "Vorfälle 2026 + Meldung", en: "Incidents 2026 + notice" },
    short: { de: "Vorfälle", en: "Incidents" },
    request: req("R6").text,
    section: req("R6").section,
    needsRecord: true,
    scopeNeed: [],
    check: "notice",
    naive: "incident-log_2026.csv",
    candidates: [
      { file: "incident-log_2026.csv", quote: /^INC-\d+,[\d-]+ [\d:]+,Tannwald/m },
      { file: POLICY_V3, quote: /Incidents with customer data are reported[^.]+\./ },
    ],
    closing: { de: "", en: "", verb: "made", coveringEn: "", coveringDe: "" },
    owner: "it",
  },
  {
    id: "R7",
    label: { de: "Wiederherstellungstest", en: "Restore test" },
    short: { de: "Restore-Test", en: "Restore test" },
    request: req("R7").text,
    section: req("R7").section,
    needsRecord: true,
    scopeNeed: [],
    naive: "backup-report_2026-10.txt",
    candidates: [
      { file: "backup-report_2026-10.txt", quote: /Restore test:[^.]*\./ },
      { file: POLICY_V3, quote: /Backups are restore-tested[^.]+\./ },
      { file: NOTES, quote: /Backups are tested[^.]+\./ },
    ],
    closing: {
      de: "Protokoll eines Wiederherstellungstests: Datum, wiederhergestellte Daten, Ergebnis, wer",
      en: "a restore test record (date, data restored, result, who)",
      verb: "made",
      coveringEn: "the Servicepult export and the file share",
      coveringDe: "den Servicepult-Export und die Dateiablage",
    },
    owner: "it",
  },
  {
    id: "R8",
    label: { de: "Sicherheitsrichtlinie", en: "Security policy" },
    short: { de: "Richtlinie", en: "Policy" },
    request: req("R8").text,
    section: req("R8").section,
    needsRecord: false,
    scopeNeed: [],
    naive: "infosec-policy_v4_DRAFT.md",
    candidates: [
      { file: POLICY_V3, quote: /Approved \d{4}-\d{2}-\d{2}/ },
      { file: "infosec-policy_v4_DRAFT.md", quote: /Approved by: \(open\)/ },
    ],
    closing: {
      de: "Fassung 4, von der Geschäftsführung freigegeben und datiert",
      en: "version 4, approved and dated by the Managing Director",
      verb: "approved",
      coveringEn: "rules 1 to 6",
      coveringDe: "Regeln 1 bis 6",
    },
    owner: "md",
  },
];

export function itemById(id: ItemId): Item {
  const item = ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`no item ${id}`);
  return item;
}

/** The request's own numbers: the audit date, the window and the two thresholds. */
export function vardarContext(text = kitText("request_tannwald.md")): AuditContext {
  const share = /at least (\d+)%/.exec(text);
  const hours = /within (\d+) hours/.exec(text);
  const systems = kitText("folder/system-list_2026-09.csv")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .slice(1)
    .map((line) => (line.split(",")[0] ?? "").replace(/ \(.*$/, "").replace(/ file share$/, ""));
  return {
    customer: "Tannwald",
    audit: "2026-12-10",
    windowStart: "2025-12-10",
    trainingShare: Number(share?.[1] ?? 0) / 100,
    noticeHours: Number(hours?.[1] ?? 0),
    systems,
    due: "2026-12-02",
  };
}

/** The draft reply's four claims, as numbered in draft-reply.md. */
export function draftClaims(text = kitText("draft-reply.md")): readonly string[] {
  return [...text.matchAll(/^\d\. (.+)$/gm)].map((match) => match[1] as string);
}

/** The sample reply at the end of ANSWERS.md, the honest version. */
export function sampleReply(text = kitText("ANSWERS.md")): string {
  const start = text.indexOf("Sample reply");
  const match = /```\n([\s\S]*?)```/.exec(text.slice(start));
  return (match?.[1] ?? "").trimEnd();
}
