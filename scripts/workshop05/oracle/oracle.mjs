/**
 * The oracle of Workshop 05: one pure function, analyse(files), that reads the text of the kit files of
 * the invented firm Gradba-Pro and returns what a careful check finds. No file access, no clock, no
 * randomness: the same text gives the same result, here and in the demo's TypeScript port.
 *
 * Input: an object {file name: text} with the names
 *   contracts_register_2026.csv, registration_M1M2_2026.csv, employee_records_2026.csv,
 *   attendance_2026-11.csv, overtime_weekly_2026.csv, payroll_runs_2026.csv,
 *   payroll_lines_2026-07_to_10.csv, leave_decisions_2026.csv, absences_2026.csv, medical_exams.csv,
 *   training_proofs_2026.csv, overtime_notices_folder.txt, safety_statement_2019.md, folder-index.md.
 * Lines that start with # in a CSV are comments and are skipped.
 *
 * Output: {checkDate, rowsRead, rowsByFile, lines, tally, findings, decoys, warnings, wrong,
 *          peopleInFindings, overtime, days, matrix}
 * statusOf(tests, broken): a part that fails QUOTE or SCOPE, or a record that shows the rule broken,
 * gives GAP; a failed PERIOD or APPROVAL gives WEAK; otherwise COVERED. The weakest part counts.
 */

export const CHECK_DATE = "2026-11-27";
export const NOTICE_DATE = "2026-11-23";

// Thresholds of the checklist rule sentences (recount.mjs reads the same numbers from the sentences).
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
};

/** The files whose data rows are counted as "rows read" (the 11 CSV files of the folder). */
export const COUNTED = ["contracts", "registration", "records", "attendance", "overtime", "runs", "payLines", "leave", "absences", "exams", "training"];

export const LINE_IDS = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13"];
const LINE_LABELS = {
  L01: "Contract",
  L02: "Registration",
  L03: "Records",
  L04: "Attendance",
  L05: "Overtime cap",
  L06: "Overtime notice",
  L07: "Overtime pay line",
  L08: "Pay date",
  L09: "Leave",
  L10: "Safety statement",
  L11: "Employee opinion",
  L12: "Medical exams",
  L13: "Training",
};
/** Finding id by checklist line. */
const FINDING_OF_LINE = { L02: "F1", L06: "F2", L05: "F3", L07: "F4", L04: "F5", L08: "F6", L09: "F7", L03: "F8", L12: "F9", L10: "F10" };
const DECOY_LINE = { D1: "L02", D2: "L05", D3: "L09", D4: "L08", D5: "L12", D6: "L09", D7: "L13", D8: "L04" };
/** A finding that concerns the whole firm, not one person: drawn as a band over the column. */
const WHOLE_FIRM = new Set(["F6", "F10"]);

// ---------------------------------------------------------------- dates (UTC day numbers)
const DAY = 86_400_000;
const toDay = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const fromDay = (n) => new Date(n * DAY).toISOString().slice(0, 10);
const weekday = (n) => (n + 4) % 7; // 0 Sunday ... 6 Saturday
const isFreeDay = (n) => weekday(n) === 0 || weekday(n) === 6;
const nextWorkingDay = (n) => {
  let d = n;
  while (isFreeDay(d)) d += 1;
  return d;
};
function addMonths(iso, months) {
  const [y, m, d] = iso.split("-").map(Number);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- parsing
function table(text) {
  if (typeof text !== "string") throw new Error("oracle: a kit file is missing");
  const rows = text
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));
  const header = rows[0].split(",");
  return rows.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]));
  });
}

const uniq = (list) => [...new Set(list)];
const sortIds = (ids) => [...ids].sort();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function statusOf(tests, broken = false) {
  if (broken || !tests.quote || !tests.scope) return "GAP";
  if (!tests.period || !tests.approval) return "WEAK";
  return "COVERED";
}

/**
 * Analyse the kit files.
 * options.freeDayMove: false reads the pay rule without the free-day move (a what-if of the deck).
 */
