/**
 * Scene 5, the folder: which answers hang on a file, how the gaps split, and
 * why the four rechecked answers stay as they are when the September invoice
 * arrives. Derived from the register rows in ledger.ts (LOESUNGEN.md Schritte
 * 1 to 5); nothing here is typed in twice.
 */
import type { FileId } from "./kit";
import { LEDGER, statusOf, type DocId, type LedgerRow, type Phase, type RowId } from "./ledger";

export interface FileConnections {
  /** Answers that quote a line of the file (solid connections). */
  readonly quoted: readonly RowId[];
  /** Answers that depend on the file without quoting a line of it (dashed connections). */
  readonly dependsOn: readonly RowId[];
}

/** Solid connections go to answers whose lines cite the file, dashed ones to answers that only depend on it. */
export function connectionsFrom(file: FileId): FileConnections {
  const quoted: RowId[] = [];
  const dependsOn: RowId[] = [];
  for (const row of LEDGER) {
    if (row.lines.some(([cited]) => cited === file)) quoted.push(row.id);
    else if (row.cites.includes(file)) dependsOn.push(row.id);
  }
  return { quoted, dependsOn };
}

/** The documents a row still lacks in a phase: with the invoice in, the September bill is no longer missing. */
export function missingFor(row: LedgerRow, phase: Phase): readonly DocId[] {
  return phase === "after" ? row.missing.filter((doc) => doc !== "septemberInvoice") : row.missing;
}

export type GapKind = "withDoc" | "banned" | "noFile";

/** Why a gap is a gap: a ban-list claim, a missing document that would close it, or no file at all today. */
export function gapKind(row: LedgerRow, phase: Phase): GapKind | null {
  if (statusOf(row, phase) !== "luecke") return null;
  if (row.gate) return "banned";
  return missingFor(row, phase).length > 0 ? "withDoc" : "noFile";
}

export interface GapSplit {
  readonly withDoc: number;
  readonly banned: number;
  readonly noFile: number;
}

/** 5 / 3 / 1 before the invoice, 3 / 3 / 1 after. */
export function gapSplit(phase: Phase): GapSplit {
  const split = { withDoc: 0, banned: 0, noFile: 0 };
  for (const row of LEDGER) {
    const kind = gapKind(row, phase);
    if (kind) split[kind] += 1;
  }
  return split;
}

/** The answers the invoice sends back for a recheck, in register order: Q1, Q2, C5, F2, F3, F4. */
export function recheckOrder(): readonly RowId[] {
  return LEDGER.filter((row) => row.cites.includes("strom")).map((row) => row.id);
}

/** Why each rechecked answer stays as it is (LOESUNGEN.md Schritt 5, column "Warum"; copy pack keys). */
export const RECHECK_REASON: Readonly<Partial<Record<RowId, "supplyMix" | "factorDiesel" | "bills2024" | "formula">>> = {
  Q1: "supplyMix",
  Q2: "factorDiesel",
  C5: "bills2024",
  F4: "formula",
};
