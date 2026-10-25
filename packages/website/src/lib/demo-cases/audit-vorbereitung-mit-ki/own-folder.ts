/**
 * "Dein Ordner": the four tests on the visitor's own files, as far as names,
 * dates and plain text files carry them. Name and date can rule evidence
 * out, never confirm it, so every item ends at "höchstens SCHWACH" or
 * "OFFEN", never BELEGT (bound.ts). The same dateTest and approvalTest run as
 * on the kit. Pure: the component reads the files and hands in plain data.
 */

import { boundOf, type Bound } from "./bound";
import { GENERIC_ITEM_IDS, docType, keywordHits, type DocType, type ItemId } from "./classify";
import { approvalTest, dateTest, readDoc } from "./evidence";
import { parseDateTokens } from "./dates";
import type { DatedFact } from "./meta";
import { NAME_APPROVAL, NAME_DRAFT, versionChains } from "./versions";

export const MAX_LISTED = 2000;
export const MAX_READ = 80;
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export const TEXT_EXTENSIONS = /\.(txt|md|csv|tsv)$/i;

export interface OwnEntry {
  readonly name: string;
  readonly size: number | null;
  /** ms since epoch from the file, or null for a pasted line. */
  readonly lastModified: number | null;
  /** A date from a pasted list line (ISO), with its year possibly missing. */
  readonly listedDate: string | null;
  readonly yearMissing: boolean;
  /** The latest day the listed date can mean (a month or a year spans many). */
  readonly listedLatest?: string | null;
  /** The pasted line carried a date that is no real day ("2026/13/45"). */
  readonly listedInvalid?: boolean;
  /** The pasted line or the name carried a dd/mm/yyyy date that could be two days. */
  readonly listedAmbiguous?: boolean;
  /** The file's text when it was read (a .txt, .md, .csv or .tsv under 2 MB). */
  readonly text: string | null;
}

export type Tri = boolean | null;

export interface OwnFile {
  readonly entry: OwnEntry;
  readonly type: DocType;
  readonly lock: boolean;
  readonly date: { readonly iso: string; readonly source: "text" | "modified" | "list"; readonly kind: DatedFact["kind"] | null } | null;
  readonly dateTest: Tri;
  readonly approvalTest: Tri;
  readonly approvedBy: string | null;
  /** The words of a record's text that say it was not done ("planned"), or null. */
  readonly notMet: string | null;
  readonly notes: readonly OwnNote[];
}

export type OwnNote =
  | "lock"
  | "notRead"
  | "modifiedDate"
  | "nameDraft"
  | "nameApproval"
  | "yearMissing"
  | "approvalOpen"
  | "draftInText"
  | "dateUnreadable"
  | "dateAmbiguous";

/**
 * Words in a record that say the thing was not done. Narrower than the kit's
 * NOT_MET: "none" is too common in a stranger's CSV to mean anything.
 */
export const OWN_NOT_MET = /\b(planned|pending|not done|not performed|not yet|geplant|ausstehend|nicht durchgeführt|noch nicht)\b/i;

export interface OwnItem {
  readonly id: ItemId;
  readonly candidates: readonly OwnFile[];
  readonly bound: Bound;
}

export interface OwnChain {
  readonly stem: string;
  readonly files: readonly OwnFile[];
  readonly approved: OwnFile | null;
}

export interface OwnResult {
  readonly files: readonly OwnFile[];
  readonly ignored: number;
  readonly overCap: { readonly listed: number; readonly total: number } | null;
  readonly copiedDates: boolean;
  readonly chains: readonly OwnChain[];
  readonly items: readonly OwnItem[];
}

const IGNORED = /^(\.ds_store|thumbs\.db|desktop\.ini)$|^\._/i;

export function isIgnored(entry: Pick<OwnEntry, "name" | "size">): boolean {
  return IGNORED.test(entry.name) || entry.size === 0;
}