export function analyse(files, options = {}) {
  const freeDayMove = options.freeDayMove !== false;
  const get = (key) => files[FILE_NAMES[key]];
  const T = Object.fromEntries(COUNTED.map((key) => [key, table(get(key))]));
  const rowsByFile = Object.fromEntries(COUNTED.map((key) => [FILE_NAMES[key], T[key].length]));
  const rowsRead = Object.values(rowsByFile).reduce((a, b) => a + b, 0);
  const check = toDay(CHECK_DATE);

  const people = T.contracts.map((r) => r.id);
  const start = Object.fromEntries(T.contracts.map((r) => [r.id, r.start_date]));
  const roleOf = Object.fromEntries(T.contracts.map((r) => [r.id, r.role]));
  const attendanceApplies = people.length <= ATTENDANCE_MAX_STAFF;

  const findings = [];
  const decoys = [];
  const warnings = [];
  const tests = Object.fromEntries(LINE_IDS.map((id) => [id, { quote: true, period: true, scope: true, approval: true }]));
  const broken = Object.fromEntries(LINE_IDS.map((id) => [id, false]));
  const add = (finding) => findings.push(finding);

  // ---- L01 contracts (D9, not counted)
  const noCopy = T.contracts.filter((r) => r.copy_handed_over !== "yes").map((r) => r.id);
  tests.L01.scope = people.every((id) => T.records.some((r) => r.id === id));
  tests.L01.approval = noCopy.length === 0;
  broken.L01 = noCopy.length > 0;

  // ---- L02 registration: due the day before the start (F1), close calls that are in time (D1)
  const newHireFrom = toDay(addMonths(CHECK_DATE, -NEW_HIRE_MONTHS));
  const newHires = people.filter((id) => toDay(start[id]) > newHireFrom);
  const late = [];
  const closeCalls = [];
  for (const row of T.registration) {
    const due = toDay(start[row.id]) - REGISTRATION_LEAD_DAYS;
    const filed = toDay(row.date_filed);
    if (filed > due) late.push({ id: row.id, filed: row.date_filed, due: fromDay(due), start: start[row.id], daysAfterDue: filed - due, daysAfterStart: filed - toDay(start[row.id]) });
    else if (toDay(start[row.id]) - filed <= REGISTRATION_CLOSE_CALL_DAYS) closeCalls.push(row.id);
  }
  tests.L02.scope = people.every((id) => T.registration.some((r) => r.id === id));
  tests.L02.period = late.length === 0;
  broken.L02 = late.length > 0;
  if (late.length > 0) {
    const f = late[0];
    add({
      id: "F1",
      line: "L02",
      people: late.map((x) => x.id),
      number: Math.max(...late.map((x) => x.daysAfterDue)),
      unit: "days after the due date",
      facts: { late },
      text: `${f.id} filed ${f.filed}, due ${f.due}: filed ${f.daysAfterDue} days after the due date and ${f.daysAfterStart} days after the first shift (start ${f.start}).`,
    });
  }
  if (closeCalls.length > 0) decoys.push({ id: "D1", line: "L02", people: closeCalls, reason: "filed in time, before the day before the start" });

  // ---- L03 employee records: empty cells (F8)
  const recordColumns = Object.keys(T.records[0]).filter((name) => /^f\d\d$/.test(name));
  const emptyByPerson = {};
  for (const r of T.records) {
    const empty = recordColumns.filter((c) => r[c] === "");
    if (empty.length > 0) emptyByPerson[r.id] = empty;
  }
  const incomplete = Object.keys(emptyByPerson);
  const emptyCells = incomplete.reduce((n, id) => n + emptyByPerson[id].length, 0);
  tests.L03.scope = incomplete.length === 0 && T.records.length === people.length;
  if (incomplete.length > 0) {
    add({
      id: "F8",
      line: "L03",
      people: incomplete,
      number: emptyCells,
      unit: "empty cells",
      facts: { fields: recordColumns.length, emptyByPerson },
      text: `${plural(incomplete.length, "incomplete record", "incomplete records")}, ${plural(emptyCells, "empty cell", "empty cells")} (${incomplete.map((id) => `${id} ${emptyByPerson[id].length}`).join(", ")}).`,
    });
  }

  // ---- L04 attendance: rows without start and end (F5), absence code backed by the absences file (D8)
  const absenceRows = T.absences;
  const absent = (id, date) => absenceRows.some((a) => a.id === id && a.from <= date && date <= a.to);
  const timeless = [];
  const absenceCleared = [];
  for (const r of T.attendance) {
    if (r.start !== "" && r.end !== "") continue;
    if (r.code !== "" && absent(r.id, r.date)) absenceCleared.push(r);
    else timeless.push(r);
  }
  const attendanceDays = uniq(T.attendance.map((r) => r.date));
  tests.L04.quote = !attendanceApplies || timeless.length === 0;
  tests.L04.scope = people.every((id) => T.attendance.some((r) => r.id === id));
  broken.L04 = false;
  if (attendanceApplies && timeless.length > 0) {
    const ids = uniq(timeless.map((r) => r.id));
    const dates = timeless.map((r) => r.date).sort();
    add({
      id: "F5",
      line: "L04",
      people: ids,
      number: timeless.length,
      unit: "person-days",
      facts: { from: dates[0], to: dates[dates.length - 1], perPerson: Object.fromEntries(ids.map((id) => [id, timeless.filter((r) => r.id === id).length])), workingDays: attendanceDays.length },
      text: `${ids.join(" and ")}: ${timeless.length} person-days with a tick and no start or end (${dates[0]} to ${dates[dates.length - 1]}).`,
    });
  }
  if (absenceCleared.length > 0) decoys.push({ id: "D8", line: "L04", people: uniq(absenceCleared.map((r) => r.id)), reason: "absence code present, matches absences_2026.csv", rows: absenceCleared.length });
  // Amber warning: one person with many rows that carry the very same start and end (the others vary).
  const sameTimes = [];
  for (const id of people) {
    const groups = new Map();
    for (const r of T.attendance) if (r.id === id && r.start !== "" && r.end !== "") groups.set(`${r.start} to ${r.end}`, (groups.get(`${r.start} to ${r.end}`) ?? 0) + 1);
    const [times, rows] = [...groups.entries()].sort((x, y) => y[1] - x[1])[0] ?? ["", 0];
    if (rows >= SAME_TIMES_MIN_ROWS) sameTimes.push({ id, rows, times });
  }
  if (sameTimes.length > 0) {
    const total = sameTimes.reduce((n, x) => n + x.rows, 0);
    warnings.push({ id: "W1", line: "L04", people: sameTimes.map((x) => x.id), number: total, unit: "rows with identical times", text: `${sameTimes.map((x) => x.id).join(" and ")}: ${total} rows with the same times ${sameTimes[0].times}.` });
  }
  tests.L04.approval = sameTimes.length === 0;
  const sameTimesPeople = sameTimes.map((x) => x.id);

  // ---- L05 overtime cap (F3, per person), D2
  const hoursOf = {};
  for (const r of T.overtime) (hoursOf[r.id] ??= []).push({ week: r.week_start, hours: Number(r.overtime_hours) });
  const overtime = {};
  const overFindings = [];
  const nearCap = [];
  for (const id of Object.keys(hoursOf).sort()) {
    const weeks = hoursOf[id];
    const total = weeks.reduce((n, w) => n + w.hours, 0);
    const above = weeks.filter((w) => w.hours > OVERTIME_CAP);
    overtime[id] = { weeks: weeks.length, weeksAboveCap: above.length, hours: total, perWeek: uniq(weeks.map((w) => w.hours)) };
    if (above.length > 0) overFindings.push(id);
    else if (weeks.every((w) => w.hours >= OVERTIME_CAP - 1)) nearCap.push(id);
  }
  broken.L05 = overFindings.length > 0;
  tests.L05.period = overFindings.length === 0;
  overFindings.forEach((id, i) => {
    const o = overtime[id];
    add({
      id: i === 0 ? "F3" : `F3${String.fromCharCode(97 + i)}`,
      line: "L05",
      people: [id],
      number: o.hours,
      unit: "hours",
      facts: { ...o, cap: OVERTIME_CAP },
      text: `${id}: ${o.perWeek.join(" and ")} h in ${o.weeksAboveCap} of ${o.weeks} weeks, ${o.hours} h in total, above ${OVERTIME_CAP} h every week.`,
    });
  });
  if (nearCap.length > 0) decoys.push({ id: "D2", line: "L05", people: nearCap, reason: `${nearCap.map((id) => overtime[id].perWeek.join("/")).join(", ")} h a week, below ${OVERTIME_CAP} h` });

  // ---- L06 overtime notices: signed, naming the person, dated before the week (F2)
  const notices = get("notices")
    .split("\n")
    .map((line) => line.match(/^(\d{4}-\d{2}-\d{2}) \| ([^|]*) \| ([^|]*) \| Signed by:(.*)$/))
    .filter(Boolean)
    .map((m) => ({ date: m[1], ids: m[2].match(/E-\d\d/g) ?? [], signedBy: m[4].trim() }));
  const noticeValid = (id, week) => notices.some((n) => n.signedBy !== "" && n.ids.includes(id) && n.date <= week);
  const noNotice = {};
  for (const id of Object.keys(hoursOf)) noNotice[id] = hoursOf[id].filter((w) => w.hours > 0 && !noticeValid(id, w.week)).length;
  const noticePeople = Object.keys(noNotice).filter((id) => noNotice[id] > 0).sort();
  const unsignedNotices = notices.filter((n) => n.signedBy === "");
  tests.L06.quote = noticePeople.length === 0;
  tests.L06.period = notices.some((n) => n.date >= "2026-01-01");
  tests.L06.approval = unsignedNotices.length === 0;
  broken.L06 = false;
  if (noticePeople.length > 0) {
    const weeks = Math.max(...noticePeople.map((id) => noNotice[id]));
    add({
      id: "F2",
      line: "L06",
      people: noticePeople,
      number: weeks,
      unit: "weeks without a notice",
      facts: { weeksPerPerson: Object.fromEntries(noticePeople.map((id) => [id, noNotice[id]])), notices2026: notices.filter((n) => n.date >= "2026-01-01").length, noticesInFolder: notices.length, unsigned: unsignedNotices.length },
      text: `${noticePeople.join(" and ")}: ${weeks} weeks, ${notices.filter((n) => n.date >= "2026-01-01").length} notices for 2026 (the one notice in the folder is from ${unsignedNotices[0]?.date.slice(0, 4) ?? "an earlier year"} and its "Signed by" field is blank).`,
    });
  }

  // ---- L07 pay lines: overtime worked in the month, no overtime line (F4)
  const overtimeInMonth = (id, month) => (hoursOf[id] ?? []).filter((w) => w.week.startsWith(month)).reduce((n, w) => n + w.hours, 0);
  const missingLines = T.payLines.filter((r) => overtimeInMonth(r.id, r.month) > 0 && (r.overtime_line_hours === "" || Number(r.overtime_line_hours) === 0));
  tests.L07.scope = missingLines.length === 0;
  if (missingLines.length > 0) {
    const ids = uniq(missingLines.map((r) => r.id));
    add({
      id: "F4",
      line: "L07",
      people: ids,
      number: missingLines.length,
      unit: "pay lines",
      facts: { months: uniq(missingLines.map((r) => r.month)).length },
      text: `${ids.join(" and ")}: ${plural(missingLines.length, "line", "lines")} (${uniq(missingLines.map((r) => r.month)).length} months each) with overtime worked and no overtime line.`,
    });
  }

  // ---- L08 pay date: at most 15 days after the period, a free day moves it (F6 per run), D4
  const lateRuns = [];
  const movedRuns = [];
  for (const r of T.runs) {
    const raw = toDay(r.period_end) + PAY_DAYS;
    const limit = freeDayMove ? nextWorkingDay(raw) : raw;
    const paid = toDay(r.pay_date);
    if (paid > limit) lateRuns.push({ periodEnd: r.period_end, paid: r.pay_date, limit: fromDay(limit), daysLate: paid - limit });
    else if (freeDayMove && paid > raw) movedRuns.push({ periodEnd: r.period_end, paid: r.pay_date, rawLimit: fromDay(raw), limit: fromDay(limit) });
  }
  broken.L08 = lateRuns.length > 0;
  lateRuns.forEach((run, i) => {
    add({
      id: i === 0 ? "F6" : `F6${String.fromCharCode(97 + i)}`,
      line: "L08",
      people: [],
      number: run.daysLate,
      unit: "days late",
      facts: run,
      text: `Period ending ${run.periodEnd}: paid ${run.paid}, limit ${run.limit}, ${run.daysLate} days late.`,
    });
  });
  if (movedRuns.length > 0) decoys.push({ id: "D4", line: "L08", people: [], reason: "day 15 is a free day, so the limit moves to the next working day", facts: movedRuns });

  // ---- L09 leave: owed after 6 months, at least 20 days (F7), D3, D6
  const owedFrom = (id) => toDay(addMonths(start[id], LEAVE_AFTER_MONTHS)) <= check;
  const owed = people.filter(owedFrom);
  const decision = Object.fromEntries(T.leave.map((r) => [r.id, Number(r.days)]));
  const leaveMissing = owed.filter((id) => decision[id] === undefined);
  const leaveBelow = owed.filter((id) => decision[id] !== undefined && decision[id] < LEAVE_MIN);
  const leaveExact = owed.filter((id) => decision[id] === LEAVE_MIN);
  const notOwedNoDecision = people.filter((id) => !owedFrom(id) && decision[id] === undefined);
  tests.L09.scope = leaveMissing.length === 0 && leaveBelow.length === 0;
  broken.L09 = leaveBelow.length > 0;
  if (leaveMissing.length + leaveBelow.length > 0) {
    const ids = sortIds([...leaveMissing, ...leaveBelow]);
    const reach = T.leave.filter((r) => Number(r.days) >= LEAVE_MIN).length;
    add({
      id: "F7",
      line: "L09",
      people: ids,
      number: ids.length,
      unit: "people",
      facts: { owed: owed.length, decisions: T.leave.length, missing: leaveMissing, below: leaveBelow.map((id) => ({ id, days: decision[id] })), reachMinimum: reach },
      text: `${owed.length} owed on the check date, ${T.leave.length} decisions: ${leaveMissing.join(" and ")} missing, ${leaveBelow.map((id) => `${id} has ${decision[id]} days`).join(", ")}. ${reach} of the ${T.leave.length} decisions reach ${LEAVE_MIN} days.`,
    });
  }
  if (leaveExact.length > 0) decoys.push({ id: "D3", line: "L09", people: leaveExact, reason: `exactly ${LEAVE_MIN} days meets the minimum` });
  if (notOwedNoDecision.length > 0) {
    const first = notOwedNoDecision[0];
    decoys.push({ id: "D6", line: "L09", people: notOwedNoDecision, reason: `the full right arises after ${LEAVE_AFTER_MONTHS} months, on ${addMonths(start[first], LEAVE_AFTER_MONTHS)}` });
  }

  // ---- L10 safety statement names every job position in the register (F10)
  const statement = get("statement");
  const listed = (statement.match(/^- (.+)$/gm) ?? []).map((l) => l.slice(2).trim());
  const titles = uniq(T.contracts.map((r) => r.role));
  const missingTitles = titles.filter((t) => !listed.includes(t));
  tests.L10.scope = missingTitles.length === 0;
  if (missingTitles.length > 0) {
    add({
      id: "F10",
      line: "L10",
      people: [],
      number: missingTitles.length,
      unit: "positions missing",
      facts: { titles: titles.length, listed: listed.length, missing: missingTitles, statementDate: (statement.match(/^Dated: (\d{4}-\d{2}-\d{2})/m) ?? [])[1] },
      text: `${titles.length} titles in the register, the statement lists ${listed.length}: ${missingTitles.join(" and ")} missing.`,
    });
  }

  // ---- L11 opinion dated after the last change to the workplace (the year from folder-index.md)
  const changeYear = Number((get("index").match(/Last change to the workplace:[^\n]*?(\d{4})/) ?? [])[1]);
  const opinion = (statement.match(/^Opinion of the employee representative:[^\n]*?(\d{4})-(\d{2})-(\d{2})/m) ?? []).slice(1);
  tests.L11.quote = opinion.length === 3;
  tests.L11.period = opinion.length === 3 && Number(opinion[0]) > changeYear;

  // ---- L12 medical exams at most 24 months old (F9), D5
  const oldExams = [];
  const soon = [];
  for (const r of T.exams) {
    const valid = toDay(addMonths(r.last_exam_date, EXAM_MONTHS));
    if (valid < check) oldExams.push({ id: r.id, last: r.last_exam_date, daysPast: check - valid });
    else if (valid - check <= EXAM_SOON_DAYS) soon.push({ id: r.id, validUntil: fromDay(valid), daysLeft: valid - check });
  }
  tests.L12.scope = T.exams.length === people.length;
  broken.L12 = oldExams.length > 0;
  if (oldExams.length > 0) {
    add({
      id: "F9",
      line: "L12",
      people: oldExams.map((x) => x.id),
      number: oldExams[0].daysPast,
      unit: "days past 24 months",
      facts: { last: uniq(oldExams.map((x) => x.last)), daysPast: uniq(oldExams.map((x) => x.daysPast)) },
      text: `${oldExams.map((x) => x.id).join(", ")}: last exam ${oldExams[0].last}, ${oldExams[0].daysPast} days past ${EXAM_MONTHS} months on ${CHECK_DATE}.`,
    });
  }
  if (soon.length > 0) decoys.push({ id: "D5", line: "L12", people: soon.map((x) => x.id), reason: `valid until ${soon[0].validUntil}, within ${EXAM_MONTHS} months on ${CHECK_DATE}` });

  // ---- L13 training at hiring (D7); a proof later than the hire date would be a finding
  const proofs = Object.fromEntries(T.training.map((r) => [r.id, r]));
  const noProof = newHires.filter((id) => !proofs[id]);
  const lateProof = T.training.filter((r) => r.training_date > r.hire_date).map((r) => r.id);
  tests.L13.scope = noProof.length === 0;
  broken.L13 = lateProof.length > 0;
  const proofInTime = T.training.filter((r) => r.training_date <= r.hire_date).map((r) => r.id);
  if (proofInTime.length > 0) decoys.push({ id: "D7", line: "L13", people: proofInTime, reason: "training on or before the hire date" });

  // ---- order the lists
  const num = (id) => Number(id.slice(1).replace(/\D.*/, ""));
  findings.sort((a, b) => num(a.id) - num(b.id) || (a.id < b.id ? -1 : 1));
  decoys.sort((a, b) => a.id.localeCompare(b.id));

  // ---- lines and tally
  const lines = LINE_IDS.map((id) => {
    const status = statusOf(tests[id], broken[id]);
    return {
      id,
      label: LINE_LABELS[id],
      status,
      tests: { ...tests[id] },
      broken: broken[id],
      findings: findings.filter((f) => f.line === id).map((f) => f.id),
      decoys: decoys.filter((d) => d.line === id).map((d) => d.id),
    };
  });
  const tally = {
    covered: lines.filter((l) => l.status === "COVERED").length,
    weak: lines.filter((l) => l.status === "WEAK").length,
    gap: lines.filter((l) => l.status === "GAP").length,
  };

  // ---- wrong answers: over-flagging (a hit on every overtime week above 0 and every leave of 20 days or fewer)
  // and under-flagging (the late pay check forgotten).
  const overExtra = [];
  for (const id of Object.keys(hoursOf)) if (hoursOf[id].some((w) => w.hours > 0) && !overFindings.includes(id)) overExtra.push({ id, line: "L05" });
  for (const id of owed) if (decision[id] !== undefined && decision[id] === LEAVE_MIN && !leaveBelow.includes(id)) overExtra.push({ id, line: "L09" });
  const wrong = {
    over: findings.length + overExtra.length,
    overExtra,
    under: findings.filter((f) => f.line !== "L08").length,
    underMisses: "L08",
  };

  // ---- people that appear in a finding (whole-firm findings F6 and F10 excluded)
  const peopleInFindings = uniq(findings.filter((f) => !WHOLE_FIRM.has(f.id.replace(/[a-z]$/, ""))).flatMap((f) => f.people)).length;

  // ---- days from the notice to the visit
  const noticeDay = toDay(NOTICE_DATE);
  let workingBetween = 0;
  for (let d = noticeDay + 1; d < check; d += 1) if (!isFreeDay(d)) workingBetween += 1;
  const days = { notice: NOTICE_DATE, visit: CHECK_DATE, calendar: check - noticeDay, workingBetween, papersDue: fromDay(check + 3) };

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
  const clusters = [
    ...findings.map((f) => ({ kind: "finding", id: f.id, line: f.line, people: f.people, wholeFirm: f.people.length === 0 })),
    ...decoys.map((d) => ({ kind: "near-miss", id: d.id, line: d.line, people: d.people, wholeFirm: d.people.length === 0 })),
  ];
  const matrix = { lines: LINE_IDS.length, people: personIds.length, lineIds: [...LINE_IDS], personIds, titles: personIds.map((id) => roleOf[id]), cells, clusters };

  return { checkDate: CHECK_DATE, rowsRead, rowsByFile, lines, tally, findings, decoys, warnings, sameTimesPeople, wrong, peopleInFindings, overtime, days, matrix };
}

/** The mutated copies of the kit files behind the three what-if buttons of the deck (S16). */
export function whatIf(files, kind) {
  const next = { ...files };
  if (kind === "e08-nine-hours") {
    next[FILE_NAMES.overtime] = files[FILE_NAMES.overtime].replace(/^(E-08,[0-9-]+,)7$/gm, "$19");
    return { files: next, options: {} };
  }
  if (kind === "ticks-filled") {
    next[FILE_NAMES.attendance] = files[FILE_NAMES.attendance].replace(/^(E-1[23],[0-9-]+),,,x,$/gm, "$1,08:00,16:00,,");
    return { files: next, options: {} };
  }
  if (kind === "no-free-day-move") return { files: next, options: { freeDayMove: false } };
  throw new Error(`oracle: unknown what-if ${kind}`);
}

/** The counter of the deck: findings plus amber lines. */
export function counter(result) {
  return result.findings.length + result.warnings.length;
}
