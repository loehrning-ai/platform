/**
 * Workshop 05 deck, lockstep. deck-copy.json is hand written and must never carry a computed number by hand: every
 * number in it (rows read, findings, checked cells, questions, the status tally, the day counts) is either a placeholder
 * that build.mjs fills from the oracle, or it equals what data.mjs computes from the kit files with oracle.mjs.
 * The built pages then show exactly those values, in both editions, and the two day-counting rules in the page scripts
 * agree with the deck data and with the notice date of the kit.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { deckData, PUBLIC, workingDaysBetween as dataWorkingDays } from "../workshop05/deck-src/data.mjs";
import { countDeck } from "../workshop05/deck-src/count-words.mjs";
import { DECK_DIR, LANGS, readPage, slidesOf, textOf, tokensIn, visibleMatches, withAttr, withoutNotes } from "../workshop05/deck-src/deck-html.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "../workshop05/deck-src");
const copy = JSON.parse(readFileSync(path.join(SRC, "deck-copy.json"), "utf8"));
const expected = JSON.parse(readFileSync(path.resolve(HERE, "../workshop05/oracle/expected.json"), "utf8"));
const data = Object.fromEntries(LANGS.map((lang) => [lang, deckData(lang)]));
const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));

const load = (file) => {
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(readFileSync(path.join(DECK_DIR, "lib", file), "utf8"), sandbox, { filename: file });
  return sandbox.module.exports;
};
const clockLib = load("w05-clock.js");
const daysLib = load("w05-days.js");

/** Every string of a value, with its path (the presenter notes included). */
function strings(value, trail = "", out = []) {
  if (typeof value === "string") out.push([trail, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${trail}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, `${trail}.${k}`, out);
  return out;
}

const slideText = (lang, id, k) => countDeck(pages[lang]).find((s) => s.id === id).states[k].join(" ");
const slide = (lang, id) => slidesOf(pages[lang]).find((s) => s.attrs.id === id);
/** data-count end values (the middle number of "from,to,from") of a slide, in document order. */
const counts = (lang, id) => withAttr(slide(lang, id), "data-count").map((n) => Number(n.attrs["data-count"].split(",")[1]));

test("the oracle answer on the kit equals expected.json and the numbers the deck was designed on", () => {
  const d = data.en;
  assert.equal(d.rowsRead, 693);
  assert.equal(d.rowsRead, expected.rowsRead);
  assert.equal(d.findings.length, 10);
  assert.equal(d.decoys.length, 8);
  assert.equal(d.lines.length, 13);
  assert.deepEqual([d.tally.covered ?? d.tally.COVERED, d.tally.weak ?? d.tally.WEAK, d.tally.gap ?? d.tally.GAP], [2, 1, 10]);
  assert.deepEqual([d.wrong.over, d.wrong.under], [12, 9]);
  assert.equal(d.peopleInFindings, 15);
  assert.deepEqual([d.counters.base, d.counters["e08-nine-hours"], d.counters["ticks-filled"], d.counters["no-free-day-move"]], [10, 11, 10, 11]);
  assert.deepEqual([data.de.rowsRead, data.de.findings.length, data.de.lines.length], [d.rowsRead, d.findings.length, d.lines.length]);
});

test("deck-copy.json holds no hand typed computed number: rows, findings, checked cells and questions equal data.mjs", () => {
  const d = data.en;
  const labour = PUBLIC.checklists.labour;
  for (const lang of LANGS) {
    for (const [trail, text] of strings(copy[lang])) {
      for (const m of text.matchAll(/(\d[\d.,]*)\s+(rows|Zeilen)\b/gi)) assert.equal(m[1].replace(/[.,]/g, ""), String(d.rowsRead), `${lang}${trail}: rows read`);
      for (const m of text.matchAll(/\b(\d+)\s+(findings|Funde)\b/gi)) assert.equal(Number(m[1]), d.findings.length, `${lang}${trail}: findings`);
      for (const m of text.matchAll(/\b(\d+)\s+(checked|geprüft\w*)\b/gi)) assert.equal(Number(m[1]), d.decoys.length, `${lang}${trail}: checked cells`);
      for (const m of text.matchAll(/\b(\d+)\s+(questions|Fragen)\b/gi)) assert.ok([d.lines.length, labour].includes(Number(m[1])), `${lang}${trail}: ${m[0]} is neither the 13 of the kit nor the public ${labour}`);
      assert.doesNotMatch(text, /\b(COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE)\s+\d|\b\d+\s+(COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE)\b/, `${lang}${trail}: a tally typed by hand`);
    }
  }
});

test("the tally, the xray counters and the question count are placeholders or computed attributes in the copy", () => {
  for (const lang of LANGS) {
    const step3 = copy[lang].s.step3;
    for (const key of ["{covered}", "{weak}", "{gap}"]) assert.ok(step3.status.includes(key), `${lang}: step3.status carries ${key}`);
    assert.ok(step3.question.includes("{lines}"), `${lang}: step3.question carries {lines}`);
    assert.match(copy[lang].s.table.count, new RegExp(`^${data[lang].lines.length} `), `${lang}: the table count is the number of lines`);
    const text = withoutNotes(pages[lang]).replace(/<script[\s\S]*?<\/script>/g, "");
    assert.doesNotMatch(text, /\{[A-Za-z0-9]+\}/, `${lang}: an unfilled placeholder on a page`);
  }
});

test("the built pages show the computed numbers: xray counters, the tally, the wrong counts and the question count", () => {
  for (const lang of LANGS) {
    const d = data[lang];
    assert.deepEqual(counts(lang, "xray"), [d.rowsRead, d.findings.length, d.decoys.length], `${lang}: xray counters`);
    assert.deepEqual(counts(lang, "step3"), [d.tally.covered ?? d.tally.COVERED, d.tally.weak ?? d.tally.WEAK, d.tally.gap ?? d.tally.GAP], `${lang}: step3 tally`);
    assert.match(slideText(lang, "xray", 4), new RegExp(`${d.wrong.over}\\b[\\s\\S]*${d.wrong.under}\\b`), `${lang}: the two wrong counts`);
    assert.match(slideText(lang, "step3", 1), new RegExp(`\\b${d.lines.length}\\b`), `${lang}: the poll question names ${d.lines.length}`);
    assert.match(slideText(lang, "xray", 1), new RegExp(`\\b${d.rowsRead}\\b`));
  }
});

test("the findings poll: the computed people count is one of the buttons, and the xray ledger says it", () => {
  const d = data.en;
  const buttons = withAttr(slide("en", "step2"), "data-poll").map((b) => Number(tokensIn(b)[0]));
  assert.deepEqual(buttons, [6, 10, 15, 20]);
  assert.ok(buttons.includes(d.peopleInFindings), "the computed answer is a button");
  const people = new Set();
  for (const f of d.findings) if (!f.wholeFirm) for (const p of f.people ?? []) people.add(p);
  assert.ok(people.size >= d.peopleInFindings, "the findings name at least the counted people");
  for (const lang of LANGS) {
    const xray = slide(lang, "xray");
    const lines = visibleMatches(xray, 5, (n) => (n.attrs?.class ?? "").split(/\s+/).includes("out"), { nested: true }).map((n) => tokensIn(n).join(" "));
    assert.ok(lines.some((l) => new RegExp(`^${d.peopleInFindings}\\b`).test(l)), `${lang}: a ledger line starts with ${d.peopleInFindings}`);
  }
});

test("the matrix JSON in both pages has the oracle's grid and the three what-if counters", () => {
  for (const lang of LANGS) {
    const json = JSON.parse(/id="w05-matrix">([\s\S]*?)<\/script>/.exec(pages[lang])[1]);
    const d = data[lang];
    assert.deepEqual(json.lines, d.matrix.lineIds);
    assert.deepEqual(json.people, d.matrix.personIds);
    assert.equal(json.rowsRead, d.rowsRead);
    assert.equal(json.counter, d.counters.base);
    assert.deepEqual(json.whatif.map((w) => w.counter), [d.counters["e08-nine-hours"], d.counters["ticks-filled"], d.counters["no-free-day-move"]]);
    assert.equal(json.flags.length, d.findings.length);
    assert.equal(json.checkedClusters, d.decoys.length);
  }
});

test("days: the clock page script and the deck data count the same days, and the kit notice is the clock's notice", () => {
  const d = data.en;
  assert.equal(d.clock.calendar, 4);
  assert.equal(d.clock.workingBetween, 3);
  for (const day of d.clock.buttons) assert.equal(clockLib.workingDaysBetween(d.clock.notice, day), dataWorkingDays(d.clock.notice, day), `working days to ${day}`);
  assert.deepEqual(d.clock.buttons.map((day) => clockLib.workingDaysBetween(d.clock.notice, day)), [1, 2, 3]);
  assert.deepEqual(d.clock.buttons.map((day) => clockLib.verdict(clockLib.workingDaysBetween(d.clock.notice, day))), ["short", "unclear", "fits"]);
  assert.equal(d.clock.notice, "2026-11-23");
  assert.equal(d.clock.visit, "2026-11-27");
  for (const lang of LANGS) {
    const root = withAttr(slide(lang, "clock"), "data-notice")[0];
    assert.equal(root.attrs["data-notice"], d.clock.notice, `${lang}: the clock root carries the kit's notice date`);
  }
});

test("audit days: the three bands give 3, 4 and 5 days, the legend and the 24 staff of Gradba-Pro agree", () => {
  assert.deepEqual([25, 45, 65].map(daysLib.auditDays), [3, 4, 5]);
  assert.equal(daysLib.auditDays(PUBLIC.staff), 3);
  for (const lang of LANGS) {
    const iso = slide(lang, "isosheet");
    assert.deepEqual(withAttr(iso, "data-band").map((b) => Number(b.attrs["data-band"])), [25, 45, 65]);
    const legend = strings(copy[lang].s.isosheet.legend);
    const numbers = legend.flatMap(([, text]) => text.split("·").map((part) => Number(part.trim().split(" ")[0])));
    assert.deepEqual(numbers.slice(0, 3), [3, 4, 5], `${lang}: the legend counts days`);
    assert.equal(withAttr(iso, "data-day-tile").length, 5, `${lang}: tiles for the largest band`);
  }
  assert.deepEqual([PUBLIC.doors.isoFrom, PUBLIC.doors.isoTo], [3, 5]);
});

test("public figures: the doors, the DIT dots and the firm share equal the deck data they are drawn from", () => {
  const d = data.en;
  const sum = PUBLIC.dit2025.regular + PUBLIC.dit2025.followUp + PUBLIC.dit2025.extraordinary;
  assert.equal(Object.values(d.dit.dots).reduce((a, b) => a + b, 0), 100);
  assert.equal(d.dit.total, sum);
  assert.equal(d.micro.share, Math.round((PUBLIC.firmSize.micro / PUBLIC.firmSize.all) * 100));
  for (const lang of LANGS) {
    assert.deepEqual(counts(lang, "doors").slice(0, 2), [PUBLIC.doors.building, PUBLIC.doors.tax]);
    const dots = slideText(lang, "neighbour", 2);
    const fmt = (n) => (lang === "de" ? n.toLocaleString("de-DE") : n.toLocaleString("en-US"));
    assert.match(dots, new RegExp(`\\b${d.dit.dots.extraordinary}\\b[^\\d]*\\b${d.dit.dots.followUp}\\b[^\\d]*\\b${d.dit.dots.regular}\\b`), `${lang}: the 54, 25 and 21 dots`);
    assert.match(slideText(lang, "neighbour", 4), new RegExp(`${PUBLIC.dit2025.inspectors}\\b[\\s\\S]*${fmt(sum)}`), `${lang}: inspectors and inspections`);
    assert.match(slideText(lang, "letter", 3), new RegExp(`\\b${d.micro.share}\\b`), `${lang}: share of small firms`);
  }
});

test("the prompt cards are the kit's start file blocks, byte for byte, in each edition", () => {
  for (const lang of LANGS) {
    const d = data[lang];
    for (const [id, key] of [["step1", "step1"], ["step2", "step2"], ["step3", "step3"]]) {
      const cards = visibleMatches(slide(lang, id), 99, (n) => (n.attrs?.class ?? "").split(/\s+/).includes("prompt-body"));
      assert.equal(cards.length, 1, `${lang} ${id}: one prompt card`);
      assert.equal(textOf(cards[0]), d.prompts[key].split(/\s+/).filter(Boolean).join(" "), `${lang} ${id}: the card equals the kit text`);
    }
  }
});
