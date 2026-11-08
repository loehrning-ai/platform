/**
 * What the stage draws, computed once from the kit by the oracle: per line of the inspector's list the
 * status, the four tests, the findings and near misses; the 13 x 24 matrix; the clock cases; the two
 * papers and the pay row the demo shows closely; the columns of the employee records. Plain data, no
 * functions, so the server page can hand it to the client demo as props. Every number starts here.
 */

import { statusKey, testsOf, type Status, type Tests } from "./evidence";
import { LINE_FILES, lineList, type LineDef } from "./lines";
import { addDays } from "./dates";
import { NOTICE_WORKING_DAYS } from "./clock-rule";
import { kitText } from "./kit";
import { analyseKit, daysBetween, FILE_NAMES, NOTICE_DATE, CHECK_DATE, weekdayOf, type LineId, type OracleResult } from "./oracle";

export type ModelLocale = "de" | "en";

/** The day the exercise is set on: the Thursday before the visit. The demo never reads a clock. */
export const TODAY_IN_EXERCISE = "2026-11-26";

export interface ModelFinding {
  readonly id: string;
  readonly people: readonly string[];
  readonly number: number;
  readonly unit: string;
  readonly facts: Readonly<Record<string, unknown>>;
}

export interface ModelNearMiss {
  readonly id: string;
  readonly people: readonly string[];
}

export interface ModelLine extends LineDef {
  readonly status: Status;
  readonly tests: Tests;
  readonly broken: boolean;
  readonly findings: readonly ModelFinding[];
  readonly nearMisses: readonly ModelNearMiss[];
  /** Person ids with a finding on this line; empty with wholeFirm set when the finding is about the whole firm. */
  readonly people: readonly string[];
  readonly wholeFirm: boolean;
  /** Data rows the check reads for this line; null when it reads only text files. */
  readonly rows: number | null;
  /** The folder files the check reads, by their names in the shown edition. */
  readonly files: readonly string[];
}

export interface ClockCase {
  readonly visit: string;
  /** 1 Monday to 4 Thursday; null for a day whose weekday the demo never prints. */
  readonly weekday: 1 | 2 | 3 | 4 | null;
  readonly calendar: number;
  readonly workingBetween: number;
  readonly papersDue: string;
  readonly papersDueWeekday: 1 | 2 | 3 | 4 | null;
  /** The paper day falls on Monday to Friday: only then does the demo print it as a date. */
  readonly papersDueOnWorkday: boolean;
}

export interface WeekDay {
  readonly date: string;
  /** 1 Monday to 4 Thursday; null for the day whose weekday the demo never prints. */
  readonly weekday: 1 | 2 | 3 | 4 | null;
}

export interface PaperView {
  readonly file: string;
  readonly line: LineId;
  /** The lines of the paper the stage quotes. */
  readonly lines: readonly string[];
}

export interface PayRow {
  readonly file: string;
  readonly header: string;
  readonly row: string;
  readonly periodEnd: string;
  readonly paid: string;
  readonly limit: string;
  readonly daysLate: number;
}

export interface RecordColumn {
  readonly id: string;
  readonly meaning: string;
}

export interface Model {
  readonly locale: ModelLocale;
  readonly lines: readonly ModelLine[];
  readonly tally: { readonly covered: number; readonly weak: number; readonly gap: number };
  readonly rowsRead: number;
  readonly findings: number;
  /** Near misses the check looked at and ruled out. */
  readonly checked: number;
  readonly people: readonly string[];
  readonly titles: readonly string[];
  readonly cells: readonly (readonly number[])[];
  readonly notice: string;
  readonly visit: string;
  readonly today: string;
  readonly clock: readonly ClockCase[];
  /** The days from the notice to the visit, one cell each. */
  readonly week: readonly WeekDay[];
  /** Working days the general rule asks for between the notice and the inspection. */
  readonly needWorking: number;
  readonly attendance: PaperView;
  readonly statement: PaperView;
  readonly pay: PayRow;
  readonly columns: readonly RecordColumn[];
  /** The new-paper note of the kit, as the visitor takes it home. */
  readonly noteTemplate: string;
  readonly wrong: { readonly over: number; readonly under: number };
}

/** The kit files by edition: the folder lives in `folder/` in English and `de/ordner/` in German. */
const EDITION = {
  en: {
    folder: (name: string) => `folder/${name}`,
    note: "templates/new-paper-note.md",
    statement: "folder/safety_statement_2019.md",
    index: "folder/folder-index.md",
    names: { notices: "overtime_notices_folder.txt", statement: "safety_statement_2019.md", index: "folder-index.md" },
  },
  de: {
    folder: (name: string) => `de/ordner/${name}`,
    note: "de/vorlagen/neues-papier.md",
    statement: "de/ordner/sicherheitserklaerung_2019.md",
    index: "de/ordner/ordner-index.md",
    names: { notices: "meldungen_ueberstunden_ordner.txt", statement: "sicherheitserklaerung_2019.md", index: "ordner-index.md" },
  },
} as const;

const clockWeekday = (iso: string): 1 | 2 | 3 | 4 | null => {
  const day = weekdayOf(iso);
  return day >= 1 && day <= 4 ? (day as 1 | 2 | 3 | 4) : null;
};

export { NOTICE_WORKING_DAYS };

