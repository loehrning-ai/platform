/**
 * The TypeScript oracle against the committed output of the .mjs oracle (expected.json): every number
 * the demo shows is computed here from the kit, and these tests hold the port to the script that the
 * deck and the kit are built with.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyse, analyseKit, counter, daysBetween, kitFolderFiles, whatIf, WHAT_IFS, type OracleResult } from "./oracle";

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
    const { seed: _seed, ...rest } = EXPECTED;
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
});
