/**
 * Workshop 05 deck, lockstep. deck-copy.json is hand written and must never carry a computed number by hand: every
 * number in it (rows read, findings, checked cells, questions, the status tally, the register counts, the E-07 answer)
 * is either a placeholder that build.mjs fills from the oracle, or it equals what data.mjs computes from the kit files
 * with oracle.mjs. The built pages then show exactly those values, in both editions; the prompt cards are the kit's
 * START blocks byte for byte; and nothing of the old matrix, days or clock scenes is left.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { deckData } from "../workshop05/deck-src/data.mjs";
import { DECK_DIR, LANGS, readPage, slidesOf, textOf, tokensIn, withAttr, withoutNotes } from "../workshop05/deck-src/deck-html.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "../workshop05/deck-src");
const copy = JSON.parse(readFileSync(path.join(SRC, "deck-copy.json"), "utf8"));
const expected = JSON.parse(readFileSync(path.resolve(HERE, "../workshop05/oracle/expected.json"), "utf8"));
const data = Object.fromEntries(LANGS.map((lang) => [lang, deckData(lang)]));
const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));

/** Every string of a value, with its path (the presenter notes included). */
function strings(value, trail = "", out = []) {
  if (typeof value === "string") out.push([trail, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${trail}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, `${trail}.${k}`, out);
  return out;
}

const slide = (lang, id) => slidesOf(pages[lang]).find((s) => s.attrs.id === id);
/** data-count end values (the middle number of "from,to,from") of a slide, in document order. */
const counts = (lang, id) => withAttr(slide(lang, id), "data-count").map((n) => Number(n.attrs["data-count"].split(",")[1]));
const unescape = (text) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** Removes script and style blocks (any case, also "</script >") until nothing changes. */
function stripBlocks(html) {
  let prev;
  let out = html;
  do {
    prev = out;
    out = out.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ");
  } while (out !== prev);
  return out;
}

test("the oracle answer on the kit equals expected.json and the numbers the deck was designed on", () => {
  const d = data.en;
  assert.equal(d.rowsRead, 693);
  assert.equal(d.rowsRead, expected.rowsRead);
  assert.equal(d.findings.length, 10);
  assert.equal(d.decoys.length, 8);
  assert.deepEqual([d.tally.covered, d.tally.weak, d.tally.gap], [2, 1, 10]);
  assert.equal(d.vars.rows, 13);
  assert.equal(d.files, 41, "41 files: keep-watch/ adds five (REDESIGN-3 D5)");
  assert.deepEqual(d.tree.length, 12, "twelve top-level entries in the kit (keep-watch/ joined, REDESIGN-3 D5)");
  assert.deepEqual([data.de.rowsRead, data.de.findings.length, data.de.files, data.de.tree.length], [d.rowsRead, d.findings.length, d.files, d.tree.length]);
});

test("the register of step 4: 98 rows, 4 expired, 1 expiring, 4 missing, and E-07 has 4 on file and 1 missing", () => {
  for (const lang of LANGS) {
    const r = data[lang].register;
    assert.deepEqual([r.rows, r.expired, r.expiring, r.missing], [98, 4, 1, 4]);
    assert.deepEqual([r.ask.id, r.ask.onFile, r.ask.missing, r.ask.missingPaper], ["E-07", 4, 1, "overtime-notice"]);
    assert.equal(r.summary[lang], lang === "en" ? "register.csv: 98 rows, 4 expired, 1 expiring, 4 missing" : "register.csv: 98 Zeilen, 4 abgelaufen, 1 läuft ab, 4 fehlen");
    assert.equal(r.ask.key, lang === "en" ? "Key: 4 on file, 1 missing." : "Schlüssel: 4 vorhanden, 1 fehlt.");
  }
});

test("deck-copy.json holds no hand typed computed number: rows, findings, checked cells and questions equal data.mjs", () => {
  const d = data.en;
  for (const lang of LANGS) {
    for (const [trail, text] of strings(copy[lang])) {
      for (const m of text.matchAll(/(\d[\d.,]*)\s+(rows|Zeilen)\b/gi)) {
        const n = m[1].replace(/[.,]/g, "");
        assert.ok([String(d.rowsRead), String(d.vars.rows), String(d.vars.cols), String(d.register.rows)].includes(n), `${lang}${trail}: "${m[0]}" is not a computed row count`);
      }
      for (const m of text.matchAll(/\b(\d+)\s+(findings|Funde)\b/gi)) assert.equal(Number(m[1]), d.findings.length, `${lang}${trail}: findings`);
      for (const m of text.matchAll(/\b(\d+)\s+(checked|geprüft\w*)\b/gi)) assert.equal(Number(m[1]), d.decoys.length, `${lang}${trail}: checked cells`);
      assert.doesNotMatch(text, /\b(COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE)\s+\d|\b\d+\s+(COVERED|WEAK|GAP|BELEGT|SCHWACH|LÜCKE)\b/, `${lang}${trail}: a tally typed by hand`);
    }
  }
});

test("the register counts, the tally and the file count are placeholders in the copy, and no placeholder is left on a page", () => {
  for (const lang of LANGS) {
    const reg = copy[lang].s.register;
    for (const key of ["{expired}", "{expiring}", "{missing}"]) assert.ok(reg.n.includes(key), `${lang}: register.n carries ${key}`);
    assert.ok(copy[lang].s.kit.zip.includes("{files}"), `${lang}: the zip line carries {files}`);
    const text = stripBlocks(withoutNotes(pages[lang]));
    assert.doesNotMatch(text, /\{[A-Za-z0-9]+\}/, `${lang}: an unfilled placeholder on a page`);
  }
});

test("the built pages show the computed numbers: the register counts, the tally and the file count", () => {
  for (const lang of LANGS) {
    const d = data[lang];
    // the table counts the rows, then the date scrubber counts rows, expired, expiring and missing for each of the three dates (expected.json)
    const dates = Object.values(d.register.byDate);
    assert.deepEqual(counts(lang, "register"), [d.register.rows, ...dates.flatMap((x) => [x.rows, x.expired, x.expiring, x.missing])], `${lang}: register counts`);
    assert.deepEqual([dates[0].expired, dates[0].expiring, dates[0].missing], [d.register.expired, d.register.expiring, d.register.missing], `${lang}: the first date is the exercise day`);
    const kit = slide(lang, "kit");
    assert.ok(tokensIn(kit).includes(String(d.files)), `${lang}: the zip line names ${d.files} files`);
    const text = stripBlocks(withoutNotes(pages[lang]));
    assert.match(text, new RegExp(`\\b${d.rowsRead}\\b`), `${lang}: rows read`);
  }
});

test("the findings poll: the computed count is one of the buttons", () => {
  const d = data.en;
  const buttons = withAttr(slide("en", "step2"), "data-poll").map((b) => Number(tokensIn(b)[0]));
  assert.deepEqual(buttons, d.finds);
  assert.ok(buttons.includes(d.findings.length), "the computed answer is a button");
});

test("the kit tree on slide 6 names the top-level entries of the zip (the notice file by its short name)", () => {
  for (const lang of LANGS) {
    const shown = copy[lang].s.kit.tree.split(" · ");
    const real = data[lang].tree;
    assert.equal(shown.length, real.length, `${lang}: twelve entries`);
    for (const name of shown) assert.ok(real.some((r) => r === name || (name === "notice" && r.startsWith("notice_")) || (name === "mitteilung" && r.startsWith("mitteilung_"))), `${lang}: ${name} is in the kit`);
  }
});

test("the prompt cards are the kit's START blocks, byte for byte, in each edition", () => {
  for (const lang of LANGS) {
    const d = data[lang];
    const found = Object.fromEntries([...pages[lang].matchAll(/<pre class="prompt__text prompt-body" id="prompt-(\d)">([\s\S]*?)<\/pre>/g)].map((m) => [m[1], unescape(m[2])]));
    assert.deepEqual(Object.keys(found), ["1", "2", "3", "4", "5"], `${lang}: five prompt cards`);
    assert.equal(found[1], d.prompts.step1, `${lang}: step 1`);
    assert.equal(found[2], d.prompts.step2, `${lang}: step 2`);
    assert.equal(found[3], d.prompts.step3, `${lang}: step 3`);
    assert.equal(found[4], d.prompts.step4, `${lang}: step 4`);
    assert.equal(found[5], d.prompts.step4b, `${lang}: step 4, second block`);
  }
});

/** Every element of a slide with the class, whatever its press state. */
function byClass(node, name, out = []) {
  if (!node.tag) return out;
  if ((node.attrs?.class ?? "").split(/\s+/).includes(name)) out.push(node);
  for (const child of node.children ?? []) byClass(child, name, out);
  return out;
}

test("each card sits on its slide: steps 1 to 3 on step1, step2, step3, the two register prompts on register", () => {
  for (const lang of LANGS) {
    const cards = (id) => byClass(slide(lang, id), "prompt-body");
    assert.deepEqual(["step1", "step2", "step3"].map((id) => cards(id).length), [1, 1, 1], `${lang}: one card each`);
    assert.equal(cards("register").length, 2, `${lang}: the register slide holds two cards`);
    assert.equal(textOf(cards("step1")[0]), data[lang].prompts.step1.split(/\s+/).filter(Boolean).join(" "));
  }
});

test("the notes take the kit and oracle numbers from placeholders, not from typing", () => {
  for (const lang of LANGS) {
    const notes = copy[lang].notes;
    assert.ok(notes[1].includes("{files}") && notes[7].includes("{files}"), `${lang}: the file count of notes 2 and 8`);
    assert.ok(notes[8].includes("{rows}"), `${lang}: the question count of note 9`);
    assert.ok(["{rowsRead}", "{findings}", "{decoys}"].every((k) => notes[9].includes(k)), `${lang}: the three numbers of note 10`);
    assert.ok(["{covered}", "{weak}", "{gap}"].every((k) => notes[11].includes(k)), `${lang}: the tally of note 12`);
    const d = data[lang];
    const built = JSON.parse(/id="speaker-notes">([\s\S]*?)<\/script>/.exec(pages[lang])[1].replace(/\\u003c/g, "<"));
    assert.match(built[1], new RegExp(`\\b${d.files}\\b`), `${lang}: the built note 2 shows ${d.files}`);
    assert.match(built[9], new RegExp(`\\b${d.rowsRead}\\b\\D+\\b${d.findings.length}\\b\\D+\\b${d.decoys.length}\\b`), `${lang}: the built note 10`);
    assert.match(built[11], new RegExp(`${d.tally.covered} (COVERED|BELEGT), ${d.tally.weak} (WEAK|SCHWACH), ${d.tally.gap} (GAP|LÜCKE)`), `${lang}: the built note 12`);
  }
});

test("nothing of the old matrix, days, clock or gates scenes is left in the deck folder or the built pages", () => {
  const lib = path.join(DECK_DIR, "lib");
  for (const name of ["w05-clock.js", "w05-days.js", "w05-gates.js", "w05-matrix.js"]) assert.ok(!existsSync(path.join(lib, name)), `${name} is gone`);
  assert.deepEqual(readdirSync(lib).filter((n) => /^w05-.*\.js$/.test(n)).sort(), ["w05-field.js", "w05-scrub.js", "w05-tally.js"]);
  for (const lang of LANGS) assert.doesNotMatch(pages[lang], /w05-(clock|days|gates|matrix)|data-notice|data-band|data-day-tile/, lang);
  assert.ok(!existsSync(path.join(SRC, "matrix-data.mjs")));
});
