/**
 * Workshop 05, slide "xray": the JSON of the matrix (13 lines x 24 people, ten flags, eight checked clusters, three what-if
 * states with the counters 10, 11, 10, 11) and the geometry helpers of lib/w05-matrix.js. The JSON comes from the same
 * function build.mjs uses (deck-src/matrix-data.mjs, real oracle runs); when the built decks carry the JSON, that copy
 * is checked too.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { analyse } from "../workshop05/oracle/oracle.mjs";
import { loadKitFiles } from "../workshop05/oracle/load.mjs";
import { matrixData } from "../workshop05/deck-src/matrix-data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.resolve(HERE, "../../packages/website/public/workshops/audit-vorbereitung-mit-ki");
const files = loadKitFiles();
const result = analyse(files);
const copy = { text: { wholeFirm: "whole firm" }, flags: {} };
const data = matrixData(files, copy);

const sandbox = { module: { exports: {} } };
vm.runInNewContext(readFileSync(path.join(DECK, "lib/w05-matrix.js"), "utf8"), sandbox, { filename: "w05-matrix.js" });
const mx = sandbox.module.exports;

/** The JSON text inside <script type="application/json" id="w05-matrix"> of a built deck, or null. */
function embedded(html) {
  const m = /<script type="application\/json" id="w05-matrix">([\s\S]*?)<\/script>/.exec(html);
  return m ? JSON.parse(m[1]) : null;
}

function checkShape(d) {
  assert.equal(d.lines.length, 13);
  assert.equal(d.people.length, 24);
  assert.equal(d.labels.length, 13);
  assert.equal(d.titles.length, 24);
  assert.equal(d.cells.length, 13);
  for (const column of d.cells) {
    assert.equal(column.length, 24);
    for (const code of column) assert.ok(code === 0 || code === 1 || code === 2, `cell code ${code}`);
  }
  assert.equal(d.flags.length, 10, "ten numbered flags");
  assert.equal(d.whatif.length, 3, "three what-if states");
  assert.deepEqual([d.counter, ...d.whatif.map((w) => w.counter)], [10, 11, 10, 11]);
  assert.equal(d.rowsRead, 693);
  assert.equal(d.files.reduce((sum, f) => sum + f.rows, 0), 693);
  assert.equal(d.checkedClusters, 8, "eight near-miss clusters");
}

test("the matrix JSON has 13 lines, 24 people, 13 x 24 cells with codes 0, 1, 2, ten flags and eight checked clusters", () => {
  checkShape(data);
  assert.deepEqual(data.lines, result.matrix.lineIds);
  assert.deepEqual(data.people, result.matrix.personIds);
});

test("code 2 cells: nine cells in seven clusters, the eighth cluster (October pay) is the whole-firm band on line L08", () => {
  const twos = data.cells.flat().filter((c) => c === 2).length;
  assert.equal(twos, 9);
  const withCells = result.matrix.clusters.filter((c) => c.kind !== "finding" && c.people.length > 0);
  assert.equal(withCells.length, 7);
  const whole = result.decoys.filter((d) => d.people.length === 0);
  assert.deepEqual(whole.map((d) => d.line), ["L08"]);
});

test("the ten flags: F1 to F10, two whole-firm bands (L08 pay run, L10 workplaces), the rest name people", () => {
  assert.deepEqual(data.flags.map((f) => f.id), ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
  assert.deepEqual(data.flags.map((f) => f.n), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  const whole = data.flags.filter((f) => f.wholeFirm);
  assert.deepEqual(whole.map((f) => f.line), ["L08", "L10"]);
  for (const f of data.flags.filter((x) => !x.wholeFirm)) assert.ok(f.people.length >= 1, `${f.id} names people`);
  assert.ok(data.flags.every((f) => f.tone === "red"));
});

test("the whole-firm bands colour all 24 cells of their column", () => {
  const l08 = data.lines.indexOf("L08");
  const l10 = data.lines.indexOf("L10");
  assert.ok(data.cells[l08].every((c) => c === 1));
  assert.ok(data.cells[l10].every((c) => c === 1));
});

test("what-if states: E-08 at 9 h adds F3b (11), filled ticks drop F5 for an amber line W1 (10), no free-day move adds F6b (11)", () => {
  const [nine, ticks, pay] = data.whatif;
  assert.deepEqual(data.whatif.map((w) => w.id), ["e08-nine-hours", "ticks-filled", "no-free-day-move"]);
  assert.ok(nine.flags.some((f) => f.id === "F3b" && f.tone === "red"));
  assert.equal(nine.flags.length, 11);
  assert.ok(!ticks.flags.some((f) => f.id === "F5"));
  assert.ok(ticks.flags.some((f) => f.id === "W1" && f.tone === "amber"));
  assert.equal(ticks.flags.length, 10);
  assert.ok(pay.flags.some((f) => f.id === "F6b" && f.wholeFirm));
  assert.equal(pay.flags.length, 11);
  for (const w of data.whatif) {
    assert.equal(w.cells.length, 13);
    assert.ok(w.cells.every((col) => col.length === 24));
    assert.equal(w.counter, w.flags.length, "the counter is the number of flags (findings plus amber lines)");
  }
});

test("the base state differs from E-08 at 9 h in one cell (L05, E-08) and from the tick state in the two E-12, E-13 cells of L04", () => {
  const diff = (a, b) => a.flatMap((col, c) => col.map((v, r) => (v === b[c][r] ? null : `${data.lines[c]}/${data.people[r]}`))).filter(Boolean);
  assert.deepEqual(diff(data.cells, data.whatif[0].cells), ["L05/E-08"]);
  assert.deepEqual(diff(data.cells, data.whatif[1].cells), ["L04/E-12", "L04/E-13"]);
  assert.deepEqual(diff(data.cells, data.whatif[2].cells), []);
});

test("the JSON is deterministic and survives a round trip through JSON text", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(matrixData(files, copy))), JSON.parse(JSON.stringify(data)));
});

