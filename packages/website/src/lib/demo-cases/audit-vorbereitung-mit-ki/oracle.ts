/**
 * The oracle of the W05 demo: a TypeScript port of scripts/workshop05/oracle/oracle.mjs. One pure function,
 * analyse(files), reads the text of the kit files of the invented firm and returns what a careful check
 * finds: rows read, findings, near misses, the status per checklist line and the 13 x 24 matrix.
 * No clock, no randomness, no file access; the kit text comes from kit.ts. oracle.test.ts holds the
 * result equal to scripts/workshop05/oracle/expected.json, so a number is never typed here or in the copy.
 *
 * statusOf(tests, broken): a part that fails QUOTE or SCOPE, or a record that shows the rule broken,
 * gives gap; a failed PERIOD or APPROVAL gives weak; otherwise covered. The weakest part counts.
 */

import { KIT_TEXT } from "./kit";

export const CHECK_DATE = "2026-11-27";
export const NOTICE_DATE = "2026-11-23";

// Thresholds of the checklist rule sentences.
const ATTENDANCE_MAX_STAFF = 25;
const OVERTIME_CAP = 8;
const PAY_DAYS = 15;
const LEAVE_MIN = 20;
const LEAVE_AFTER_MONTHS = 6;
const EXAM_MONTHS = 24;
const NEW_HIRE_MONTHS = 12;
const REGISTRATION_LEAD_DAYS = 1;
const REGISTRATION_CLOSE_CALL_DAYS = 3;
const EXAM_SOON_DAYS = 30;
const SAME_TIMES_MIN_ROWS = 10;
/** The papers the inspector asks for are due this many calendar days after the visit (the invented request). */
const PAPERS_DUE_DAYS = 3;

export const FILE_NAMES = {
  contracts: "contracts_register_2026.csv",
  registration: "registration_M1M2_2026.csv",
  records: "employee_records_2026.csv",
  attendance: "attendance_2026-11.csv",
  overtime: "overtime_weekly_2026.csv",
  runs: "payroll_runs_2026.csv",
  payLines: "payroll_lines_2026-07_to_10.csv",
  leave: "leave_decisions_2026.csv",
  absences: "absences_2026.csv",
  exams: "medical_exams.csv",
  training: "training_proofs_2026.csv",
  notices: "overtime_notices_folder.txt",
  statement: "safety_statement_2019.md",
  index: "folder-index.md",
} as const;

type FileKey = keyof typeof FILE_NAMES;
export type OracleFiles = Readonly<Record<string, string>>;

/** The files whose data rows are counted as "rows read" (the 11 CSV files of the folder). */
const COUNTED: readonly FileKey[] = ["contracts", "registration", "records", "attendance", "overtime", "runs", "payLines", "leave", "absences", "exams", "training"];

export const LINE_IDS = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13"] as const;
export type LineId = (typeof LINE_IDS)[number];

export type OracleStatus = "COVERED" | "WEAK" | "GAP";
export interface TestResults {
  quote: boolean;
  period: boolean;
  scope: boolean;
  approval: boolean;
}

/** Finding id by checklist line. */
const WHOLE_FIRM = new Set(["F6", "F10"]);

export interface Finding {
  readonly id: string;
  readonly line: LineId;
  readonly people: readonly string[];
  readonly number: number;
  readonly unit: string;
  readonly facts: Readonly<Record<string, unknown>>;
}

export interface Decoy {
  readonly id: string;
  readonly line: LineId;
  readonly people: readonly string[];
  readonly reason: string;
}

export interface Warning {
  readonly id: string;
  readonly line: LineId;
  readonly people: readonly string[];
  readonly number: number;
  readonly unit: string;
}

export interface LineResult {
  readonly id: LineId;
  readonly status: OracleStatus;
  readonly tests: Readonly<TestResults>;
  readonly broken: boolean;
  readonly findings: readonly string[];
  readonly decoys: readonly string[];
}

