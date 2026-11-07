#!/usr/bin/env node
/**
 * An independent second implementation of the Workshop 05 check. It does NOT import oracle.mjs: it has
 * its own CSV splitter, counts days as Date.UTC differences, and reads the thresholds (25, 8, 15, 20,
 * 6, 24, 10) and the year of the last change to the workplace (2023) out of the checklist rule
 * sentences with regular expressions. recount() returns a compact result; compareWithExpected() sets it
 * against expected.json (the committed output of the oracle). Exit code 1 when they differ.
 *
 *   node scripts/workshop05/oracle/recount.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../kit");
const EXPECTED = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "expected.json");
const VISIT = "2026-11-27"; // the check date: the visit day
const NOTICE = "2026-11-23";

// ---- reading
const slurp = (rel) => readFileSync(path.join(KIT, rel), "utf8");

/** Split one CSV line, honouring double quotes. */
function splitLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

function rowsOf(name) {
  const lines = slurp(`folder/${name}`).split(/\r?\n/).filter((l) => l.length > 0 && l[0] !== "#");
  const [head, ...body] = lines.map(splitLine);
  return body.map((cells) => new Map(head.map((h, i) => [h, cells[i] ?? ""])));
}

// ---- dates
const num = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const iso = (n) => new Date(n * 86_400_000).toISOString().slice(0, 10);
const dayOfWeek = (n) => new Date(n * 86_400_000).getUTCDay();
const free = (n) => [0, 6].includes(dayOfWeek(n));
const plusMonths = (isoDate, k) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + k + 1, 0)).getUTCDate();
  return Date.UTC(y, m - 1 + k, Math.min(d, lastDay)) / 86_400_000;
};

// ---- thresholds out of the checklist sentences
function rules() {
  const sentences = new Map();
  for (const file of ["checklist_labour_excerpt.md", "checklist_safety_excerpt.md", "checklist_records_excerpt.md"]) {
    for (const line of slurp(`checklists/${file}`).split("\n")) {
      const cells = line.split("|").map((c) => c.trim());
      if (/^L\d\d$/.test(cells[1] ?? "")) sentences.set(cells[1], cells[4]);
    }
  }
  const grab = (id, re) => {
    const hit = (sentences.get(id) ?? "").match(re);
    if (!hit) throw new Error(`recount: no number in the sentence of ${id}`);
    return Number(hit[1]);
  };
  const words = { one: 1, two: 2, three: 3 };
  const lead = (sentences.get("L02") ?? "").match(/(one|two|three) days? before/);
  return {
    sentences,
    attendanceStaff: grab("L04", /Up to (\d+) employees/),
    overtimeCap: grab("L05", /at most (\d+) hours a week/),
    payDays: grab("L08", /at the latest (\d+) days/),
    leaveMin: grab("L09", /at least (\d+) working days/),
    leaveMonths: grab("L09", /with (\d+) months of service/),
    examMonths: grab("L12", /at most (\d+) months old/),
    titlesOnCheckDate: grab("L10", /\((\d+) on the check date\)/),
    changeYear: grab("L11", /the (\d{4}) racking addition/),
    registrationLead: lead ? words[lead[1]] : NaN,
  };
}

// ---- own near-miss constants (written down here, not shared with the oracle)
const CLOSE_CALL_DAYS = 3;
const EXAM_SOON_DAYS = 30;
const NEW_HIRE_MONTHS = 12;

