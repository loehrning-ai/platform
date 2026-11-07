/**
 * The plan of the invented firm Gradba-Pro DOOEL (Bitola, 24 staff): the people and the planted
 * events as plain data. generate.mjs turns this plan into the kit files with a seeded generator.
 * Everything here is invented for the exercise.
 */

export const SEED = 2611;
export const CHECK_DATE = "2026-11-27";
export const NOTICE_DATE = "2026-11-23";
export const TODAY_IN_EXERCISE = "2026-11-26";

/** The ten job titles in the contracts register (the exact words the 2019 statement uses). */
export const TITLES = {
  director: { code: "T01", site: "office", hours: 40 },
  "office manager": { code: "T02", site: "office", hours: 40 },
  "purchasing and accounts clerk": { code: "T03", site: "office", hours: 40 },
  "sales adviser": { code: "T04", site: "shop", hours: 40 },
  cashier: { code: "T05", site: "shop", hours: 40 },
  "order picker": { code: "T06", site: "hall", hours: 40 },
  driver: { code: "T07", site: "yard", hours: 40 },
  "forklift operator": { code: "T08", site: "hall", hours: 40 },
  dispatcher: { code: "T09", site: "yard", hours: 40 },
  cleaner: { code: "T10", site: "shop and office", hours: 20 },
};

/** The two job positions the 2019 statement does not list (hall racking and forklift work came in 2023). */
export const MISSING_FROM_STATEMENT = ["forklift operator", "order picker"];

const ROWS = [
  ["E-01", "director"],
  ["E-02", "office manager"],
  ["E-03", "purchasing and accounts clerk"],
  ["E-04", "purchasing and accounts clerk"],
  ["E-05", "sales adviser"],
  ["E-06", "sales adviser"],
  ["E-07", "order picker"],
  ["E-08", "order picker"],
  ["E-09", "sales adviser"],
  ["E-10", "sales adviser"],
  ["E-11", "sales adviser"],
  ["E-12", "driver"],
  ["E-13", "driver"],
  ["E-14", "driver"],
  ["E-15", "cashier"],
  ["E-16", "cashier"],
  ["E-17", "order picker"],
  ["E-18", "order picker"],
  ["E-19", "order picker"],
  ["E-20", "forklift operator"],
  ["E-21", "forklift operator"],
  ["E-22", "order picker"],
  ["E-23", "dispatcher"],
  ["E-24", "cleaner"],
];

/** Fixed hire dates (all Mondays). Everyone else is drawn by the generator before 2025-07-01. */
export const FIXED_START = {
  "E-05": "2026-03-02",
  "E-19": "2025-12-01",
  "E-22": "2026-06-01",
  "E-11": "2024-04-01",
  "E-14": "2023-09-04",
};

export const PEOPLE = ROWS.map(([id, title]) => ({ id, title, ...TITLES[title] }));

/** Planted events, by finding (F) and near miss (D). */
export const PLAN = {
  // F1 and D1: registration (M1/M2)
  registrationFixed: { "E-05": "2026-03-05", "E-22": "2026-05-29" },
  // F2, F3 and D2: overtime, one row per Monday from 2026-07-06 to 2026-10-26 (17 weeks)
  overtime: { "E-07": 9, "E-08": 7 },
  overtimeFirstMonday: "2026-07-06",
  overtimeWeeks: 17,
  // F5 and D8: attendance, 18 working days from Mon 2 Nov to Wed 25 Nov 2026
  attendanceFirstDay: "2026-11-02",
  attendanceLastDay: "2026-11-25",
  tickOnly: { ids: ["E-12", "E-13"], from: "2026-11-02", to: "2026-11-13" },
  absence: { id: "E-07", from: "2026-11-09", to: "2026-11-16", days: 6, code: "ABS" },
  // F6 and D4: pay dates of the Sept and Oct periods
  payExceptions: { "2026-09-30": "2026-10-19", "2026-10-31": "2026-11-16" },
  // F7, D3, D6: leave decisions (E-11 and E-19 have none, E-22 is not owed yet)
  leaveMissing: ["E-11", "E-19"],
  leaveDays: { "E-14": 18, "E-09": 20 },
  leaveDecisionFixed: { "E-05": "2026-09-03" },
  // F8: empty cells in the employee records (field numbers)
  emptyCells: { "E-04": [5, 6], "E-15": [4, 15, 21], "E-21": [13, 19] },
  // F9, D5: medical exams
  examFixed: { "E-02": "2024-09-12", "E-06": "2024-09-12", "E-10": "2024-09-12", "E-16": "2024-09-12", "E-03": "2024-12-03" },
  // D7: safety training proofs of the three hires (on or before the hire date)
  trainingFixed: { "E-05": "2026-03-02", "E-19": "2025-11-28", "E-22": "2026-06-01" },
  trainingIds: ["E-05", "E-19", "E-22"],
  // F10, L11: the 2019 statement and the last change to the workplace
  statementDate: "2019-03-14",
  opinionDate: "2019-03-20",
  workplaceChangeYear: 2023,
};

/** The 13 checklist lines: id, short label (deck chips), which excerpt file holds it. */
export const LINES = [
  { id: "L01", file: "labour", label: "Contract", labelDe: "Vertrag" },
  { id: "L02", file: "labour", label: "Registration", labelDe: "Anmeldung" },
  { id: "L03", file: "records", label: "Records", labelDe: "Akten" },
  { id: "L04", file: "labour", label: "Attendance", labelDe: "Anwesenheit" },
  { id: "L05", file: "labour", label: "Overtime cap", labelDe: "Überstunden max." },
  { id: "L06", file: "labour", label: "Overtime notice", labelDe: "Überstundenmeldung" },
  { id: "L07", file: "labour", label: "Overtime pay line", labelDe: "Überstundenzeile" },
  { id: "L08", file: "labour", label: "Pay date", labelDe: "Zahltag" },
  { id: "L09", file: "labour", label: "Leave", labelDe: "Urlaub" },
  { id: "L10", file: "safety", label: "Safety statement", labelDe: "Sicherheitserklärung" },
  { id: "L11", file: "safety", label: "Employee opinion", labelDe: "Stellungnahme" },
  { id: "L12", file: "safety", label: "Medical exams", labelDe: "Untersuchungen" },
  { id: "L13", file: "safety", label: "Training", labelDe: "Unterweisung" },
];

/** The expected status per line (the twin-pair table of the kit design). The oracle must reproduce it. */
export const EXPECTED_STATUS = {
  L01: "COVERED",
  L02: "GAP",
  L03: "GAP",
  L04: "GAP",
  L05: "GAP",
  L06: "GAP",
  L07: "GAP",
  L08: "GAP",
  L09: "GAP",
  L10: "GAP",
  L11: "WEAK",
  L12: "GAP",
  L13: "COVERED",
};
