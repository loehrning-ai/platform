#!/usr/bin/env node
/**
 * Seeded generator for the dated kit files of Workshop 05 (the invented firm Gradba-Pro). Seed 2611.
 *
 * Writes every dated CSV and the overtime notices listing into scripts/workshop05/kit/folder/ and the
 * German tree (kit-de/ordner/), and the CSV templates (evidence index, clock, register into templates/ and vorlagen/; sample rows into extras/templates/ and extras/vorlagen/). The CSV bytes
 * are identical in both editions (both label lines are in every file).
 *
 *   node scripts/workshop05/oracle/generate.mjs            writes the files
 *   node scripts/workshop05/oracle/generate.mjs --check    writes nothing, exits 1 when a file on disk differs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PEOPLE, PLAN, FIXED_START, SEED } from "./plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const KIT_DIR = path.resolve(HERE, "../kit");
export const KIT_DIR_DE = path.resolve(HERE, "../kit-de");

const LABEL = ["# Fictional training material, invented for the exercise.", "# Erfundenes Übungsmaterial, für die Übung erfunden."];
// One more comment line in the employee records, both languages on the same line (identical bytes in both editions).
const RECORDS_THIRD =
  "# The 13-digit ids starting with 99 are invented and are not real personal numbers. Die 13-stelligen Nummern, die mit 99 beginnen, sind erfunden und keine echten Personennummern.";

/** mulberry32: small seeded generator, the same sequence on every machine. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const toDay = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const fromDay = (n) => new Date(n * DAY).toISOString().slice(0, 10);
const dow = (n) => (n + 4) % 7; // 0 Sunday ... 6 Saturday (day 0 is a Thursday)
const isWeekend = (n) => dow(n) === 0 || dow(n) === 6;
const pad = (n) => String(n).padStart(2, "0");

// A working-day calendar for North Macedonia, so that no invented slip, decision or filing is dated on a
// Sunday, on 1 May or on Orthodox Christmas. It holds the fixed public holidays, Orthodox Easter Monday and
// the first day of Ramadan Bayram (taken from the published calendar; a day of difference would change
// nothing here). A holiday on a Sunday also frees the Monday. The kit never prints a holiday; the calendar
// only keeps the dates plausible. Planted dates come from plan.mjs and are never moved.
const FIXED_HOLIDAYS = ["01-01", "01-07", "05-01", "05-24", "08-02", "09-08", "10-11", "10-23", "12-08"];
const RAMADAN_BAYRAM = {
  2012: "08-19", 2013: "08-08", 2014: "07-28", 2015: "07-17", 2016: "07-06", 2017: "06-25", 2018: "06-15", 2019: "06-04",
  2020: "05-24", 2021: "05-13", 2022: "05-02", 2023: "04-21", 2024: "04-10", 2025: "03-31", 2026: "03-20",
};
/** Orthodox Easter Sunday as a day number (Julian computus, 13 days to the Gregorian calendar until 2099). */
function orthodoxEaster(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return toDay(`${year}-${pad(month)}-${pad(day)}`) + 13;
}
const holidayCache = new Map();
function holidaysOf(year) {
  if (!holidayCache.has(year)) {
    const days = new Set(FIXED_HOLIDAYS.map((md) => toDay(`${year}-${md}`)));
    days.add(orthodoxEaster(year) + 1);
    if (RAMADAN_BAYRAM[year]) days.add(toDay(`${year}-${RAMADAN_BAYRAM[year]}`));
    for (const day of [...days]) if (dow(day) === 0) days.add(day + 1);
    holidayCache.set(year, days);
  }
  return holidayCache.get(year);
}
const isHoliday = (n) => holidaysOf(new Date(n * DAY).getUTCFullYear()).has(n) || holidaysOf(new Date((n - 1) * DAY).getUTCFullYear()).has(n);
export const isWorkingDay = (n) => !isWeekend(n) && !isHoliday(n);
/** The same day when it is a working day, else the next one (step 1) or the one before (step -1). */
const snap = (n, step = 1) => {
  let day = n;
  while (!isWorkingDay(day)) day += step;
  return day;
};
const snapIso = (iso, step = 1) => fromDay(snap(toDay(iso), step));

function csv(commentLines, header, rows) {
  return `${[...commentLines, header, ...rows].join("\n")}\n`;
}

function workingDays(from, to) {
  const days = [];
  for (let d = toDay(from); d <= toDay(to); d += 1) if (!isWeekend(d)) days.push(fromDay(d));
  return days;
}

