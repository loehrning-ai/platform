/**
 * Workshop 05, slide "clock": the pure functions of lib/w05-clock.js.
 * Working days are counted Mon to Fri, strictly between the two dates, with no holiday list; the verdict is one word.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const source = readFileSync(path.join(LIB, "w05-clock.js"), "utf8");

/** The script is a classic browser script with a module.exports branch; run it in a bare context like node:test would. */
function load() {
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { filename: "w05-clock.js" });
  return sandbox.module.exports;
}
const { workingDaysBetween, workingDaysList, verdict, weekday, dayNumber } = load();

test("working days between the notice (Mon 23 Nov) and the three visit buttons", () => {
  assert.equal(workingDaysBetween("2026-11-23", "2026-11-25"), 1);
  assert.equal(workingDaysBetween("2026-11-23", "2026-11-26"), 2);
  assert.equal(workingDaysBetween("2026-11-23", "2026-11-27"), 3);
});

test("the days between are Tuesday, Wednesday and Thursday for the 27th", () => {
  assert.deepEqual(Array.from(workingDaysList("2026-11-23", "2026-11-27")), ["2026-11-24", "2026-11-25", "2026-11-26"]);
  assert.deepEqual(Array.from(workingDaysList("2026-11-23", "2026-11-25")), ["2026-11-24"]);
});

test("the notice day and the visit day themselves are never counted", () => {
  assert.equal(workingDaysBetween("2026-11-23", "2026-11-24"), 0);
  assert.equal(workingDaysBetween("2026-11-23", "2026-11-23"), 0);
});

test("weekend days are skipped", () => {
  assert.equal(weekday(dayNumber("2026-11-21")), 6);
  assert.equal(weekday(dayNumber("2026-11-22")), 0);
  assert.equal(workingDaysBetween("2026-11-20", "2026-11-23"), 0, "Fri to Mon: only Sat and Sun lie between");
  assert.equal(workingDaysBetween("2026-11-20", "2026-11-24"), 1, "Fri to Tue: Mon counts, Sat and Sun do not");
  assert.equal(workingDaysBetween("2026-11-20", "2026-11-30"), 5);
});

test("no holiday list is consulted: 25 December 2026 counts as a working day", () => {
  assert.equal(workingDaysBetween("2026-12-24", "2026-12-28"), 1);
  assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ""), /holiday|feiertag|праз/i, "no holiday table in the code");
});

test("bad input and reversed dates give zero, not an exception", () => {
  assert.equal(workingDaysBetween("", "2026-11-27"), 0);
  assert.equal(workingDaysBetween("2026-11-27", "2026-11-23"), 0);
  assert.equal(workingDaysBetween("soon", "later"), 0);
});

test("verdict is short below 2, unclear at 2, fits from 3", () => {
  assert.equal(verdict(0), "short");
  assert.equal(verdict(1), "short");
  assert.equal(verdict(2), "unclear");
  assert.equal(verdict(3), "fits");
  assert.equal(verdict(7), "fits");
});

test("the three buttons give the three verdicts the slide shows", () => {
  const words = ["2026-11-25", "2026-11-26", "2026-11-27"].map((visit) => verdict(workingDaysBetween("2026-11-23", visit)));
  assert.deepEqual(words, ["short", "unclear", "fits"]);
});
