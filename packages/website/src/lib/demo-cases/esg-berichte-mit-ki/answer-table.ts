/**
 * Reads Claude's recorded answers the way a person checks them: the status
 * of every row in the answer tables of steps 1 to 3, the register counts of
 * step 4 and the new statuses of step 5. Pure functions over the recorded
 * text, so the tests can hold Claude's words against the kit's solutions
 * (ledger.ts) and the page can show exactly what Claude said per row.
 */
import type { RowId } from "./ledger";
import { weakest, type Counts, type Status } from "./rules";

/** The status words the skill and the project instructions use, both editions. */
const STATUS_WORDS: ReadonlyArray<readonly [RegExp, Status]> = [
  [/\b(?:BELEGT|COVERED)\b/i, "belegt"],
  [/\b(?:SCHWACH|WEAK)\b/i, "schwach"],
  [/(?:LÜCKE|\bGAP\b)/i, "luecke"],
];

/** The status a cell names; the last status word wins ("GAP ... now COVERED" reads COVERED). */
export function statusIn(cell: string): Status | null {
  let found: { at: number; status: Status } | null = null;
  for (const [pattern, status] of STATUS_WORDS) {
    const global = new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`);
    for (const match of cell.matchAll(global)) {
      if (!found || (match.index ?? 0) > found.at) found = { at: match.index ?? 0, status };
    }
  }
  return found?.status ?? null;
}

export interface MdTable {
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

/** Every GFM table in a Markdown text. */
export function tablesIn(text: string): readonly MdTable[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const tables: MdTable[] = [];
  for (let index = 0; index + 1 < lines.length; index += 1) {
    const line = lines[index] as string;
    if (!line.includes("|") || !SEPARATOR.test(lines[index + 1] as string)) continue;
    const head = cells(line);
    const rows: string[][] = [];
    let at = index + 2;
    while (at < lines.length && (lines[at] as string).trim().startsWith("|")) {
      rows.push(cells(lines[at] as string));
      at += 1;
    }
    tables.push({ head, rows });
    index = at - 1;
  }
  return tables;
}

/** Which register row a table row answers: Q1 to Q8, claims 1 to 7 as C1 to C7, fields F1 to F6. */
export function rowIdOf(firstCell: string, group: "fragebogen" | "werbung" | "bank"): RowId | null {
  const cell = firstCell.replace(/[*`]/g, "").trim();
  if (group === "fragebogen") return (/^(Q[1-8])\b/.exec(cell)?.[1] as RowId | undefined) ?? null;
  if (group === "bank") return (/^(F[1-6])\b/.exec(cell)?.[1] as RowId | undefined) ?? null;
  const claim = /^C?([1-7])\b/.exec(cell)?.[1];
  return claim ? (`C${claim}` as RowId) : null;
}

export interface AnswerRow {
  readonly id: RowId;
  readonly status: Status;
  /** The row's cells as Claude wrote them, by header. */
  readonly cells: Readonly<Record<string, string>>;
}

/**
 * The rows of a step's answer table (steps 1 to 3): the first table whose
 * header has a status column and whose rows name register ids of the group.
 */
export function answerRows(text: string, group: "fragebogen" | "werbung" | "bank"): readonly AnswerRow[] {
  for (const table of tablesIn(text)) {
    const statusAt = table.head.findIndex((cell) => /^(status)$/i.test(cell.replace(/[*`]/g, "").trim()));
    if (statusAt < 0) continue;
    const rows: AnswerRow[] = [];
    for (const row of table.rows) {
      const id = rowIdOf(row[0] ?? "", group);
      const status = statusIn(row[statusAt] ?? "");
      if (!id || !status) continue;
      rows.push({ id, status, cells: Object.fromEntries(table.head.map((name, at) => [name.replace(/[*`]/g, "").trim(), row[at] ?? ""])) });
    }
    if (rows.length > 0) return rows;
  }
  return [];
}

/** "9 BELEGT, 3 SCHWACH, 9 LÜCKE" / "9 COVERED, 3 WEAK, 9 GAP": the first register count a text states. */
export function countsIn(text: string): Counts | null {
  const match = /(\d+)\s+(?:BELEGT|COVERED),\s*(\d+)\s+(?:SCHWACH|WEAK),?\s*(?:and\s+)?(\d+)\s+(?:LÜCKE|GAP)/i.exec(text);
  if (!match) return null;
  return { belegt: Number(match[1]), schwach: Number(match[2]), luecke: Number(match[3]) };
}

/**
 * Step 5's re-check table (Wo | Vorher | Jetzt | Warum): the new status of
 * every questionnaire row and bank field it names, keyed by register id. A
 * row about one part of an answer ("Nordvik Q1, Anteil erneuerbar") counts
 * as that part: the answer gets the status of its weakest part.
 */
export function recheckStatuses(text: string): Readonly<Partial<Record<RowId, Status>>> {
  const parts = new Map<RowId, Status[]>();
  for (const table of tablesIn(text)) {
    const nowAt = table.head.findIndex((cell) => /^(jetzt|now)\b/i.test(cell.replace(/[*`]/g, "").trim()));
    if (nowAt < 0) continue;
    for (const row of table.rows) {
      const id = /\b(Q[1-8]|F[1-6])\b/.exec((row[0] ?? "").replace(/[*`]/g, ""))?.[1] as RowId | undefined;
      const status = statusIn(row[nowAt] ?? "");
      if (!id || !status) continue;
      parts.set(id, [...(parts.get(id) ?? []), status]);
    }
  }
  return Object.fromEntries([...parts].map(([id, statuses]) => [id, weakest(statuses)])) as Partial<Record<RowId, Status>>;
}