export function generateAll() {
  const rand = mulberry32(SEED);
  const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const files = {};

  // Start dates: fixed ones from the plan, the rest drawn before 2025-07-01 and moved to a Monday.
  const first = toDay("2012-01-02");
  const last = toDay("2025-06-30");
  const people = PEOPLE.map((p) => {
    let start = FIXED_START[p.id];
    if (!start) {
      let day = int(first, last);
      while (dow(day) !== 1 || !isWorkingDay(day)) day += 1; // a Monday that is not a holiday
      start = fromDay(day);
    }
    return { ...p, start };
  });
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));

  // contracts_register_2026.csv
  files["contracts_register_2026.csv"] = csv(
    LABEL,
    "id,role,workplace,start_date,hours_per_week,copy_handed_over",
    people.map((p) => `${p.id},${p.title},${p.site},${p.start},${p.hours},yes`),
  );

  // registration_M1M2_2026.csv: filed 4 to 10 days before the start, except the planted ones
  files["registration_M1M2_2026.csv"] = csv(
    LABEL,
    "id,date_filed",
    people.map((p) => {
      const fixed = PLAN.registrationFixed[p.id];
      // a drawn filing date moves back to the working day before, so it stays before the day before the start
      const filed = fixed ?? fromDay(snap(toDay(p.start) - int(4, 10), -1));
      return `${p.id},${filed}`;
    }),
  );

  // employee_records_2026.csv: 22 invented fields, 7 empty cells
  const usedNumbers = new Set();
  const personalNumber = () => {
    for (;;) {
      let digits = "99";
      for (let i = 0; i < 11; i += 1) digits += int(0, 9);
      if (!usedNumbers.has(digits)) {
        usedNumbers.add(digits);
        return digits;
      }
    }
  };
  const recordRows = people.map((p) => {
    const fields = [
      personalNumber(),
      String(int(1962, 2003)),
      "MK",
      pick(["Bitola", "Bitola", "Novaci", "Mogila", "Prilep", "Resen"]),
      pick(["secondary", "secondary", "higher", "primary"]),
      pick(["trade", "logistics", "economics", "mechanics", "office"]),
      p.code,
      p.site.replace(/ .*/, ""),
      p.start,
      "indefinite",
      String(p.hours),
      `G${int(1, 5)}`,
      "P1",
      "yes",
      String(int(2004, 2025)),
      String(int(0, 6)),
      "30",
      "20",
      pick(["day", "day", "two-shift"]),
      pick(["B", "B", "none"]),
      pick(["yes", "no"]),
      snapIso(`2026-${pad(int(1, 10))}-${pad(int(1, 28))}`),
    ];
    for (const n of PLAN.emptyCells[p.id] ?? []) fields[n - 1] = "";
    return `${p.id},${fields.join(",")}`;
  });
  files["employee_records_2026.csv"] = csv(
    [...LABEL, RECORDS_THIRD],
    `id,${Array.from({ length: 22 }, (_, i) => `f${pad(i + 1)}`).join(",")}`,
    recordRows,
  );

  // attendance_2026-11.csv: 18 working days x 24 people
  const days = workingDays(PLAN.attendanceFirstDay, PLAN.attendanceLastDay);
  const tick = new Set(workingDays(PLAN.tickOnly.from, PLAN.tickOnly.to));
  const absent = new Set(workingDays(PLAN.absence.from, PLAN.absence.to));
  const hhmm = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const attendance = [];
  for (const date of days) {
    for (const p of people) {
      const start = 7 * 60 + 50 + int(0, 20);
      const end = 16 * 60 + int(0, 20);
      if (PLAN.tickOnly.ids.includes(p.id) && tick.has(date)) attendance.push(`${p.id},${date},,,x,`);
      else if (p.id === PLAN.absence.id && absent.has(date)) attendance.push(`${p.id},${date},,,,${PLAN.absence.code}`);
      else attendance.push(`${p.id},${date},${hhmm(start)},${hhmm(end)},,`);
    }
  }
  files["attendance_2026-11.csv"] = csv(LABEL, "id,date,start,end,tick,code", attendance);

  // overtime_weekly_2026.csv
  const overtime = [];
  for (const [id, hours] of Object.entries(PLAN.overtime)) {
    for (let w = 0; w < PLAN.overtimeWeeks; w += 1) overtime.push(`${id},${fromDay(toDay(PLAN.overtimeFirstMonday) + 7 * w)},${hours}`);
  }
  files["overtime_weekly_2026.csv"] = csv(LABEL, "id,week_start,overtime_hours", overtime);

  // payroll_runs_2026.csv: pay day is the 9th of the next month, a weekend day moves to Monday
  const runs = [];
  for (let month = 1; month <= 10; month += 1) {
    const periodEnd = fromDay(toDay(`2026-${pad(month + 1)}-01`) - 1);
    let pay = toDay(`2026-${pad(month + 1)}-09`);
    pay = snap(pay);
    runs.push(`${periodEnd},${PLAN.payExceptions[periodEnd] ?? fromDay(pay)}`);
  }
  files["payroll_runs_2026.csv"] = csv(LABEL, "period_end,pay_date", runs);

  // payroll_lines_2026-07_to_10.csv
  const lines = [];
  for (const month of ["2026-07", "2026-08", "2026-09", "2026-10"]) {
    for (const p of people) lines.push(`${p.id},${month},${int(160, 176)},${PLAN.overtime[p.id] ? "" : "0"}`);
  }
  files["payroll_lines_2026-07_to_10.csv"] = csv(LABEL, "id,month,hours_total,overtime_line_hours", lines);

  // leave_decisions_2026.csv: everyone owed leave except E-11 and E-19, E-22 is not owed yet
  const leave = [];
  for (const p of people) {
    if (p.id === "E-22" || PLAN.leaveMissing.includes(p.id)) continue;
    const decided = PLAN.leaveDecisionFixed[p.id] ?? snapIso(`2026-${pad(int(1, 2))}-${pad(int(2, 27))}`);
    const daysOwed = PLAN.leaveDays[p.id] ?? int(21, 25);
    leave.push(`${p.id},${daysOwed},${decided}`);
  }
  files["leave_decisions_2026.csv"] = csv(LABEL, "id,days,decision_date", leave);

  // absences_2026.csv
  const a = PLAN.absence;
  files["absences_2026.csv"] = csv(LABEL, "id,from,to,days,code", [`${a.id},${a.from},${a.to},${a.days},${a.code}`]);

  // medical_exams.csv: no health content, a date per person
  const examFirst = toDay("2025-01-06");
  const examLast = toDay("2026-10-30");
  files["medical_exams.csv"] = csv(
    LABEL,
    "id,last_exam_date",
    people.map((p) => `${p.id},${PLAN.examFixed[p.id] ?? fromDay(snap(int(examFirst, examLast)))}`),
  );

  // training_proofs_2026.csv
  files["training_proofs_2026.csv"] = csv(
    LABEL,
    "id,hire_date,training_date",
    PLAN.trainingIds.map((id) => `${id},${byId[id].start},${PLAN.trainingFixed[id]}`),
  );

  // overtime notices listing, English and German
  const notices = {
    en: [
      "Fictional training material, invented for the exercise. Not legal advice.",
      "Folder listing: overtime notices to the labour inspector. Invented firm Gradba-Pro DOOEL.",
      "Format: date | people | what the notice says | sign-off",
      "2019-06-03 | none named | overtime for the autumn rush of 2019 | Signed by:",
      "2026: (empty)",
      "",
    ].join("\n"),
    de: [
      "Erfundenes Übungsmaterial, für die Übung erfunden. Keine Rechtsberatung.",
      "Liste im Aktenordner: Meldungen von Überstunden an den Arbeitsinspektor. Erfundene Firma Gradba-Pro DOOEL.",
      "Aufbau: Datum | Personen | Inhalt der Meldung | Unterschrift",
      "2019-06-03 | keine genannt | Überstunden in der Herbstsaison 2019 | Unterschrift:",
      "2026: (leer)",
      "",
    ].join("\n"),
  };

  // CSV templates (the same bytes in both editions)
  const templates = {
    "evidence-index.csv": csv(LABEL, "line_id,article,paper,owner,where,quote,period,scope,approval,status,closes_with,due", []),
    "clock.csv": csv(LABEL, "event,rule,date", ["example: delete this row,3 calendar days after a written request,2026-01-12"]),
    // Step 4: the header of the register (columns of SPEC 4.2); the same bytes in both editions.
    "register.csv": csv(LABEL, "person_id,paper,date,valid_until,owner,where,approved_by", []),
    "sample-rows_attendance.csv": csv(LABEL, "id,date,start,end,tick,code", [
      "X-01,2026-02-02,08:01,16:05,,",
      "X-02,2026-02-02,07:57,16:12,,",
      "X-03,2026-02-02,,,x,",
    ]),
  };

  const out = {};
  for (const [name, text] of Object.entries(files)) {
    out[`folder/${name}`] = text;
    out[`ordner/${name}`] = text;
  }
  out["folder/overtime_notices_folder.txt"] = notices.en;
  out["ordner/meldungen_ueberstunden_ordner.txt"] = notices.de;
  for (const [name, text] of Object.entries(templates)) {
    // The sample rows are optional practice, so they sit in extras/ (the same folder name in both editions).
    const extra = name === "sample-rows_attendance.csv" ? "extras/" : "";
    out[`${extra}templates/${name}`] = text;
    out[`${extra}vorlagen/${name}`] = text;
  }
  return out;
}

/** Path on disk for a generated key: folder/ and (extras/)templates/ in kit/, ordner/ and (extras/)vorlagen/ in kit-de/. */
export function diskPath(key) {
  return path.join(/^(folder|templates|extras\/templates)\//.test(key) ? KIT_DIR : KIT_DIR_DE, key);
}

export function checkAll() {
  const generated = generateAll();
  const differing = [];
  for (const [key, text] of Object.entries(generated)) {
    const file = diskPath(key);
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) differing.push(key);
  }
  return { count: Object.keys(generated).length, differing };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const { count, differing } = checkAll();
    if (differing.length > 0) {
      console.error(`generate.mjs --check: ${differing.length} of ${count} files differ from the generator output (seed ${SEED}):\n  ${differing.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`generate.mjs --check: ${count} files equal the generator output (seed ${SEED}).`);
  } else {
    const generated = generateAll();
    for (const [key, text] of Object.entries(generated)) {
      const file = diskPath(key);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
    console.log(`generate.mjs: wrote ${Object.keys(generated).length} files (seed ${SEED}).`);
  }
}
