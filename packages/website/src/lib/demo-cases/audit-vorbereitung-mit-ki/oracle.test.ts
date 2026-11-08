/**
 * The TypeScript oracle against the committed output of the .mjs oracle (expected.json): every number
 * the demo shows is computed here from the kit, and these tests hold the port to the script that the
 * deck and the kit are built with.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyse, analyseKit, buildRegister, counter, daysBetween, kitFolderFiles, REGISTER_DATES, REGISTER_TODAY, whatIf, WHAT_IFS, type OracleResult } from "./oracle";
import { registerDays } from "./register";

const EXPECTED = JSON.parse(readFileSync(join(__dirname, "../../../../../../scripts/workshop05/oracle/expected.json"), "utf8"));

/** The same projection as write-expected.mjs. */
function project(result: OracleResult) {
  return {
    checkDate: result.checkDate,
    rowsRead: result.rowsRead,
    rowsByFile: result.rowsByFile,
    lines: result.lines.map(({ id, status }) => ({ id, status })),
    tally: result.tally,
    findings: result.findings.map(({ id, line, people, number, unit }) => ({ id, line, people, number, unit })),
    decoys: result.decoys.map(({ id, line, people }) => ({ id, line, people })),
    warnings: result.warnings.length,
    wrong: result.wrong,
    peopleInFindings: result.peopleInFindings,
    overtime: result.overtime,
    days: result.days,
    matrix: { lines: result.matrix.lines, people: result.matrix.people, lineIds: result.matrix.lineIds, personIds: result.matrix.personIds, cells: result.matrix.cells },
  };
}

describe("W05 oracle port", () => {
  const result = analyseKit();

  it("reproduces expected.json from the kit files", () => {
    const { seed: _seed, register: _register, ...rest } = EXPECTED;
    expect(project(result)).toEqual(rest);
  });

  it("has the headline numbers of the case", () => {
    expect(result.rowsRead).toBe(693);
    expect(result.findings).toHaveLength(10);
    expect(result.decoys).toHaveLength(8);
    expect(result.tally).toEqual({ covered: 2, weak: 1, gap: 10 });
    expect(result.wrong).toEqual({ over: 12, under: 9 });
    expect(result.peopleInFindings).toBe(15);
    expect(result.matrix.cells).toHaveLength(13);
    for (const row of result.matrix.cells) expect(row).toHaveLength(24);
  });

  it("counts the days from the notice to the visit", () => {
    expect(daysBetween("2026-11-23", "2026-11-27")).toEqual({ calendar: 4, workingBetween: 3, papersDue: "2026-11-30" });
    expect(daysBetween("2026-11-23", "2026-11-26")).toMatchObject({ calendar: 3, workingBetween: 2 });
    expect(daysBetween("2026-11-23", "2026-11-25")).toMatchObject({ calendar: 2, workingBetween: 1 });
  });

  it("moves the counter of the three what-ifs as the deck says", () => {
    expect(counter(result)).toBe(10);
    const files = kitFolderFiles();
    const counters = Object.fromEntries(WHAT_IFS.map((kind) => {
      const run = whatIf(files, kind);
      return [kind, counter(analyse(run.files, run.options))];
    }));
    expect(counters).toEqual({ "e08-nine-hours": 11, "ticks-filled": 10, "no-free-day-move": 11 });
  });

  it("builds the register of expected.json for the exercise day", () => {
    const register = buildRegister(kitFolderFiles(), REGISTER_TODAY);
    const expected = EXPECTED.register;
    expect(register.today).toBe(expected.today);
    expect(register.rows).toHaveLength(expected.rows);
    expect(register.byPaper).toEqual(expected.byPaper);
    expect(register.expired).toEqual(expected.expired);
    expect(register.expiring).toEqual(expected.expiring);
    expect(register.missing).toEqual(expected.missing);
  });

  it("counts the register on the three dates of the demo as expected.json does", () => {
    expect([...REGISTER_DATES]).toEqual(Object.keys(EXPECTED.register.byDate));
    const days = registerDays();
    expect(days.map((day) => day.date)).toEqual([...REGISTER_DATES]);
    for (const day of days) {
      const expected = EXPECTED.register.byDate[day.date];
      expect({ rows: day.rows, expired: day.expired.length, expiring: day.expiring.length, missing: day.missing.length }, day.date).toEqual({
        rows: expected.rows,
        expired: expected.expired,
        expiring: expected.expiring,
        missing: expected.missing,
      });
      expect(day.expiring.map((entry) => entry.id), day.date).toEqual(expected.expiringIds);
    }
  });

  it("pins the register numbers of the case", () => {
    const [today, january, march] = registerDays();
    expect([today?.rows, today?.expired.length, today?.expiring.length, today?.missing.length]).toEqual([98, 4, 1, 4]);
    expect([january?.rows, january?.expired.length, january?.expiring.length, january?.missing.length]).toEqual([99, 5, 2, 5]);
    expect([march?.rows, march?.expired.length, march?.expiring.length, march?.missing.length]).toEqual([99, 5, 3, 5]);
    expect(today?.expired.map((entry) => entry.id)).toEqual(["E-02", "E-06", "E-10", "E-16"]);
    expect(today?.missing.map((entry) => `${entry.id} ${entry.paper}`)).toEqual(["E-11 leave-decision", "E-19 leave-decision", "E-07 overtime-notice", "E-08 overtime-notice"]);
  });

  it("lists ids only: no register entry carries a name", () => {
    for (const day of registerDays()) {
      for (const entry of [...day.expired, ...day.expiring, ...day.missing]) expect(entry.id).toMatch(/^E-\d\d$/);
    }
  });
});