export function recount() {
  const R = rules();
  const files = {
    contracts: "contracts_register_2026.csv",
    registration: "registration_M1M2_2026.csv",
    records: "employee_records_2026.csv",
    attendance: "attendance_2026-11.csv",
    overtime: "overtime_weekly_2026.csv",
    runs: "payroll_runs_2026.csv",
    lines: "payroll_lines_2026-07_to_10.csv",
    leave: "leave_decisions_2026.csv",
    absences: "absences_2026.csv",
    exams: "medical_exams.csv",
    training: "training_proofs_2026.csv",
  };
  const data = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, rowsOf(f)]));
  const perFile = Object.fromEntries(Object.entries(files).map(([k, f]) => [f, data[k].length]));
  const rowsRead = Object.values(perFile).reduce((s, n) => s + n, 0);

  const visit = num(VISIT);
  const staff = new Map(data.contracts.map((r) => [r.get("id"), { role: r.get("role"), start: r.get("start_date") }]));
  const ids = [...staff.keys()];
  const hits = new Map(); // line -> sorted people of the finding
  const nearMisses = new Map(); // id -> people
  const count = {}; // the printed number per finding line
  const hold = (line, people, n) => {
    hits.set(line, [...new Set(people)].sort());
    count[line] = n;
  };

  // L02 registration
  const lateRegistration = data.registration
    .map((r) => ({ id: r.get("id"), lateBy: num(r.get("date_filed")) - (num(staff.get(r.get("id")).start) - R.registrationLead), lead: num(staff.get(r.get("id")).start) - num(r.get("date_filed")) }))
  ;
  const lateOnes = lateRegistration.filter((x) => x.lateBy > 0);
  if (lateOnes.length) hold("L02", lateOnes.map((x) => x.id), Math.max(...lateOnes.map((x) => x.lateBy)));
  const close = lateRegistration.filter((x) => x.lateBy <= 0 && x.lead <= CLOSE_CALL_DAYS).map((x) => x.id);
  if (close.length) nearMisses.set("D1", close);

  // L03 records
  const empties = new Map();
  for (const r of data.records) {
    const gaps = [...r.entries()].filter(([k, v]) => /^f\d{2}$/.test(k) && v === "").length;
    if (gaps) empties.set(r.get("id"), gaps);
  }
  if (empties.size) hold("L03", [...empties.keys()], [...empties.values()].reduce((s, n) => s + n, 0));

  // L04 attendance (the rule applies up to 25 employees)
  const covered = (id, day) => data.absences.some((a) => a.get("id") === id && a.get("from") <= day && day <= a.get("to"));
  if (ids.length <= R.attendanceStaff) {
    const bare = data.attendance.filter((r) => (!r.get("start") || !r.get("end")));
    const unexplained = bare.filter((r) => !(r.get("code") && covered(r.get("id"), r.get("date"))));
    const explained = bare.filter((r) => r.get("code") && covered(r.get("id"), r.get("date")));
    if (unexplained.length) hold("L04", unexplained.map((r) => r.get("id")), unexplained.length);
    if (explained.length) nearMisses.set("D8", explained.map((r) => r.get("id")));
  }

  // L05 and L06 overtime
  const weeks = new Map();
  for (const r of data.overtime) weeks.set(r.get("id"), [...(weeks.get(r.get("id")) ?? []), { week: r.get("week_start"), h: Number(r.get("overtime_hours")) }]);
  const total = (id) => weeks.get(id).reduce((s, w) => s + w.h, 0);
  const above = [...weeks.keys()].filter((id) => weeks.get(id).some((w) => w.h > R.overtimeCap));
  if (above.length) hold("L05", above, total(above[0]));
  const nearCap = [...weeks.keys()].filter((id) => !above.includes(id) && weeks.get(id).every((w) => w.h === R.overtimeCap - 1));
  if (nearCap.length) nearMisses.set("D2", nearCap);

  const notices = slurp("folder/overtime_notices_folder.txt")
    .split("\n")
    .filter((l) => /^\d{4}-\d{2}-\d{2} \|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()))
    .map(([date, who, , sign]) => ({ date, who: who.match(/E-\d\d/g) ?? [], signed: sign.replace(/^Signed by:\s*/, "").length > 0 }));
  const uncovered = new Map();
  for (const [id, list] of weeks) {
    const n = list.filter((w) => !notices.some((x) => x.signed && x.who.includes(id) && x.date <= w.week)).length;
    if (n) uncovered.set(id, n);
  }
  if (uncovered.size) hold("L06", [...uncovered.keys()], Math.max(...uncovered.values()));

  // L07 pay lines
  const hoursInMonth = (id, month) => (weeks.get(id) ?? []).filter((w) => w.week.slice(0, 7) === month).reduce((s, w) => s + w.h, 0);
  const noLine = data.lines.filter((r) => hoursInMonth(r.get("id"), r.get("month")) > 0 && !(Number(r.get("overtime_line_hours")) > 0));
  if (noLine.length) hold("L07", noLine.map((r) => r.get("id")), noLine.length);

  // L08 pay dates
  let latePay = 0;
  let lateBy = 0;
  let moved = 0;
  for (const r of data.runs) {
    const nominal = num(r.get("period_end")) + R.payDays;
    let limit = nominal;
    while (free(limit)) limit += 1;
    const paid = num(r.get("pay_date"));
    if (paid > limit) {
      latePay += 1;
      lateBy = paid - limit;
    } else if (paid > nominal) moved += 1;
  }
  if (latePay) hold("L08", [], lateBy);
  if (moved) nearMisses.set("D4", []);

  // L09 leave
  const owed = ids.filter((id) => plusMonths(staff.get(id).start, R.leaveMonths) <= visit);
  const days = new Map(data.leave.map((r) => [r.get("id"), Number(r.get("days"))]));
  const noLeave = owed.filter((id) => !days.has(id));
  const shortLeave = owed.filter((id) => days.has(id) && days.get(id) < R.leaveMin);
  if (noLeave.length + shortLeave.length) hold("L09", [...noLeave, ...shortLeave], noLeave.length + shortLeave.length);
  const exactLeave = owed.filter((id) => days.get(id) === R.leaveMin);
  if (exactLeave.length) nearMisses.set("D3", exactLeave);
  const notYet = ids.filter((id) => !owed.includes(id) && !days.has(id));
  if (notYet.length) nearMisses.set("D6", notYet);

  // L10 safety statement
  const statement = slurp("folder/safety_statement_2019.md");
  const named = new Set(statement.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim()));
  const roles = new Set([...staff.values()].map((s) => s.role));
  const absent = [...roles].filter((r) => !named.has(r));
  if (roles.size !== R.titlesOnCheckDate) throw new Error(`recount: ${roles.size} titles, the L10 sentence says ${R.titlesOnCheckDate}`);
  if (absent.length) hold("L10", [], absent.length);

  // L11 opinion dated after the last change
  const opinionYear = Number((statement.match(/Opinion of the employee representative:.*?(\d{4})-\d{2}-\d{2}/) ?? [])[1]);
  const opinionTooOld = !(opinionYear > R.changeYear);

  // L12 exams
  const stale = [];
  const soon = [];
  for (const r of data.exams) {
    const until = plusMonths(r.get("last_exam_date"), R.examMonths);
    if (until < visit) stale.push({ id: r.get("id"), past: visit - until });
    else if (until - visit <= EXAM_SOON_DAYS) soon.push(r.get("id"));
  }
  if (stale.length) hold("L12", stale.map((x) => x.id), stale[0].past);
  if (soon.length) nearMisses.set("D5", soon);

  // L13 training: new hires have proof on or before the hire date
  const cutoff = plusMonths(VISIT, -NEW_HIRE_MONTHS);
  const hires = ids.filter((id) => num(staff.get(id).start) > cutoff);
  const proof = new Map(data.training.map((r) => [r.get("id"), r]));
  const missingProof = hires.filter((id) => !proof.has(id));
  const lateProof = data.training.filter((r) => r.get("training_date") > r.get("hire_date")).map((r) => r.get("id"));
  const goodProof = data.training.filter((r) => r.get("training_date") <= r.get("hire_date")).map((r) => r.get("id"));
  if (goodProof.length) nearMisses.set("D7", goodProof);

  // statuses
  const statuses = {};
  const gapLines = new Set(["L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L12"].filter((l) => hits.has(l)));
  if (missingProof.length || lateProof.length) gapLines.add("L13");
  for (let n = 1; n <= 13; n += 1) {
    const id = `L${String(n).padStart(2, "0")}`;
    statuses[id] = gapLines.has(id) ? "GAP" : id === "L11" && opinionTooOld ? "WEAK" : "COVERED";
  }
  const tally = { covered: 0, weak: 0, gap: 0 };
  for (const s of Object.values(statuses)) tally[s === "COVERED" ? "covered" : s === "WEAK" ? "weak" : "gap"] += 1;

  // wrong answers
  const flaggedLines = [...hits.keys()];
  const extraOvertime = [...weeks.keys()].filter((id) => !above.includes(id)).length;
  const extraLeave = exactLeave.length;
  const over = flaggedLines.length + extraOvertime + extraLeave;
  const under = flaggedLines.filter((l) => l !== "L08").length;

  // people in a finding (not the whole-firm ones: no person list)
  const people = new Set([...hits.entries()].filter(([, who]) => who.length > 0).flatMap(([, who]) => who));

  // the clock
  let between = 0;
  for (let n = num(NOTICE) + 1; n < visit; n += 1) if (!free(n)) between += 1;

  return {
    rowsRead,
    perFile,
    statuses,
    tally,
    findingCount: hits.size,
    findingPeople: Object.fromEntries([...hits.entries()].sort().map(([l, who]) => [l, who])),
    findingNumbers: count,
    nearMissPeople: Object.fromEntries([...nearMisses.entries()].sort().map(([d, who]) => [d, [...new Set(who)].sort()])),
    nearMissCount: nearMisses.size,
    over,
    under,
    overtimeHours: Object.fromEntries([...weeks.keys()].sort().map((id) => [id, total(id)])),
    peopleInFindings: people.size,
    calendarDays: visit - num(NOTICE),
    workingDaysBetween: between,
    papersDue: iso(visit + 3),
  };
}