function weekCells(): readonly WeekDay[] {
  const span = daysBetween(NOTICE_DATE, CHECK_DATE).calendar;
  return Array.from({ length: span + 1 }, (_, i): WeekDay => {
    const date = addDays(NOTICE_DATE, i);
    return { date, weekday: date === CHECK_DATE ? null : clockWeekday(date) };
  });
}

/** The three visit days the clock beat offers: Wed 25, Thu 26 and the visit day. */
export const CLOCK_VISITS = ["2026-11-25", "2026-11-26", CHECK_DATE] as const;

function clockCases(): readonly ClockCase[] {
  return CLOCK_VISITS.map((visit): ClockCase => {
    const { calendar, workingBetween, papersDue } = daysBetween(NOTICE_DATE, visit);
    return { visit, weekday: visit === CHECK_DATE ? null : clockWeekday(visit), calendar, workingBetween, papersDue, papersDueWeekday: clockWeekday(papersDue), papersDueOnWorkday: weekdayOf(papersDue) >= 1 && weekdayOf(papersDue) <= 5 };
  });
}

function recordColumns(locale: ModelLocale): readonly RecordColumn[] {
  const index = kitText(EDITION[locale].index);
  const legend = index.slice(index.search(/^## (Legend|Legende)/m));
  return legend
    .split("\n")
    .map((line) => /^\| (f\d\d) \| (.+) \|$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({ id: match[1] as string, meaning: (match[2] as string).replace(/\s*\(.*\)\s*$/, "") }));
}

function attendancePaper(locale: ModelLocale, result: OracleResult): PaperView {
  const text = kitText(EDITION[locale].folder(FILE_NAMES.attendance));
  const lines = text.split("\n").filter((line) => !line.startsWith("#") && line !== "");
  const person = result.findings.find((f) => f.line === "L04")?.people[0] ?? "";
  const rows = lines.filter((line) => line.startsWith(`${person},`)).slice(0, 2);
  return { file: FILE_NAMES.attendance, line: "L04", lines: [lines[0] as string, ...rows] };
}

function statementPaper(locale: ModelLocale): PaperView {
  const text = kitText(EDITION[locale].statement).split("\n");
  const dated = text.find((line) => /^(Dated|Datum): /.test(line)) ?? "";
  const opinion = text.find((line) => /^(Opinion of the employee representative|Stellungnahme der Arbeitnehmervertretung): /.test(line)) ?? "";
  return { file: EDITION[locale].names.statement, line: "L11", lines: [dated, opinion] };
}

function payRow(locale: ModelLocale, result: OracleResult): PayRow {
  const run = result.findings.find((f) => f.line === "L08");
  if (!run) throw new Error("oracle: no pay finding in the kit");
  const facts = run.facts as { periodEnd: string; paid: string; limit: string; daysLate: number };
  const rows = kitText(EDITION[locale].folder(FILE_NAMES.runs)).split("\n").filter((line) => !line.startsWith("#") && line !== "");
  const row = rows.find((line) => line.startsWith(`${facts.periodEnd},`)) ?? "";
  return { file: FILE_NAMES.runs, header: rows[0] as string, row, periodEnd: facts.periodEnd, paid: facts.paid, limit: facts.limit, daysLate: facts.daysLate };
}

export function buildModel(locale: ModelLocale, result: OracleResult = analyseKit()): Model {
  const defs = lineList(locale);
  const names: Record<string, string> = { ...FILE_NAMES, ...EDITION[locale].names };
  const lines = result.lines.map((line): ModelLine => {
    const def = defs.find((entry) => entry.id === line.id) as LineDef;
    const findings = result.findings.filter((f) => f.line === line.id).map((f): ModelFinding => ({ id: f.id, people: f.people, number: f.number, unit: f.unit, facts: f.facts }));
    const keys = LINE_FILES[line.id];
    const rowKeys = keys.filter((key) => FILE_NAMES[key] in result.rowsByFile);
    return {
      ...def,
      status: statusKey(line.status),
      tests: testsOf(line.tests),
      broken: line.broken,
      findings,
      nearMisses: result.decoys.filter((d) => d.line === line.id).map((d) => ({ id: d.id, people: d.people })),
      people: [...new Set(findings.flatMap((f) => f.people))],
      wholeFirm: findings.some((f) => f.people.length === 0),
      rows: rowKeys.length === 0 ? null : rowKeys.reduce((n, key) => n + (result.rowsByFile[FILE_NAMES[key]] ?? 0), 0),
      files: keys.map((key) => names[key] as string),
    };
  });
  return {
    locale,
    lines,
    tally: result.tally,
    rowsRead: result.rowsRead,
    findings: result.findings.length,
    checked: result.decoys.length,
    people: result.matrix.personIds,
    titles: result.matrix.titles,
    cells: result.matrix.cells,
    notice: NOTICE_DATE,
    visit: CHECK_DATE,
    today: TODAY_IN_EXERCISE,
    clock: clockCases(),
    week: weekCells(),
    needWorking: NOTICE_WORKING_DAYS,
    attendance: attendancePaper(locale, result),
    statement: statementPaper(locale),
    pay: payRow(locale, result),
    columns: recordColumns(locale),
    noteTemplate: kitText(EDITION[locale].note),
    wrong: result.wrong,
  };
}
