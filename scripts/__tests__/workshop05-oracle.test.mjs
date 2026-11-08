/**
 * Workshop 05: the oracle, the independent recount, the generator and the numbers of the kit design.
 * oracle.mjs on the generated files equals expected.json; recount.mjs agrees; generate.mjs --check
 * passes; the per-line statuses equal the twin-pair table; the computed numbers are the ones the deck prints.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { analyse, counter, whatIf } from "../workshop05/oracle/oracle.mjs";
import { loadKitFiles } from "../workshop05/oracle/load.mjs";
import { checkAll, isWorkingDay } from "../workshop05/oracle/generate.mjs";
import { compareWithExpected, recount } from "../workshop05/oracle/recount.mjs";
import { expectedText } from "../workshop05/oracle/write-expected.mjs";
import { EXPECTED_STATUS } from "../workshop05/oracle/plan.mjs";

const ORACLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../workshop05/oracle");
const expected = JSON.parse(readFileSync(path.join(ORACLE, "expected.json"), "utf8"));
const files = loadKitFiles();
const result = analyse(files);

test("generate.mjs --check: the files on disk equal the generator output (seed 2611)", () => {
  const { count, differing } = checkAll();
  assert.equal(differing.length, 0, `differing: ${differing.join(", ")}`);
  assert.equal(count, 30);
});

test("expected.json is the committed output of the oracle", () => {
  assert.equal(readFileSync(path.join(ORACLE, "expected.json"), "utf8"), expectedText());
});

test("the computed numbers of the deck", () => {
  assert.equal(result.rowsRead, 693);
  assert.equal(result.findings.length, 10);
  assert.equal(result.decoys.length, 8);
  assert.equal(result.lines.length, 13);
  assert.deepEqual(result.tally, { covered: 2, weak: 1, gap: 10 });
  assert.equal(result.overtime["E-07"].hours, 153);
  assert.equal(result.overtime["E-08"].hours, 119);
  assert.equal(result.wrong.over, 12);
  assert.equal(result.wrong.under, 9);
  assert.equal(result.peopleInFindings, 15);
  assert.equal(result.days.calendar, 4);
  assert.equal(result.days.workingBetween, 3);
  assert.equal(result.days.papersDue, "2026-11-30");
  assert.equal(result.matrix.lines, 13);
  assert.equal(result.matrix.people, 24);
  assert.equal(result.rowsByFile["attendance_2026-11.csv"], 432);
  assert.equal(result.warnings.length, 0);
});

test("the status per line equals the twin-pair table", () => {
  for (const line of result.lines) assert.equal(line.status, EXPECTED_STATUS[line.id], line.id);
  assert.deepEqual(
    expected.lines.map((line) => line.id),
    ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13"],
  );
});

test("each finding and near miss sits on the line and with the people of the design", () => {
  const where = Object.fromEntries(result.findings.map((f) => [f.id, [f.line, f.people.join(" ")]]));
  assert.deepEqual(where, {
    F1: ["L02", "E-05"],
    F2: ["L06", "E-07 E-08"],
    F3: ["L05", "E-07"],
    F4: ["L07", "E-07 E-08"],
    F5: ["L04", "E-12 E-13"],
    F6: ["L08", ""],
    F7: ["L09", "E-11 E-14 E-19"],
    F8: ["L03", "E-04 E-15 E-21"],
    F9: ["L12", "E-02 E-06 E-10 E-16"],
    F10: ["L10", ""],
  });
  const near = Object.fromEntries(result.decoys.map((d) => [d.id, [d.line, d.people.join(" ")]]));
  assert.deepEqual(near, {
    D1: ["L02", "E-22"],
    D2: ["L05", "E-08"],
    D3: ["L09", "E-09"],
    D4: ["L08", ""],
    D5: ["L12", "E-03"],
    D6: ["L09", "E-22"],
    D7: ["L13", "E-05 E-19 E-22"],
    D8: ["L04", "E-07"],
  });
  const numbers = Object.fromEntries(result.findings.map((f) => [f.id, f.number]));
  assert.deepEqual(numbers, { F1: 4, F2: 17, F3: 153, F4: 8, F5: 20, F6: 4, F7: 3, F8: 7, F9: 76, F10: 2 });
});

test("the matrix holds only the codes 0, 1 and 2", () => {
  const { cells } = result.matrix;
  assert.equal(cells.length, 13);
  for (const row of cells) {
    assert.equal(row.length, 24);
    for (const code of row) assert.ok([0, 1, 2].includes(code));
  }
  assert.equal(result.matrix.clusters.filter((c) => c.kind === "finding").length, 10);
  assert.equal(result.matrix.clusters.filter((c) => c.kind === "near-miss").length, 8);
});

test("recount.mjs (an independent second implementation) equals expected.json", () => {
  assert.deepEqual(compareWithExpected(recount(), expected), []);
});

test("the three what-if buttons give the counters 10, 11, 10, 11", () => {
  assert.equal(counter(result), 10);
  const counters = ["e08-nine-hours", "ticks-filled", "no-free-day-move"].map((kind) => {
    const { files: changed, options } = whatIf(files, kind);
    return counter(analyse(changed, options));
  });
  assert.deepEqual(counters, [11, 10, 11]);
});

test("the oracle is pure: the same text gives the same result", () => {
  assert.deepEqual(analyse({ ...files }), result);
});

test("no date of a folder file falls on a weekend or a public holiday (a slip dated on a Sunday breaks the case)", () => {
  const day = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
  const bad = [];
  for (const [name, text] of Object.entries(files)) {
    if (!name.endsWith(".csv")) continue;
    const rows = text.split("\n").filter((line) => line && !line.startsWith("#")).slice(1);
    for (const row of rows) {
      // payroll_runs.csv: the first column is the last day of a pay period; overtime_weekly.csv: the second names the week
      // by its Monday. Both are calendar labels and not events (a week may start on a holiday Monday).
      const all = row.split(",");
      const cells = name === "payroll_runs_2026.csv" ? all.slice(1) : name === "overtime_weekly_2026.csv" ? [all[0], all[2]] : all;
      for (const cell of cells) if (/^\d{4}-\d{2}-\d{2}$/.test(cell) && !isWorkingDay(day(cell))) bad.push(`${name}: ${cell}`);
    }
  }
  assert.deepEqual(bad, []);
});