const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function assess(entry: OwnEntry, windowStart: string | null): OwnFile {
  const lock = entry.name.startsWith("~$");
  const notes: OwnNote[] = [];
  if (lock) notes.push("lock");
  if (entry.text !== null) {
    const doc = readDoc(entry.name, entry.text);
    const date = dateTest(doc, windowStart ?? "0000-01-01");
    const approval = approvalTest(doc);
    if (doc.meta.approvalOpen) notes.push("approvalOpen");
    if (doc.meta.draft) notes.push("draftInText");
    const used = date.used;
    const fallback = !used && entry.lastModified !== null ? isoOf(entry.lastModified) : null;
    if (fallback) notes.push("modifiedDate");
    const notMet = doc.type === "RECORD" ? (OWN_NOT_MET.exec(entry.text)?.[1] ?? null) : null;
    return {
      entry,
      type: doc.type,
      lock,
      date: used ? { iso: used.iso, source: "text", kind: used.kind } : fallback ? { iso: fallback, source: "modified", kind: null } : null,
      // Without an audit date DATE stays open.
      dateTest: windowStart === null ? null : used ? date.pass : fallback && fallback < windowStart ? false : null,
      approvalTest: lock ? false : approval.pass,
      approvedBy: approval.by,
      notMet,
      notes,
    };
  }
  notes.push("notRead");
  if (entry.listedInvalid) notes.push("dateUnreadable");
  if (entry.listedAmbiguous || parseDateTokens(entry.name).some((token) => token.ambiguous)) notes.push("dateAmbiguous");
  const listed = entry.listedDate;
  // An uncertain listed date ("2026", "2026-Q2") fails DATUM only when even its last day lies before the window.
  const latest = listed ? (entry.listedLatest ?? listed) : null;
  const modified = entry.lastModified !== null ? isoOf(entry.lastModified) : null;
  const iso = listed ?? modified;
  if (iso) notes.push("modifiedDate");
  if (entry.yearMissing) notes.push("yearMissing");
  const nameDraft = NAME_DRAFT.test(entry.name);
  if (nameDraft) notes.push("nameDraft");
  if (NAME_APPROVAL.test(entry.name)) notes.push("nameApproval");
  return {
    entry,
    type: docType(entry.name),
    lock,
    date: iso ? { iso, source: listed ? "list" : "modified", kind: null } : null,
    // A file last changed before the window cannot carry an approval inside it.
    dateTest: entry.yearMissing || windowStart === null ? null : iso && (latest ?? iso) < windowStart ? false : null,
    approvalTest: lock || nameDraft ? false : null,
    approvedBy: null,
    notMet: null,
    notes,
  };
}

/** More than 80 % of the modification times within 2 s of each other: a copy overwrote them. */
export function datesWereCopied(entries: readonly OwnEntry[]): boolean {
  const times = entries.map((entry) => entry.lastModified).filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (times.length < 3) return false;
  let best = 0;
  for (let start = 0, end = 0; end < times.length; end += 1) {
    while ((times[end] as number) - (times[start] as number) > 2000) start += 1;
    best = Math.max(best, end - start + 1);
  }
  return best / times.length > 0.8;
}

function newest(files: readonly OwnFile[]): OwnFile | null {
  return [...files].sort((a, b) => ((a.date?.iso ?? "") < (b.date?.iso ?? "") ? 1 : -1))[0] ?? null;
}

export function assessFolder(input: readonly OwnEntry[], windowStart: string | null, enabled: ReadonlySet<ItemId> = new Set(GENERIC_ITEM_IDS)): OwnResult {
  const kept = input.filter((entry) => !isIgnored(entry));
  const listed = kept.slice(0, MAX_LISTED);
  const files = listed.map((entry) => assess(entry, windowStart));
  const chains = versionChains(files.map((file) => ({ name: file.entry.name, file }))).map((chain) => {
    const members = chain.files.map((member) => member.file);
    return { stem: chain.stem, files: members, approved: newest(members.filter((file) => file.entry.text !== null && file.approvalTest === true)) };
  });
  const items = GENERIC_ITEM_IDS.filter((id) => enabled.has(id)).map((id): OwnItem => {
    const candidates = files
      .filter((file) => !file.lock && keywordHits(id, file.entry.name) > 0)
      .sort((a, b) => keywordHits(id, b.entry.name) - keywordHits(id, a.entry.name) || ((a.date?.iso ?? "") < (b.date?.iso ?? "") ? 1 : -1))
      .slice(0, 3);
    const best = candidates.find((file) => file.dateTest !== false && file.approvalTest !== false) ?? candidates[0] ?? null;
    return {
      id,
      candidates,
      bound: boundOf({ hasCandidate: best !== null, date: best?.dateTest ?? null, approval: best?.approvalTest ?? null, notMet: best?.notMet != null }),
    };
  });
  return {
    files,
    ignored: input.length - kept.length,
    overCap: kept.length > MAX_LISTED ? { listed: MAX_LISTED, total: kept.length } : null,
    copiedDates: datesWereCopied(listed),
    chains,
    items,
  };
}