export interface OracleResult {
  readonly checkDate: string;
  readonly rowsRead: number;
  readonly rowsByFile: Readonly<Record<string, number>>;
  readonly lines: readonly LineResult[];
  readonly tally: { readonly covered: number; readonly weak: number; readonly gap: number };
  readonly findings: readonly Finding[];
  readonly decoys: readonly Decoy[];
  readonly warnings: readonly Warning[];
  readonly wrong: { readonly over: number; readonly under: number };
  readonly peopleInFindings: number;
  readonly overtime: Readonly<Record<string, { weeks: number; weeksAboveCap: number; hours: number; perWeek: readonly number[] }>>;
  readonly days: { readonly notice: string; readonly visit: string; readonly calendar: number; readonly workingBetween: number; readonly papersDue: string };
  readonly matrix: {
    readonly lines: number;
    readonly people: number;
    readonly lineIds: readonly LineId[];
    readonly personIds: readonly string[];
    readonly titles: readonly string[];
    readonly cells: readonly (readonly number[])[];
  };
}

export interface OracleOptions {
  /** false reads the pay rule without the free-day move (a what-if). */
  readonly freeDayMove?: boolean;
}

// ---------------------------------------------------------------- dates (UTC day numbers)
const DAY = 86_400_000;
const toDay = (iso: string): number => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const fromDay = (n: number): string => new Date(n * DAY).toISOString().slice(0, 10);
const weekday = (n: number): number => (n + 4) % 7; // 0 Sunday ... 6 Saturday
const isFreeDay = (n: number): boolean => weekday(n) === 0 || weekday(n) === 6;
const nextWorkingDay = (n: number): number => {
  let d = n;
  while (isFreeDay(d)) d += 1;
  return d;
};
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Calendar days and working days (Monday to Friday, no holiday list) strictly between a notice and a visit. */
export function daysBetween(notice: string, visit: string): { readonly calendar: number; readonly workingBetween: number; readonly papersDue: string } {
  const from = toDay(notice);
  const to = toDay(visit);
  let workingBetween = 0;
  for (let d = from + 1; d < to; d += 1) if (!isFreeDay(d)) workingBetween += 1;
  return { calendar: to - from, workingBetween, papersDue: fromDay(to + PAPERS_DUE_DAYS) };
}

/** Day of the week as an index, 0 Sunday to 6 Saturday, for the demo's calendar strip. */
export function weekdayOf(iso: string): number {
  return weekday(toDay(iso));
}

// ---------------------------------------------------------------- parsing
type Row = Record<string, string>;

function table(text: string | undefined): Row[] {
  if (typeof text !== "string") throw new Error("oracle: a kit file is missing");
  const rows = text
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));
  const header = (rows[0] ?? "").split(",");
  return rows.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]));
  });
}

const uniq = <T>(list: readonly T[]): T[] => [...new Set(list)];
const sortIds = (ids: readonly string[]): string[] => [...ids].sort();
const cell = (row: Row, name: string): string => row[name] ?? "";

export function statusOf(tests: Readonly<TestResults>, broken = false): OracleStatus {
  if (broken || !tests.quote || !tests.scope) return "GAP";
  if (!tests.period || !tests.approval) return "WEAK";
  return "COVERED";
}

/**
 * Analyse the kit files: an object {file name: text} with the 14 names of FILE_NAMES.
 * Lines that start with # in a CSV are comments and are skipped.
 */
