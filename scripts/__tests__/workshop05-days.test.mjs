/**
 * Workshop 05, slide "isosheet": auditDays() of lib/w05-days.js (claim C22: 3 days for 16 to 25 staff, 4 for 26 to 45,
 * 5 for 46 to 65, initial audit only) and tilesAt(), the entry fill keyed to the anchor's --p.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const sandbox = { module: { exports: {} } };
vm.runInNewContext(readFileSync(path.join(LIB, "w05-days.js"), "utf8"), sandbox, { filename: "w05-days.js" });
const { auditDays, tilesAt } = sandbox.module.exports;

test("auditDays follows the three bands", () => {
  assert.equal(auditDays(16), 3);
  assert.equal(auditDays(25), 3);
  assert.equal(auditDays(26), 4);
  assert.equal(auditDays(45), 4);
  assert.equal(auditDays(46), 5);
  assert.equal(auditDays(65), 5);
});

test("the three buttons (data-band 25, 45, 65) give 3, 4 and 5 days, and Gradba-Pro with 24 staff gives 3", () => {
  assert.deepEqual([25, 45, 65].map(auditDays), [3, 4, 5]);
  assert.equal(auditDays(24), 3);
});

test("outside the sourced range there is no answer", () => {
  assert.equal(auditDays(15), null);
  assert.equal(auditDays(66), null);
  assert.equal(auditDays("many"), null);
  assert.equal(auditDays(undefined), null);
});

test("tilesAt fills the planned tiles one by one while --p runs and shows all of them at the end", () => {
  assert.equal(tilesAt(5, 0), 0);
  assert.equal(tilesAt(5, 0.2), 1);
  assert.equal(tilesAt(5, 0.21), 2);
  assert.equal(tilesAt(5, 1), 5);
  assert.equal(tilesAt(3, 1 / 3), 1);
  assert.equal(tilesAt(3, 0.34), 2);
  assert.equal(tilesAt(4, 1), 4);
  const counts = Array.from({ length: 21 }, (_, i) => tilesAt(5, i / 20));
  assert.ok(counts.every((n, i) => i === 0 || n >= counts[i - 1]), "never goes back while p grows");
});

test("a missing or invalid --p counts as the end state", () => {
  assert.equal(tilesAt(4, NaN), 4);
  assert.equal(tilesAt(4, 7), 4);
  assert.equal(tilesAt(4, -1), 0);
});
