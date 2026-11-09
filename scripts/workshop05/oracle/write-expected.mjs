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
import { analyse, registerExpected } from "./oracle.mjs";
import { loadKitFiles } from "./load.mjs";
import { SEED } from "./plan.mjs";

const TARGET = path.join(path.dirname(fileURLToPath(import.meta.url)), "expected.json");

/** The schema of expected.json: what the demo port and the tests compare against. */
export function expectedFrom(result, files) {
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
    // Step 4: the register on 26 Nov 2026, the answer to the second prompt and the two later dates.
    register: registerExpected(files),
  };
}

export function expectedText() {
  const files = loadKitFiles();
  return `${JSON.stringify(expectedFrom(analyse(files), files), null, 2).replace(/\[\s+((?:-?\d+,\s+)*-?\d+)\s+\]/g, (_m, a) => `[${a.replace(/\s+/g, "")}]`)}\n`;
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