test("copy text is passed through and never invented: no copy gives empty strings, not the oracle's English", () => {
  const withCopy = matrixData(files, { flags: { F5: { label: "L", rule: "R", fine: "F", fix: "X" } }, text: { rule: "Rule" } });
  assert.deepEqual(withCopy.flags.find((f) => f.id === "F5").rule, "R");
  assert.equal(data.flags[0].rule, "");
  assert.equal(withCopy.text.rule, "Rule");
});

test("the drawing geometry matches the CSS aspect ratio and stays inside the canvas", () => {
  const css = readFileSync(path.join(DECK, "lib/w05-fx.css"), "utf8");
  assert.match(css, new RegExp(`aspect-ratio:\\s*${mx.LAYOUT.W}\\s*/\\s*${mx.LAYOUT.H}`));
  assert.match(css, new RegExp(`calc\\(${mx.LAYOUT.labelH} / ${mx.LAYOUT.H} \\* 100%\\)`), "the sweep starts under the column labels");
  assert.match(css, new RegExp(`calc\\(${mx.LAYOUT.labelW} / ${mx.LAYOUT.W} \\* 100%\\)`), "the sweep starts right of the row labels");
  const first = mx.cellRect(0, 0);
  const last = mx.cellRect(12, 23);
  assert.ok(first.x >= mx.LAYOUT.labelW && first.y >= mx.LAYOUT.labelH);
  assert.ok(last.x + last.w <= mx.LAYOUT.W && last.y + last.h <= mx.LAYOUT.H);
  assert.equal(mx.LAYOUT.cols, 13);
  assert.equal(mx.LAYOUT.rows, 24);
});

test("every flag has a chip point inside the plot and the chips of one column never share a spot", () => {
  const taken = {};
  const seen = new Set();
  for (const flag of data.flags) {
    const pt = mx.flagPoint(data, flag, taken);
    assert.ok(pt.x > 0 && pt.x < mx.LAYOUT.W && pt.y > 0 && pt.y < mx.LAYOUT.H, `${flag.id} inside`);
    const key = `${Math.round(pt.x)}:${Math.round(pt.y)}`;
    assert.ok(!seen.has(key), `${flag.id} has its own spot`);
    seen.add(key);
  }
  const pay = data.whatif[2];
  const t2 = {};
  const spots = pay.flags.map((f) => mx.flagPoint(data, f, t2)).map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`);
  assert.equal(new Set(spots).size, spots.length, "F6 and F6b sit on one band but not on one spot");
});

test("staggered progress is monotone, starts at 0 and reaches 1 for the last of ten flags and the last of nine checks", () => {
  const flag = (p, i) => mx.stagger(p, i, 1.9, 0.09);
  const check = (p, i) => mx.stagger(p, i, 1.6, 0.07);
  assert.equal(flag(0, 0), 0);
  assert.equal(flag(1, 9), 1);
  assert.equal(check(1, 8), 1);
  for (let i = 0; i < 10; i += 1) {
    let last = 0;
    for (let k = 0; k <= 20; k += 1) {
      const v = flag(k / 20, i);
      assert.ok(v >= last);
      last = v;
    }
  }
});

test("markGrid: flags colour their cells, checked cells stay checked, a flag wins over a checked code", () => {
  const grid = mx.markGrid(data, { cells: data.cells, flags: data.flags });
  const col = (id) => data.lines.indexOf(id);
  const row = (id) => data.people.indexOf(id);
  assert.equal(grid[col("L02")][row("E-05")].tone, "red");
  assert.equal(grid[col("L02")][row("E-22")].check, true, "D1: E-22 checked, no problem");
  assert.equal(grid[col("L08")][row("E-17")].tone, "red", "whole-firm band");
  const reds = grid.flat().filter((c) => c.tone === "red").length;
  assert.equal(reds, data.cells.flat().filter((c) => c === 1).length);
  const amber = mx.markGrid(data, { cells: data.whatif[1].cells, flags: data.whatif[1].flags });
  assert.equal(amber[col("L04")][row("E-12")].tone, "amber");
  assert.equal(amber[col("L04")][row("E-13")].tone, "amber");
});

test("the built decks carry the same matrix shape (checked once the xray slide carries its anchor)", () => {
  for (const file of ["slides.html", "en/slides.html"]) {
    const html = readFileSync(path.join(DECK, file), "utf8");
    if (!/id="w05-matrix-anchor"/.test(html)) continue; // slide not written yet: the shape test above covers the data
    const d = embedded(html);
    assert.ok(d, `${file} carries <script type="application/json" id="w05-matrix">`);
    checkShape(d);
    assert.ok(existsSync(path.join(DECK, "lib/w05-matrix.js")));
    assert.match(html, /data-mx-phase="flags"/);
    assert.match(html, /data-mx-phase="checked"/);
  }
});
