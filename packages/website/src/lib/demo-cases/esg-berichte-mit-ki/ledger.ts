/**
 * The Nachweisregister of the kit (Schritt 4) and what the late invoice does
 * to it (Schritt 5), as data and pure functions. The statuses are the ones in
 * loesungen/LOESUNGEN.md; the counts, the VSME tiles, the request list and
 * the cascade are derived from the rows, never typed in.
 */
import type { FileId } from "./kit";
import { countStatuses, type Counts, type Status } from "./rules";

export type RowId =
  | "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8"
  | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7"
  | "F1" | "F2" | "F3" | "F4" | "F5" | "F6";

/** The three requests: Fragebogen (anfragen/1), Werbeaussagen (2), Bankformular (3). */
export type RowGroup = "fragebogen" | "werbung" | "bank";

/** Documents the folder lacks, each named so someone can request it. */
export type DocId =
  | "septemberInvoice"
  | "gridFactor"
  | "diesel"
  | "bioRenewed"
  | "supplyMix"
  | "bills2024"
  | "permit"
  | "siteMap"
  | "waste"
  | "hoursWorked"
  | "minimumWage";

export type TileId = "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7" | "B8" | "B9" | "B10" | "B11";

/** One line number, or a range [from, to] as the solutions file writes it ("3 bis 14"). */
export type LineRef = number | readonly [number, number];
/** A citation: the file and the lines that carry the answer, as in loesungen/LOESUNGEN.md. */
export type Cite = readonly [FileId, readonly LineRef[]];

export interface LedgerRow {
  readonly id: RowId;
  readonly group: RowGroup;
  /** Files the answer cites; a row citing "strom" is rechecked when a strom document arrives. */
  readonly cites: readonly FileId[];
  readonly before: Status;
  readonly after: Status;
  /** Documents missing before the invoice. */
  readonly missing: readonly DocId[];
  /** A claim to consumers that hits the ban list (Richtlinie (EU) 2024/825, Anhang I). */
  readonly gate?: "4a" | "4b" | "4c";
  /** File and line for the register, copied from the solutions file (kit-lockstep.test.ts). */
  readonly lines: readonly Cite[];
}

const row = (
  id: RowId,
  group: RowGroup,
  cites: readonly FileId[],
  before: Status,
  missing: readonly DocId[] = [],
  extra: { readonly after?: Status; readonly gate?: "4a" | "4b" | "4c" } = {},
): Omit<LedgerRow, "lines"> => ({ id, group, cites, before, after: extra.after ?? before, missing, ...(extra.gate ? { gate: extra.gate } : {}) });

const ALL_MONTHS: LineRef = [3, 14];

/** File and line per answer, from loesungen/LOESUNGEN.md (steps 1 to 3). Request files are left out: they ask, they prove nothing. */
const LINES: Readonly<Record<RowId, readonly Cite[]>> = {
  Q1: [["strom", [ALL_MONTHS]], ["entwurf", [5]]],
  Q2: [["firmenprofil", [14, 17]], ["kompensation", [5]], ["vsme", [12]]],
  Q3: [["personal", [[3, 6]]]],
  Q4: [["arbeitsschutz", [[4, 7]]]],
  Q5: [["richtlinien", [13, 14]]],
  Q6: [["flaschen", [[3, 5]]]],
  Q7: [["bio", [[6, 9]]], ["richtlinien", [8, 9]]],
  Q8: [["wasser", [ALL_MONTHS]], ["firmenprofil", [8]]],
  C1: [["kompensation", [7]], ["firmenprofil", [17]]],
  C2: [["regeln", [12, 13]]],
  C3: [["bio", [6, 8, 10, 11]]],
  C4: [["firmenprofil", [13]], ["pv", [3, 11]]],
  C5: [["strom", [ALL_MONTHS]]],
  C6: [["flaschen", [3]]],
  C7: [["wasser", [ALL_MONTHS]], ["firmenprofil", [8]]],
  F1: [["richtlinien", [13, 14]]],
  F2: [["strom", [ALL_MONTHS]], ["entwurf", [5]]],
  F3: [["pv", [8]], ["strom", [ALL_MONTHS]]],
  F4: [["pv", [6, 8, 9, 11]]],
  F5: [["personal", [[3, 6]]], ["arbeitsschutz", [[4, 7]]]],
  F6: [["bio", [[6, 9]]], ["richtlinien", [8, 9]]],
};

/** "3 bis 14", "14, 17": the solutions file's way of writing lines. */
export function formatLines(refs: readonly LineRef[], to: string): string {
  return refs.map((ref) => (typeof ref === "number" ? String(ref) : `${ref[0]} ${to} ${ref[1]}`)).join(", ");
}

