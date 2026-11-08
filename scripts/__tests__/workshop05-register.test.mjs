/**
 * Workshop 05 Step 4, the register: the oracle equals expected.json.register, the independent recount
 * agrees (counts, lists, rows, the E-07 answer, the three dates), the three dates of the design, the
 * header of the template (the same CSV bytes in both editions) and the literal summary lines.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  REGISTER_COLUMNS,
  REGISTER_DATES,
  REGISTER_PAPERS,
  REGISTER_TODAY,
  askKeyLine,
  askPerson,
  buildRegister,
  registerCsv,
  registerExpected,
  registerFileName,
  registerSummary,
} from "../workshop05/oracle/oracle.mjs";
import { loadKitFiles } from "../workshop05/oracle/load.mjs";
import { compareWithExpected, recount, recountAsk, recountRegister } from "../workshop05/oracle/recount.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../workshop05");
const expected = JSON.parse(readFileSync(path.join(HERE, "oracle/expected.json"), "utf8"));
const files = loadKitFiles();
const register = buildRegister(files, REGISTER_TODAY);

test("the register of 26 Nov 2026 has 98 rows and the counts of the design", () => {
  assert.equal(REGISTER_TODAY, "2026-11-26");
  assert.equal(register.rows.length, 98);
  assert.deepEqual(register.byPaper, { contract: 24, registration: 24, "medical-exam": 24, "leave-decision": 23, "overtime-notice": 2, "safety-statement": 1 });
  assert.deepEqual(register.expired.map((x) => x.id), ["E-02", "E-06", "E-10", "E-16"]);
  assert.ok(register.expired.every((x) => x.paper === "medical-exam" && x.validUntil === "2026-09-12"));
  assert.deepEqual(register.expiring, [{ id: "E-03", paper: "medical-exam", validUntil: "2026-12-03" }]);
  assert.deepEqual(register.missing.map((x) => `${x.id} ${x.paper}`), ["E-11 leave-decision", "E-19 leave-decision", "E-07 overtime-notice", "E-08 overtime-notice"]);
  assert.equal(registerSummary(register, "en"), "register.csv: 98 rows, 4 expired, 1 expiring, 4 missing");
  assert.equal(registerSummary(register, "de"), "register.csv: 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen");
});

test("every row has the seven columns, a fixed paper id, NOT IN FILES as approver and no name", () => {
  for (const row of register.rows) {
    assert.deepEqual(Object.keys(row), REGISTER_COLUMNS);
    assert.ok(REGISTER_PAPERS.includes(row.paper));
    assert.equal(row.approved_by, "NOT IN FILES");
    assert.match(row.person_id, /^(E-\d\d|FIRM)$/);
    assert.ok(row.date === "MISSING" || /^\d{4}-\d{2}-\d{2}$/.test(row.date));
    assert.equal(row.valid_until !== "", row.paper === "medical-exam");
  }
  assert.deepEqual(register.rows.filter((r) => r.paper === "safety-statement").map((r) => [r.person_id, r.date, r.owner]), [["FIRM", "2019-03-14", "the person with the binder"]]);
  assert.deepEqual([...new Set(register.rows.filter((r) => r.paper !== "safety-statement").map((r) => r.owner))], ["office manager"]);
});

test("the question about E-07: 4 on file, 1 missing (overtime-notice), the owners by role", () => {
  const answer = askPerson(register, "E-07");
  assert.equal(answer.onFile, 4);
  assert.equal(answer.missing, 1);
  assert.deepEqual(answer.missingPapers, ["overtime-notice"]);
  assert.deepEqual(answer.papers.map((p) => p.paper), ["contract", "registration", "medical-exam", "leave-decision", "overtime-notice"]);
  assert.ok(answer.papers.every((p) => p.owner === "office manager"));
  assert.equal(askKeyLine(answer, "en"), "Key: 4 on file, 1 missing.");
  assert.equal(askKeyLine(answer, "de"), "Schlüssel: 4 vorhanden, 1 fehlt.");
  assert.deepEqual(expected.register.askE07, { onFile: 4, missing: 1, missingPaper: "overtime-notice" });
});

test("the three dates of the design: 98, 99 and 99 rows", () => {
  assert.deepEqual(REGISTER_DATES, ["2026-11-26", "2027-01-05", "2027-03-01"]);
  assert.deepEqual(expected.register.byDate, {
    "2026-11-26": { rows: 98, expired: 4, expiring: 1, missing: 4, expiringIds: ["E-03"] },
    "2027-01-05": { rows: 99, expired: 5, expiring: 2, missing: 5, expiringIds: ["E-17", "E-22"] },
    "2027-03-01": { rows: 99, expired: 5, expiring: 3, missing: 5, expiringIds: ["E-17", "E-20", "E-22"] },
  });
});

test("expected.json.register is the output of the oracle", () => {
  assert.deepEqual(registerExpected(files), expected.register);
  assert.equal(expected.register.today, "2026-11-26");
  assert.equal(expected.checkDate, "2026-11-27", "Steps 1 to 3 keep the visit day as their check date");
});

test("the independent recount agrees with the oracle, row by row", () => {
  assert.deepEqual(compareWithExpected(recount(), expected), []);
  for (const day of REGISTER_DATES) {
    const mine = recountRegister(day);
    const theirs = buildRegister(files, day);
    assert.deepEqual([...mine.lines].sort(), registerCsv(theirs).split("\n").slice(1).filter(Boolean).sort(), day);
    assert.equal(mine.rows, theirs.rows.length);
  }
  assert.deepEqual(recountAsk(recountRegister(REGISTER_TODAY), "E-07"), { onFile: 4, missing: 1, missingPaper: "overtime-notice" });
});

test("the register template has the header and the two label lines, and the same bytes in both editions", () => {
  const en = readFileSync(path.join(HERE, "kit/templates/register.csv"), "utf8");
  const de = readFileSync(path.join(HERE, "kit-de/vorlagen/register.csv"), "utf8");
  assert.equal(en, de);
  assert.equal(en, `# Fictional training material, invented for the exercise.\n# Erfundenes Übungsmaterial, für die Übung erfunden.\n${REGISTER_COLUMNS.join(",")}\n`);
});

test("a rows file never holds a name or health content: ids and dates only", () => {
  const csv = registerCsv(register);
  assert.ok(!/[a-z]{3,}\s[A-Z][a-z]+/.test(csv.replace(/office manager|the person with the binder|NOT IN FILES/g, "")));
  assert.equal(csv.split("\n").length, 98 + 2);
});

test("a register row names the file as the learner's own folder does: the German names exist in the German folder", () => {
  const names = new Set(register.rows.map((row) => row.where));
  for (const name of names) {
    assert.ok(existsSync(path.join(HERE, "kit/folder", name)), `${name} is in the English folder`);
    assert.ok(existsSync(path.join(HERE, "kit-de/ordner", registerFileName(name, "de"))), `${registerFileName(name, "de")} is in the German folder`);
    assert.equal(registerFileName(name, "en"), name);
  }
});
