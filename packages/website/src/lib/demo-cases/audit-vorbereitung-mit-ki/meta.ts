/**
 * What a document says about itself in its own text: who approved it and
 * when, who owns or made it, which dates it carries and of which kind, and
 * whether it is a draft. Read clause by clause from the text, never from the
 * file name. Pure; German and English header words.
 */

import { firstDate, type IsoDate } from "./dates";

export type DateKind =
  | "approved"
  | "reviewed"
  | "done"
  | "generated"
  | "exported"
  | "updated"
  | "lastEntry"
  | "written"
  | "printed"
  | "page"
  | "edited"
  | "validFrom"
  | "nextReview";

export interface DatedFact {
  readonly kind: DateKind;
  readonly iso: IsoDate;
  readonly uncertain: boolean;
}

export interface Meta {
  /** A named approver; null when the field is empty, "(open)", "offen", "TBD" or blank lines. */
  readonly approvedBy: string | null;
  /** The approval field exists but names no one ("Approved by: (open)"). */
  readonly approvalOpen: boolean;
  readonly owner: string | null;
  /** Who did, generated, exported, printed or wrote it. */
  readonly maker: string | null;
  readonly dates: readonly DatedFact[];
  readonly draft: boolean;
  readonly notReviewed: boolean;
  /** "Source: https://..." of a printed vendor page. */
  readonly source: string | null;
}

const APPROVAL = /\b(approved|freigegeben|genehmigt|signed|unterschrieben)\b/i;
const EMPTY_NAME = /^\(?\s*(open|offen|tbd|n\/a|none|keine?r?)?\s*\)?$|^[_\-.\s]*$/i;
const DRAFT = /\b(draft|entwurf|in bearbeitung|zur abstimmung|tbd)\b/i;
const NEGATED = /\b(not|nicht|nie|never)\s+(done|reviewed|durchgeführt|geprüft|erledigt)\b/i;
const FICTION = /fictional training material|erfundenes? (übungs|trainings)material/i;

/** Kinds by the word that introduces them; checked in this order inside one clause. */
const KIND_WORDS: readonly (readonly [DateKind, RegExp])[] = [
  ["nextReview", /\b(next review|nächste prüfung|wiedervorlage)\b/i],
  ["validFrom", /\b(valid from|gültig ab|in kraft ab)\b/i],
  ["page", /\b(page date|stand der seite)\b/i],
  ["approved", APPROVAL],
  ["reviewed", /\b(reviewed|überprüft)\b/i],
  ["done", /\b(done|durchgeführt|erledigt)\b/i],
  ["generated", /\b(generated|erzeugt|erstellt)\b/i],
  ["exported", /\b(export(ed)?|exportiert)\b/i],
  ["updated", /\b(updated|aktualisiert)\b/i],
  ["lastEntry", /\b(last entry|letzter eintrag)\b/i],
  ["written", /\b(written|geschrieben|verfasst)\b/i],
  ["printed", /\b(printed|gedruckt)\b/i],
  ["edited", /\b(edited|bearbeitet|geändert)\b/i],
];

const MAKER_KINDS = new Set<DateKind>(["done", "generated", "exported", "written", "printed"]);

/** A data row of a table (three or more commas, not a "#" comment): never a header sentence. */
const TABLE_ROW = /^[^#][^\n]*,[^\n]*,[^\n]*,/;

/** Sentences and lines, without table rows, markdown heading marks and the fiction label. */
export function clauses(text: string): readonly string[] {
  return text
    .split("\n")
    .filter((line) => !TABLE_ROW.test(line))
    .map((line) => line.replace(/^\s*#+\s*/, "").trim())
    .flatMap((line) => line.split(/(?<=\.)\s+(?=[A-ZÄÖÜ(])/))
    .map((clause) => clause.trim())
    .filter((clause) => clause && !FICTION.test(clause));
}

function nameAfterBy(clause: string): string | null {
  const match = /\b(?:by|von|durch)\b\s*:?\s*(.*)$/i.exec(clause);
  if (!match) return null;
  const name = (match[1] ?? "").replace(/\.$/, "").trim();
  return EMPTY_NAME.test(name) ? "" : name;
}

export function extractMeta(text: string): Meta {
  let approvedBy: string | null = null;
  let approvalOpen = false;
  let owner: string | null = null;
  let maker: string | null = null;
  let source: string | null = null;
  const dates: DatedFact[] = [];
  const body = clauses(text);

  for (const clause of body) {
    const ownerMatch = /\b(?:owner|verantwortlich|kept by|maintained by|geführt von)\s*:?\s*([^()]+?)\.?$/i.exec(clause);
    if (ownerMatch && owner === null && !/^\(/.test(clause)) owner = (ownerMatch[1] ?? "").trim() || null;
    const sourceMatch = /\b(?:source|quelle)\s*:\s*(https?:\/\/\S+)/i.exec(clause);
    if (sourceMatch) source = sourceMatch[1] ?? null;
    if (NEGATED.test(clause)) continue;

    const kind = KIND_WORDS.find(([, word]) => word.test(clause))?.[0];
    if (!kind) continue;
    const date = firstDate(clause);
    if (kind === "approved") {
      const name = nameAfterBy(clause);
      if (name === "" || (name === null && !date)) approvalOpen = true;
      else if (name && approvedBy === null) approvedBy = name;
    } else if (MAKER_KINDS.has(kind) && maker === null) {
      const name = nameAfterBy(clause);
      if (name) maker = name;
    }
    if (date?.iso) dates.push({ kind, iso: date.iso, uncertain: date.uncertain });
  }

  return {
    approvedBy,
    approvalOpen: approvalOpen && approvedBy === null,
    owner,
    maker,
    dates,
    draft: body.some((clause) => DRAFT.test(clause)),
    notReviewed: body.some((clause) => /\bnot reviewed\b|\bnicht geprüft\b|\bungeprüft\b/i.test(clause)),
    source,
  };
}

const PRIORITY: readonly DateKind[] = ["approved", "reviewed", "done", "generated", "exported", "updated", "lastEntry", "written", "printed", "page", "edited"];

/** The date that speaks for the document: approval or review first, then done or generated, then printed, last edited last. */
export function documentDate(meta: Meta): DatedFact | null {
  for (const kind of PRIORITY) {
    const found = meta.dates.find((fact) => fact.kind === kind);
    if (found) return found;
  }
  return null;
}

export function dateOfKind(meta: Meta, kind: DateKind): DatedFact | null {
  return meta.dates.find((fact) => fact.kind === kind) ?? null;
}