/** Differences between a recount and expected.json; an empty list means they agree. */
export function compareWithExpected(rc, expected) {
  const diffs = [];
  const canon = (value) => JSON.stringify(value, (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v));
  const eq = (name, a, b) => {
    if (canon(a) !== canon(b)) diffs.push(`${name}: recount ${canon(a)}, expected.json ${canon(b)}`);
  };
  eq("rowsRead", rc.rowsRead, expected.rowsRead);
  eq("rowsByFile", rc.perFile, expected.rowsByFile);
  eq("statuses", rc.statuses, Object.fromEntries(expected.lines.map((l) => [l.id, l.status])));
  eq("tally", rc.tally, expected.tally);
  eq("findingCount", rc.findingCount, expected.findings.filter((f) => /^F\d+$/.test(f.id)).length);
  eq(
    "findingPeople",
    rc.findingPeople,
    Object.fromEntries(expected.findings.filter((f) => /^F\d+$/.test(f.id)).sort((a, b) => (a.line < b.line ? -1 : 1)).map((f) => [f.line, [...f.people].sort()])),
  );
  eq(
    "findingNumbers",
    rc.findingNumbers,
    Object.fromEntries(expected.findings.map((f) => [f.line, f.number])),
  );
  eq("nearMissCount", rc.nearMissCount, expected.decoys.length);
  eq("nearMissPeople", rc.nearMissPeople, Object.fromEntries([...expected.decoys].sort((a, b) => (a.id < b.id ? -1 : 1)).map((d) => [d.id, [...d.people].sort()])));
  eq("wrong over", rc.over, expected.wrong.over);
  eq("wrong under", rc.under, expected.wrong.under);
  eq("overtimeHours", rc.overtimeHours, Object.fromEntries(Object.entries(expected.overtime).map(([id, o]) => [id, o.hours])));
  eq("peopleInFindings", rc.peopleInFindings, expected.peopleInFindings);
  eq("calendarDays", rc.calendarDays, expected.days.calendar);
  eq("workingDaysBetween", rc.workingDaysBetween, expected.days.workingBetween);
  eq("papersDue", rc.papersDue, expected.days.papersDue);
  return diffs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rc = recount();
  const diffs = compareWithExpected(rc, JSON.parse(readFileSync(EXPECTED, "utf8")));
  console.log(`recount: rows read ${rc.rowsRead}, findings ${rc.findingCount}, checked ${rc.nearMissCount}, tally ${rc.tally.covered}/${rc.tally.weak}/${rc.tally.gap}, wrong ${rc.over} and ${rc.under}`);
  if (diffs.length) {
    console.error(`recount: ${diffs.length} difference(s) from expected.json:\n  ${diffs.join("\n  ")}`);
    process.exit(1);
  }
  console.log("recount: equals expected.json.");
}