export function analyse(files: OracleFiles, options: OracleOptions = {}): OracleResult {
  const freeDayMove = options.freeDayMove !== false;
  const get = (key: FileKey): string => files[FILE_NAMES[key]] as string;
  const T = Object.fromEntries(COUNTED.map((key) => [key, table(get(key))])) as Record<FileKey, Row[]>;
  const rowsByFile = Object.fromEntries(COUNTED.map((key) => [FILE_NAMES[key], T[key].length]));
  const rowsRead = Object.values(rowsByFile).reduce((a, b) => a + b, 0);
  const check = toDay(CHECK_DATE);

  const people = T.contracts.map((r) => cell(r, "id"));
  const start = Object.fromEntries(T.contracts.map((r) => [cell(r, "id"), cell(r, "start_date")]));
  const roleOf = Object.fromEntries(T.contracts.map((r) => [cell(r, "id"), cell(r, "role")]));
  const attendanceApplies = people.length <= ATTENDANCE_MAX_STAFF;

  const findings: Finding[] = [];
  const decoys: Decoy[] = [];
  const warnings: Warning[] = [];
  const tests = Object.fromEntries(LINE_IDS.map((id) => [id, { quote: true, period: true, scope: true, approval: true }])) as Record<LineId, TestResults>;
  const broken = Object.fromEntries(LINE_IDS.map((id) => [id, false])) as Record<LineId, boolean>;

  // ---- L01 contracts
  const noCopy = T.contracts.filter((r) => cell(r, "copy_handed_over") !== "yes").map((r) => cell(r, "id"));
  tests.L01.scope = people.every((id) => T.records.some((r) => cell(r, "id") === id));
  tests.L01.approval = noCopy.length === 0;
  broken.L01 = noCopy.length > 0;

  // ---- L02 registration: due the day before the start (F1), close calls that are in time (D1)
  const newHireFrom = toDay(addMonths(CHECK_DATE, -NEW_HIRE_MONTHS));
  const newHires = people.filter((id) => toDay(start[id] as string) > newHireFrom);
  const late: { id: string; filed: string; due: string; start: string; daysAfterDue: number; daysAfterStart: number }[] = [];
  const closeCalls: string[] = [];
  for (const row of T.registration) {
    const id = cell(row, "id");
    const due = toDay(start[id] as string) - REGISTRATION_LEAD_DAYS;
    const filed = toDay(cell(row, "date_filed"));
    if (filed > due) late.push({ id, filed: cell(row, "date_filed"), due: fromDay(due), start: start[id] as string, daysAfterDue: filed - due, daysAfterStart: filed - toDay(start[id] as string) });
    else if (toDay(start[id] as string) - filed <= REGISTRATION_CLOSE_CALL_DAYS) closeCalls.push(id);
  }
  tests.L02.scope = people.every((id) => T.registration.some((r) => cell(r, "id") === id));
  tests.L02.period = late.length === 0;
  broken.L02 = late.length > 0;
  if (late.length > 0) {
    findings.push({ id: "F1", line: "L02", people: late.map((x) => x.id), number: Math.max(...late.map((x) => x.daysAfterDue)), unit: "days after the due date", facts: { late } });
  }
  if (closeCalls.length > 0) decoys.push({ id: "D1", line: "L02", people: closeCalls, reason: "filed in time, before the day before the start" });

  // ---- L03 employee records: empty cells (F8)
  const recordColumns = Object.keys(T.records[0] ?? {}).filter((name) => /^f\d\d$/.test(name));
  const emptyByPerson: Record<string, string[]> = {};
  for (const r of T.records) {
    const empty = recordColumns.filter((c) => cell(r, c) === "");
    if (empty.length > 0) emptyByPerson[cell(r, "id")] = empty;
  }
  const incomplete = Object.keys(emptyByPerson);
  const emptyCells = incomplete.reduce((n, id) => n + (emptyByPerson[id] as string[]).length, 0);
  tests.L03.scope = incomplete.length === 0 && T.records.length === people.length;
  if (incomplete.length > 0) {
    findings.push({ id: "F8", line: "L03", people: incomplete, number: emptyCells, unit: "empty cells", facts: { fields: recordColumns.length, emptyByPerson } });
  }

  // ---- L04 attendance: rows without start and end (F5), absence code backed by the absences file (D8)
  const absent = (id: string, date: string): boolean => T.absences.some((a) => cell(a, "id") === id && cell(a, "from") <= date && date <= cell(a, "to"));
  const timeless: Row[] = [];
  const absenceCleared: Row[] = [];
  for (const r of T.attendance) {
    if (cell(r, "start") !== "" && cell(r, "end") !== "") continue;
    if (cell(r, "code") !== "" && absent(cell(r, "id"), cell(r, "date"))) absenceCleared.push(r);
    else timeless.push(r);
  }
  const attendanceDays = uniq(T.attendance.map((r) => cell(r, "date")));
  tests.L04.quote = !attendanceApplies || timeless.length === 0;
  tests.L04.scope = people.every((id) => T.attendance.some((r) => cell(r, "id") === id));
  if (attendanceApplies && timeless.length > 0) {
    const ids = uniq(timeless.map((r) => cell(r, "id")));
    const dates = timeless.map((r) => cell(r, "date")).sort();
    findings.push({
      id: "F5",
      line: "L04",
      people: ids,
      number: timeless.length,
      unit: "person-days",
      facts: { from: dates[0], to: dates[dates.length - 1], perPerson: Object.fromEntries(ids.map((id) => [id, timeless.filter((r) => cell(r, "id") === id).length])), workingDays: attendanceDays.length },
    });
  }
  if (absenceCleared.length > 0) decoys.push({ id: "D8", line: "L04", people: uniq(absenceCleared.map((r) => cell(r, "id"))), reason: "absence code present, matches absences_2026.csv" });
  // Amber warning: one person with many rows that carry the very same start and end.
  const sameTimes: { id: string; rows: number; times: string }[] = [];
  for (const id of people) {
    const groups = new Map<string, number>();
    for (const r of T.attendance) {
      if (cell(r, "id") !== id || cell(r, "start") === "" || cell(r, "end") === "") continue;
      const key = `${cell(r, "start")} to ${cell(r, "end")}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    const [times, rows] = [...groups.entries()].sort((x, y) => y[1] - x[1])[0] ?? ["", 0];
    if (rows >= SAME_TIMES_MIN_ROWS) sameTimes.push({ id, rows, times });
  }
  if (sameTimes.length > 0) {
    warnings.push({ id: "W1", line: "L04", people: sameTimes.map((x) => x.id), number: sameTimes.reduce((n, x) => n + x.rows, 0), unit: "rows with identical times" });
  }
  tests.L04.approval = sameTimes.length === 0;

  // ---- L05 overtime cap (F3, per person), D2
  const hoursOf: Record<string, { week: string; hours: number }[]> = {};
  for (const r of T.overtime) (hoursOf[cell(r, "id")] ??= []).push({ week: cell(r, "week_start"), hours: Number(cell(r, "overtime_hours")) });
  const overtime: Record<string, { weeks: number; weeksAboveCap: number; hours: number; perWeek: number[] }> = {};
  const overFindings: string[] = [];
  const nearCap: string[] = [];
  for (const id of Object.keys(hoursOf).sort()) {
    const weeks = hoursOf[id] as { week: string; hours: number }[];
    const total = weeks.reduce((n, w) => n + w.hours, 0);
    const above = weeks.filter((w) => w.hours > OVERTIME_CAP);
    overtime[id] = { weeks: weeks.length, weeksAboveCap: above.length, hours: total, perWeek: uniq(weeks.map((w) => w.hours)) };
    if (above.length > 0) overFindings.push(id);
    else if (weeks.every((w) => w.hours >= OVERTIME_CAP - 1)) nearCap.push(id);
  }
  broken.L05 = overFindings.length > 0;
  tests.L05.period = overFindings.length === 0;
  overFindings.forEach((id, i) => {
    const o = overtime[id] as (typeof overtime)[string];
    findings.push({ id: i === 0 ? "F3" : `F3${String.fromCharCode(97 + i)}`, line: "L05", people: [id], number: o.hours, unit: "hours", facts: { ...o, cap: OVERTIME_CAP } });
  });
  if (nearCap.length > 0) decoys.push({ id: "D2", line: "L05", people: nearCap, reason: `below ${OVERTIME_CAP} h a week` });

  // ---- L06 overtime notices: signed, naming the person, dated before the week (F2)
  const notices = get("notices")
    .split("\n")
    .map((line) => line.match(/^(\d{4}-\d{2}-\d{2}) \| ([^|]*) \| ([^|]*) \| Signed by:(.*)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ date: m[1] as string, ids: (m[2] as string).match(/E-\d\d/g) ?? ([] as string[]), signedBy: (m[4] as string).trim() }));
  const noticeValid = (id: string, week: string): boolean => notices.some((n) => n.signedBy !== "" && n.ids.includes(id) && n.date <= week);
  const noNotice: Record<string, number> = {};
  for (const id of Object.keys(hoursOf)) noNotice[id] = (hoursOf[id] as { week: string; hours: number }[]).filter((w) => w.hours > 0 && !noticeValid(id, w.week)).length;
  const noticePeople = Object.keys(noNotice).filter((id) => (noNotice[id] as number) > 0).sort();
  const unsignedNotices = notices.filter((n) => n.signedBy === "");
  tests.L06.quote = noticePeople.length === 0;
  tests.L06.period = notices.some((n) => n.date >= "2026-01-01");
  tests.L06.approval = unsignedNotices.length === 0;
  if (noticePeople.length > 0) {
    const weeks = Math.max(...noticePeople.map((id) => noNotice[id] as number));
    findings.push({
      id: "F2",
      line: "L06",
      people: noticePeople,
      number: weeks,
      unit: "weeks without a notice",
      facts: { weeksPerPerson: Object.fromEntries(noticePeople.map((id) => [id, noNotice[id]])), notices2026: notices.filter((n) => n.date >= "2026-01-01").length, noticesInFolder: notices.length, unsigned: unsignedNotices.length },
    });
  }

  // ---- L07 pay lines: overtime worked in the month, no overtime line (F4)
  const overtimeInMonth = (id: string, month: string): number => (hoursOf[id] ?? []).filter((w) => w.week.startsWith(month)).reduce((n, w) => n + w.hours, 0);
  const missingLines = T.payLines.filter((r) => overtimeInMonth(cell(r, "id"), cell(r, "month")) > 0 && (cell(r, "overtime_line_hours") === "" || Number(cell(r, "overtime_line_hours")) === 0));
  tests.L07.scope = missingLines.length === 0;
  if (missingLines.length > 0) {
    findings.push({ id: "F4", line: "L07", people: uniq(missingLines.map((r) => cell(r, "id"))), number: missingLines.length, unit: "pay lines", facts: { months: uniq(missingLines.map((r) => cell(r, "month"))).length } });
  }

  // ---- L08 pay date: at most 15 days after the period, a free day moves it (F6 per run), D4
  const lateRuns: { periodEnd: string; paid: string; limit: string; daysLate: number }[] = [];
  const movedRuns: { periodEnd: string; paid: string; rawLimit: string; limit: string }[] = [];
  for (const r of T.runs) {
    const raw = toDay(cell(r, "period_end")) + PAY_DAYS;
    const limit = freeDayMove ? nextWorkingDay(raw) : raw;
    const paid = toDay(cell(r, "pay_date"));
    if (paid > limit) lateRuns.push({ periodEnd: cell(r, "period_end"), paid: cell(r, "pay_date"), limit: fromDay(limit), daysLate: paid - limit });
    else if (freeDayMove && paid > raw) movedRuns.push({ periodEnd: cell(r, "period_end"), paid: cell(r, "pay_date"), rawLimit: fromDay(raw), limit: fromDay(limit) });
  }
  broken.L08 = lateRuns.length > 0;
  lateRuns.forEach((run, i) => {
    findings.push({ id: i === 0 ? "F6" : `F6${String.fromCharCode(97 + i)}`, line: "L08", people: [], number: run.daysLate, unit: "days late", facts: run });
  });
  if (movedRuns.length > 0) decoys.push({ id: "D4", line: "L08", people: [], reason: "day 15 is a free day, so the limit moves to the next working day" });

  // ---- L09 leave: owed after 6 months, at least 20 days (F7), D3, D6
  const owedFrom = (id: string): boolean => toDay(addMonths(start[id] as string, LEAVE_AFTER_MONTHS)) <= check;
  const owed = people.filter(owedFrom);
  const decision = Object.fromEntries(T.leave.map((r) => [cell(r, "id"), Number(cell(r, "days"))])) as Record<string, number | undefined>;
  const leaveMissing = owed.filter((id) => decision[id] === undefined);
  const leaveBelow = owed.filter((id) => decision[id] !== undefined && (decision[id] as number) < LEAVE_MIN);
  const leaveExact = owed.filter((id) => decision[id] === LEAVE_MIN);
  const notOwedNoDecision = people.filter((id) => !owedFrom(id) && decision[id] === undefined);
  tests.L09.scope = leaveMissing.length === 0 && leaveBelow.length === 0;
  broken.L09 = leaveBelow.length > 0;
  if (leaveMissing.length + leaveBelow.length > 0) {
    const ids = sortIds([...leaveMissing, ...leaveBelow]);
    findings.push({
      id: "F7",
      line: "L09",
      people: ids,
      number: ids.length,
      unit: "people",
      facts: { owed: owed.length, decisions: T.leave.length, missing: leaveMissing, below: leaveBelow.map((id) => ({ id, days: decision[id] })), reachMinimum: T.leave.filter((r) => Number(cell(r, "days")) >= LEAVE_MIN).length },
    });
  }
  if (leaveExact.length > 0) decoys.push({ id: "D3", line: "L09", people: leaveExact, reason: `exactly ${LEAVE_MIN} days meets the minimum` });
  if (notOwedNoDecision.length > 0) {
    const first = notOwedNoDecision[0] as string;
    decoys.push({ id: "D6", line: "L09", people: notOwedNoDecision, reason: `the full right arises after ${LEAVE_AFTER_MONTHS} months, on ${addMonths(start[first] as string, LEAVE_AFTER_MONTHS)}` });
  }

  // ---- L10 safety statement names every job position in the register (F10)
  const statement = get("statement");
  const listed = (statement.match(/^- (.+)$/gm) ?? []).map((l) => l.slice(2).trim());
  const titles = uniq(T.contracts.map((r) => cell(r, "role")));
  const missingTitles = titles.filter((t) => !listed.includes(t));
  tests.L10.scope = missingTitles.length === 0;
  if (missingTitles.length > 0) {
    findings.push({ id: "F10", line: "L10", people: [], number: missingTitles.length, unit: "positions missing", facts: { titles: titles.length, listed: listed.length, missing: missingTitles, statementDate: (statement.match(/^Dated: (\d{4}-\d{2}-\d{2})/m) ?? [])[1] } });
  }

  // ---- L11 opinion dated after the last change to the workplace (the year from folder-index.md)
  const changeYear = Number((get("index").match(/Last change to the workplace:[^\n]*?(\d{4})/) ?? [])[1]);
  const opinion = (statement.match(/^Opinion of the employee representative:[^\n]*?(\d{4})-(\d{2})-(\d{2})/m) ?? []).slice(1);
  tests.L11.quote = opinion.length === 3;
  tests.L11.period = opinion.length === 3 && Number(opinion[0]) > changeYear;

  // ---- L12 medical exams at most 24 months old (F9), D5
  const oldExams: { id: string; last: string; daysPast: number }[] = [];
  const soon: { id: string; validUntil: string }[] = [];
  for (const r of T.exams) {
    const valid = toDay(addMonths(cell(r, "last_exam_date"), EXAM_MONTHS));
    if (valid < check) oldExams.push({ id: cell(r, "id"), last: cell(r, "last_exam_date"), daysPast: check - valid });
    else if (valid - check <= EXAM_SOON_DAYS) soon.push({ id: cell(r, "id"), validUntil: fromDay(valid) });
  }
  tests.L12.scope = T.exams.length === people.length;
  broken.L12 = oldExams.length > 0;
  if (oldExams.length > 0) {
    findings.push({ id: "F9", line: "L12", people: oldExams.map((x) => x.id), number: (oldExams[0] as { daysPast: number }).daysPast, unit: "days past 24 months", facts: { last: uniq(oldExams.map((x) => x.last)), daysPast: uniq(oldExams.map((x) => x.daysPast)) } });
  }
  if (soon.length > 0) decoys.push({ id: "D5", line: "L12", people: soon.map((x) => x.id), reason: `valid until ${(soon[0] as { validUntil: string }).validUntil}, within ${EXAM_MONTHS} months on ${CHECK_DATE}` });

  // ---- L13 training at hiring (D7); a proof later than the hire date would be a finding
  const proofs = Object.fromEntries(T.training.map((r) => [cell(r, "id"), r]));
  const noProof = newHires.filter((id) => !proofs[id]);
  const lateProof = T.training.filter((r) => cell(r, "training_date") > cell(r, "hire_date")).map((r) => cell(r, "id"));
  tests.L13.scope = noProof.length === 0;
  broken.L13 = lateProof.length > 0;
  const proofInTime = T.training.filter((r) => cell(r, "training_date") <= cell(r, "hire_date")).map((r) => cell(r, "id"));
  if (proofInTime.length > 0) decoys.push({ id: "D7", line: "L13", people: proofInTime, reason: "training on or before the hire date" });

  // ---- order the lists
  const num = (id: string): number => Number(id.slice(1).replace(/\D.*/, ""));
  findings.sort((a, b) => num(a.id) - num(b.id) || (a.id < b.id ? -1 : 1));
  decoys.sort((a, b) => a.id.localeCompare(b.id));

  // ---- lines and tally
  const lines: LineResult[] = LINE_IDS.map((id) => ({
    id,
    status: statusOf(tests[id], broken[id]),
    tests: { ...tests[id] },
    broken: broken[id],
    findings: findings.filter((f) => f.line === id).map((f) => f.id),
    decoys: decoys.filter((d) => d.line === id).map((d) => d.id),
  }));
  const tally = {
    covered: lines.filter((l) => l.status === "COVERED").length,
    weak: lines.filter((l) => l.status === "WEAK").length,
    gap: lines.filter((l) => l.status === "GAP").length,
  };

  // ---- wrong answers: over-flagging (every overtime week above 0, every leave of exactly 20 days) and under-flagging
  const overExtra: { id: string; line: LineId }[] = [];
  for (const id of Object.keys(hoursOf)) if ((hoursOf[id] as { hours: number }[]).some((w) => w.hours > 0) && !overFindings.includes(id)) overExtra.push({ id, line: "L05" });
  for (const id of owed) if (decision[id] === LEAVE_MIN && !leaveBelow.includes(id)) overExtra.push({ id, line: "L09" });
  const wrong = { over: findings.length + overExtra.length, under: findings.filter((f) => f.line !== "L08").length };

  // ---- people that appear in a finding (whole-firm findings F6 and F10 excluded)
  const peopleInFindings = uniq(findings.filter((f) => !WHOLE_FIRM.has(f.id.replace(/[a-z]$/, ""))).flatMap((f) => f.people)).length;

  const days = { notice: NOTICE_DATE, visit: CHECK_DATE, ...daysBetween(NOTICE_DATE, CHECK_DATE) };

  // ---- the 13 x 24 matrix: 0 plain, 1 finding, 2 checked with no problem
  const personIds = [...people];
  const cells = LINE_IDS.map((lineId) => {
    const row = personIds.map(() => 0);
    for (const d of decoys.filter((x) => x.line === lineId)) for (const p of d.people) row[personIds.indexOf(p)] = 2;
    for (const f of findings.filter((x) => x.line === lineId)) {
      if (f.people.length === 0) row.fill(1);
      else for (const p of f.people) row[personIds.indexOf(p)] = 1;
    }
    return row;
  });
  const matrix = { lines: LINE_IDS.length, people: personIds.length, lineIds: [...LINE_IDS], personIds, titles: personIds.map((id) => roleOf[id] as string), cells };

  return { checkDate: CHECK_DATE, rowsRead, rowsByFile, lines, tally, findings, decoys, warnings, wrong, peopleInFindings, overtime, days, matrix };
}

/** The 14 kit files the oracle reads, taken from the kit text this demo bundles (English folder). */
export function kitFolderFiles(): OracleFiles {
  return Object.fromEntries(
    Object.values(FILE_NAMES).map((name) => {
      const text = KIT_TEXT[`folder/${name}`];
      if (text === undefined) throw new Error(`oracle: ${name} is not in the kit`);
      return [name, text];
    }),
  );
}

let cached: OracleResult | null = null;

/** The result on the kit as shipped; computed once. */
export function analyseKit(): OracleResult {
  cached ??= analyse(kitFolderFiles());
  return cached;
}

export type WhatIf = "e08-nine-hours" | "ticks-filled" | "no-free-day-move";
export const WHAT_IFS: readonly WhatIf[] = ["e08-nine-hours", "ticks-filled", "no-free-day-move"];

/** The mutated copies of the kit files behind the three what-if buttons. */
export function whatIf(files: OracleFiles, kind: WhatIf): { readonly files: OracleFiles; readonly options: OracleOptions } {
  const next: Record<string, string> = { ...files };
  if (kind === "e08-nine-hours") {
    next[FILE_NAMES.overtime] = (files[FILE_NAMES.overtime] as string).replace(/^(E-08,[0-9-]+,)7$/gm, "$19");
    return { files: next, options: {} };
  }
  if (kind === "ticks-filled") {
    next[FILE_NAMES.attendance] = (files[FILE_NAMES.attendance] as string).replace(/^(E-1[23],[0-9-]+),,,x,$/gm, "$1,08:00,16:00,,");
    return { files: next, options: {} };
  }
  return { files: next, options: { freeDayMove: false } };
}

/** The counter of the what-if buttons: findings plus amber lines. */
export function counter(result: OracleResult): number {
  return result.findings.length + result.warnings.length;
}