const ROWS: readonly Omit<LedgerRow, "lines">[] = [
  row("Q1", "fragebogen", ["strom", "entwurf"], "luecke", ["septemberInvoice", "supplyMix"]),
  row("Q2", "fragebogen", ["firmenprofil", "kompensation", "strom"], "luecke", ["septemberInvoice", "gridFactor", "diesel"]),
  row("Q3", "fragebogen", ["personal"], "belegt"),
  row("Q4", "fragebogen", ["arbeitsschutz"], "belegt"),
  row("Q5", "fragebogen", ["richtlinien"], "belegt"),
  row("Q6", "fragebogen", ["flaschen"], "belegt"),
  row("Q7", "fragebogen", ["bio", "richtlinien"], "schwach", ["bioRenewed"]),
  row("Q8", "fragebogen", ["wasser", "firmenprofil"], "belegt"),
  row("C1", "werbung", ["kompensation", "firmenprofil"], "luecke", [], { gate: "4c" }),
  row("C2", "werbung", ["regeln"], "luecke", [], { gate: "4a" }),
  row("C3", "werbung", ["bio"], "luecke", [], { gate: "4b" }),
  row("C4", "werbung", ["firmenprofil", "pv"], "luecke"),
  row("C5", "werbung", ["strom"], "luecke", ["septemberInvoice", "bills2024"]),
  row("C6", "werbung", ["flaschen"], "belegt"),
  row("C7", "werbung", ["wasser", "firmenprofil"], "belegt"),
  row("F1", "bank", ["richtlinien"], "belegt"),
  row("F2", "bank", ["strom", "entwurf"], "luecke", ["septemberInvoice"], { after: "belegt" }),
  row("F3", "bank", ["pv", "strom"], "luecke", ["septemberInvoice"], { after: "schwach" }),
  row("F4", "bank", ["pv", "strom"], "schwach"),
  row("F5", "bank", ["personal", "arbeitsschutz"], "belegt"),
  row("F6", "bank", ["bio", "richtlinien"], "schwach", ["bioRenewed"]),
];

export const LEDGER: readonly LedgerRow[] = ROWS.map((entry) => ({ ...entry, lines: LINES[entry.id] }));

export const ROW_GROUPS: readonly RowGroup[] = ["fragebogen", "werbung", "bank"];

export interface VsmeTile {
  readonly id: TileId;
  readonly done: number;
  readonly total: number;
  /** Datapoints proven once the September invoice is filed. */
  readonly doneAfter: number;
  readonly missing: readonly DocId[];
  /** True when the tile's datapoints depend on the electricity file. */
  readonly citesStrom?: boolean;
}

const tile = (id: TileId, done: number, total: number, missing: readonly DocId[] = [], doneAfter = done, citesStrom = false): VsmeTile =>
  ({ id, done, total, doneAfter, missing, ...(citesStrom ? { citesStrom } : {}) });

/** The eleven disclosures of the VSME Basic Module (vsme_basismodul.md), as in Schritt 4. */
export const VSME: readonly VsmeTile[] = [
  tile("B1", 8, 8),
  tile("B2", 4, 4),
  tile("B3", 0, 4, ["septemberInvoice", "gridFactor", "diesel"], 1, true),
  tile("B4", 0, 1, ["permit"]),
  tile("B5", 0, 1, ["siteMap"]),
  tile("B6", 1, 1),
  tile("B7", 1, 4, ["waste"]),
  tile("B8", 2, 2),
  tile("B9", 2, 3, ["hoursWorked"]),
  tile("B10", 1, 3, ["minimumWage"]),
  tile("B11", 1, 1),
];

/** A tile is BELEGT only when every datapoint is; a missing datapoint is a LÜCKE (Regel 3). */
export function tileStatus(done: number, total: number): Status {
  return done >= total ? "belegt" : "luecke";
}

export type Phase = "before" | "after";

export function statusOf(entry: LedgerRow, phase: Phase): Status {
  return phase === "before" ? entry.before : entry.after;
}

export function ledgerCounts(phase: Phase): Counts {
  return countStatuses(LEDGER.map((entry) => statusOf(entry, phase)));
}

export function vsmeCounts(phase: Phase): Counts {
  return countStatuses(VSME.map((entry) => tileStatus(phase === "before" ? entry.done : entry.doneAfter, entry.total)));
}

/** Rows that cite a file: the ones a new document of that kind sends back for a recheck. */
export function affectedBy(file: FileId): readonly RowId[] {
  return LEDGER.filter((entry) => entry.cites.includes(file)).map((entry) => entry.id);
}

/** Rows whose status changes when the late invoice is filed. */
export function cascadeFlips(): readonly RowId[] {
  return LEDGER.filter((entry) => entry.before !== entry.after).map((entry) => entry.id);
}

/** How many answers cite each file. */
export function citeCounts(): Readonly<Record<FileId, number>> {
  const counts = {} as Record<FileId, number>;
  for (const entry of LEDGER) for (const file of entry.cites) counts[file] = (counts[file] ?? 0) + 1;
  return counts;
}

export interface MissingDocument {
  readonly doc: DocId;
  /** Rows and VSME tiles that wait for it, in ledger order. */
  readonly dependents: readonly (RowId | TileId)[];
}

/**
 * The Anfordern sheet: every missing document once, with every row and tile
 * that names it, sorted by how many wait for it; ties keep first appearance.
 * After the invoice the September bill is no longer missing.
 */
export function missingDocuments(phase: Phase = "before"): readonly MissingDocument[] {
  const order: DocId[] = [];
  const dependents = new Map<DocId, (RowId | TileId)[]>();
  const add = (doc: DocId, who: RowId | TileId) => {
    if (phase === "after" && doc === "septemberInvoice") return;
    if (!dependents.has(doc)) {
      order.push(doc);
      dependents.set(doc, []);
    }
    dependents.get(doc)!.push(who);
  };
  for (const entry of LEDGER) for (const doc of entry.missing) add(doc, entry.id);
  for (const entry of VSME) for (const doc of entry.missing) add(doc, entry.id);
  return order
    .map((doc, index) => ({ doc, index, dependents: dependents.get(doc)! }))
    .sort((a, b) => b.dependents.length - a.dependents.length || a.index - b.index)
    .map(({ doc, dependents: who }) => ({ doc, dependents: who }));
}
