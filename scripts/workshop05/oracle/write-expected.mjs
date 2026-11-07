#!/usr/bin/env node
/**
 * Writes expected.json: the committed output of oracle.mjs on the generated kit files.
 *
 *   node scripts/workshop05/oracle/write-expected.mjs            writes expected.json
 *   node scripts/workshop05/oracle/write-expected.mjs --check    exits 1 when expected.json is stale
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyse } from "./oracle.mjs";
import { loadKitFiles } from "./load.mjs";
import { SEED } from "./plan.mjs";

const TARGET = path.join(path.dirname(fileURLToPath(import.meta.url)), "expected.json");

/** The schema of expected.json: what the demo port and the tests compare against. */
export function expectedFrom(result) {
  return {
    seed: SEED,
    checkDate: result.checkDate,
    rowsRead: result.rowsRead,
    rowsByFile: result.rowsByFile,
    lines: result.lines.map(({ id, status }) => ({ id, status })),
    tally: result.tally,
    findings: result.findings.map(({ id, line, people, number, unit }) => ({ id, line, people, number, unit })),
    decoys: result.decoys.map(({ id, line, people }) => ({ id, line, people })),
    warnings: result.warnings.length,
    wrong: { over: result.wrong.over, under: result.wrong.under },
    peopleInFindings: result.peopleInFindings,
    overtime: result.overtime,
    days: result.days,
    matrix: {
      lines: result.matrix.lines,
      people: result.matrix.people,
      lineIds: result.matrix.lineIds,
      personIds: result.matrix.personIds,
      cells: result.matrix.cells,
    },
  };
}

export function expectedText() {
  return `${JSON.stringify(expectedFrom(analyse(loadKitFiles())), null, 2).replace(/\[\s+((?:-?\d+,\s+)*-?\d+)\s+\]/g, (_m, a) => `[${a.replace(/\s+/g, "")}]`)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = expectedText();
  if (process.argv.includes("--check")) {
    const same = existsSync(TARGET) && readFileSync(TARGET, "utf8") === text;
    console.log(`expected.json ${same ? "is up to date" : "is stale"}.`);
    process.exit(same ? 0 : 1);
  }
  writeFileSync(TARGET, text);
  console.log(`wrote expected.json (${text.length} bytes).`);
}
