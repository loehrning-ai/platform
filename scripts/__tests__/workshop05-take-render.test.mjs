/**
 * Workshop 05 deck, take rendering. The deck shows what Claude really answered: a Claude window replica reads the accepted
 * recordings (claude-recording/v1) at build time and prints their lines verbatim, with a chip that names the recorded date
 * and model, and a key line that says "same" or what differs. With no accepted recording the labelled empty frame shows.
 * These tests build the editions from synthetic recordings (fixture-takes.mjs), which are never written to a file.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildEdition } from "../workshop05/deck-src/build.mjs";
import { deckData } from "../workshop05/deck-src/data.mjs";
import { fixtureTakes } from "../workshop05/deck-src/fixture-takes.mjs";
import { MAX_LINES, modelName, recordedOn, takeRows, turnOf, wrapLine } from "../workshop05/deck-src/take.mjs";
import { hasClass, slidesOf, textOf } from "../workshop05/deck-src/deck-html.mjs";
import { modelName as siteModelName, recordedOn as siteRecordedOn } from "../../packages/website/src/lib/claude-runs.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK_CSS = readFileSync(path.resolve(HERE, "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib/deck.css"), "utf8");
const copy = JSON.parse(readFileSync(path.resolve(HERE, "../workshop05/deck-src/deck-copy.json"), "utf8"));
const LANGS = ["en", "de"];

/** [slide id, recording key, slot, the id of the window's answer element] */
const SLOTS = [
  ["step1", "chain", "step1", "take"],
  ["step2", "chain", "step2", "take"],
  ["step3", "chain", "step3", "take"],
  ["register", "register", "step4", "take"],
  ["register", "register", "ask", "take2"],
];

const build = (lang, variant) => {
  const d = deckData(lang);
  const takes = variant === "none" ? { chain: null, register: null } : fixtureTakes(lang, { d, differs: variant === "differs" });
  return { d, takes, html: buildEdition(lang, d, takes) };
};
const built = Object.fromEntries(LANGS.flatMap((lang) => ["none", "same", "differs"].map((v) => [`${lang}-${v}`, build(lang, v)])));

function find(node, test, out = []) {
  if (!node.tag) return out;
  if (test(node)) out.push(node);
  for (const child of node.children ?? []) find(child, test, out);
  return out;
}
/** The text of a recorded row: inline markup (bold, the hidden asterisks) is joined without a space, so the row reads as recorded. */
const rowText = (node) => (node.text !== undefined ? textOf(node) : (node.children ?? []).map(rowText).join(""));
const slideOf = (html, id) => slidesOf(html).find((s) => s.attrs.id === id);
const byDataId = (slide, id) => find(slide, (n) => n.attrs?.["data-id"] === id)[0];

test("the deck's date and model helpers equal the website's, on the recorded fixtures", () => {
  assert.equal(recordedOn("2026-10-26T09:00:00.000Z", "en"), "26 October 2026");
  assert.equal(recordedOn("2026-10-26T09:00:00.000Z", "de"), "26.10.2026");
  assert.equal(modelName("claude-opus-5-5"), "Claude Opus 5.5");
  for (const iso of ["2026-10-26T09:00:00.000Z", "2026-11-02T23:59:59.000Z", "2026-01-01T00:00:00.000Z"]) {
    for (const lang of LANGS) assert.equal(recordedOn(iso, lang), siteRecordedOn(iso, lang), `${iso} ${lang}`);
  }
  for (const id of ["claude-opus-5-5", "claude-sonnet-5-5-20261001", "claude-haiku-4-6", "some-other-model"]) assert.equal(modelName(id), siteModelName(id), id);
});

for (const lang of LANGS) {
  test(`${lang}: with no accepted take the labelled empty frame shows, with its three buttons and a key line, and no chip`, () => {
    const { html } = built[`${lang}-none`];
    assert.doesNotMatch(html, /data-take=/, "no take row");
    assert.doesNotMatch(html, /tk-chip/, "no chip");
    for (const [slideId, , , answerId] of SLOTS) {
      const slide = slideOf(html, slideId);
      const frame = byDataId(slide, answerId);
      assert.ok(hasClass(frame, "st__slot"), `${lang} ${slideId}: the empty frame`);
      assert.equal(textOf(frame.children[0]), copy[lang].take.slot, `${lang} ${slideId}: the label`);
      assert.equal(find(frame, (n) => hasClass(n, "st__btn")).length, copy[lang].take.slotOpts.length);
    }
  });

  test(`${lang}: a take that matches the key shows its chip with the recorded date and model, and "same" in the key line`, () => {
    const { html, takes, d } = built[`${lang}-same`];
    const date = recordedOn(takes.chain.recorded_at, lang);
    for (const [slideId, key, slot, answerId] of SLOTS) {
      const slide = slideOf(html, slideId);
      const chipId = answerId === "take2" ? "chip2" : "chip";
      const keyId = answerId === "take2" ? "key2" : "key";
      assert.equal(textOf(byDataId(slide, chipId)), copy[lang].take.chipSame.replace("{date}", date).replace("{model}", modelName(takes[key].model)), `${lang} ${slideId} ${slot}: chip`);
      const line = textOf(byDataId(slide, keyId));
      assert.ok(line.endsWith(copy[lang].take.same), `${lang} ${slideId} ${slot}: ends with "${copy[lang].take.same}": ${line}`);
      assert.ok(line.startsWith(d.lang === "de" ? "Schlüssel" : "Key"), `${lang} ${slideId} ${slot}: key first`);
    }
  });

  test(`${lang}: a take that differs shows the short chip and what differs, in at most two short phrases`, () => {
    const { html, takes } = built[`${lang}-differs`];
    const date = recordedOn(takes.chain.recorded_at, lang);
    for (const [slideId, , slot, answerId] of SLOTS) {
      const slide = slideOf(html, slideId);
      const chipId = answerId === "take2" ? "chip2" : "chip";
      const keyId = answerId === "take2" ? "key2" : "key";
      assert.equal(textOf(byDataId(slide, chipId)), copy[lang].take.chipDiff.replace("{date}", date), `${lang} ${slot}: chip`);
      const line = textOf(byDataId(slide, keyId));
      const run = line.slice(line.indexOf(copy[lang].take.diff.split("{diff}")[0]));
      const phrases = run.replace(copy[lang].take.diff.split("{diff}")[0], "").replace(/\.$/, "").split(", ");
      assert.ok(phrases.length >= 1 && phrases.length <= 2, `${lang} ${slot}: ${phrases.length} phrases`);
      for (const phrase of phrases) assert.ok(phrase.split(/\s+/).length <= 2, `${lang} ${slot}: "${phrase}" is at most two words`);
      assert.ok(!line.endsWith(copy[lang].take.same), `${lang} ${slot}: not "same"`);
    }
  });

  test(`${lang}: every recorded line is printed verbatim (wrapped rows join back to the line), tables keep their cells, at most ${MAX_LINES} lines`, () => {
    const { html, takes } = built[`${lang}-same`];
    for (const [slideId, key, slot, answerId] of SLOTS) {
      const turn = turnOf(takes[key], key, slot);
      const recorded = turn.final_text.split("\n").filter((l) => l.trim() !== "");
      assert.ok(recorded.length <= MAX_LINES, `${slot}: ${recorded.length} lines`);
      const answer = byDataId(slideOf(html, slideId), answerId);
      assert.equal(answer.attrs["data-take"], takes[key].id);
      const shown = [];
      const flow = (answer.children ?? []).find((n) => hasClass(n, "tk-flow")) ?? answer;
      // step 1 wraps its table in the zoom scene (tk-zoom): read through it
      for (const child of (flow.children ?? []).flatMap((n) => (hasClass(n, "tk-zoom") ? n.children ?? [] : [n]))) {
        if (child.tag === "table") {
          for (const tr of find(child, (n) => n.tag === "tr")) shown.push(`| ${tr.children.map(textOf).join(" | ")} |`);
        } else if (hasClass(child, "rec")) {
          if (child.attrs["data-cont"] !== undefined) shown[shown.length - 1] += ` ${rowText(child)}`;
          else shown.push(rowText(child));
        }
      }
      const expected = recorded.filter((l) => !/^\s*\|\s*:?-{2,}/.test(l)).map((l) => l.trim().replace(/\s+/g, " "));
      assert.deepEqual(shown.map((l) => l.replace(/\s+/g, " ")), expected, `${lang} ${slot}: the lines`);
    }
  });

  test(`${lang}: the produced files of a take show with the recorded names (step 3 as page previews, step 4 as chips)`, () => {
    const { html, takes } = built[`${lang}-same`];
    const names = (slideId, cls = "cw-file") => find(slideOf(html, slideId), (n) => hasClass(n, cls)).map((n) => textOf(find(n, (x) => x.tag === "b")[0]));
    assert.deepEqual(names("step3", "tk-prev"), takes.chain.produced_files.map((f) => f.name).filter((n) => n !== "check.py"));
    assert.deepEqual(names("register"), takes.register.produced_files.map((f) => f.name));
  });

  test(`${lang}: the lines of a take stagger 30 to 40 ms apart, at most 16 items, 700 ms from the first to the last`, () => {
    const { html } = built[`${lang}-same`];
    for (const [slideId, , slot, answerId] of SLOTS) {
      const slide = slideOf(html, slideId);
      const answer = byDataId(slide, answerId);
      const press = Number(answer.attrs["data-step"]);
      const ms = Number(slide.attrs["data-durations"].split(",")[press]);
      const rows = find(answer, (n) => n.attrs?.["data-take"] !== undefined && n.tag !== "table" && n !== answer);
      // one window per recorded line: the wrapped parts of a line share it
      const starts = [...new Set(rows.map((n) => n.attrs["data-win"].split(",")[0]))].map(Number);
      assert.ok(starts.length >= 1 && starts.length <= 16, `${lang} ${slot}: ${starts.length} items`);
      const gaps = starts.slice(1).map((v, i) => (v - starts[i]) * ms);
      for (const gap of gaps) assert.ok(gap >= 29 && gap <= 41, `${lang} ${slot}: gap ${gap.toFixed(1)} ms`);
      assert.ok((starts.at(-1) - starts[0]) * ms <= 700, `${lang} ${slot}: spread over ${((starts.at(-1) - starts[0]) * ms).toFixed(0)} ms`);
      assert.ok(Number(slide.attrs["data-durations"].split(",")[press]) <= 1600);
    }
  });
}

test("a take with more than 16 lines is refused at build time; a tall one is not cut, the window scrolls it", () => {
  const d = deckData("en");
  const takes = fixtureTakes("en", { d });
  const many = { ...takes, chain: { ...takes.chain, follow_ups: [{ ...takes.chain.follow_ups[0], final_text: Array.from({ length: 17 }, (_, i) => `line ${i}`).join("\n") }, takes.chain.follow_ups[1]] } };
  assert.throws(() => buildEdition("en", d, many), /at most 16/);
  const long = Array.from({ length: 16 }, (_, i) => `L${i + 1} ${"word ".repeat(30).trim()}`).join("\n");
  const tall = { ...takes, chain: { ...takes.chain, follow_ups: [{ ...takes.chain.follow_ups[0], final_text: long }, takes.chain.follow_ups[1]] } };
  const html = buildEdition("en", d, tall);
  assert.equal((html.match(/data-line="16"/g) ?? []).length > 0, true, "the last line of a tall answer is still in the page");
  assert.match(html, /class="tk-flow"/);
  assert.equal(takeRows("a b c\n| x | y |\n| --- | --- |\n| 1 | 2 |").length, 2);
});

test("a long line is cut into rows of about equal length that join back to the line, none longer than 11 words", () => {
  const line = Array.from({ length: 17 }, (_, i) => `w${i}`).join(" ");
  const rows = wrapLine(line);
  assert.equal(rows.join(" "), line);
  assert.deepEqual(rows.map((r) => r.split(" ").length), [9, 8]);
  assert.deepEqual(wrapLine("one two three"), ["one two three"]);
});

test("the window text is never smaller than 20 px: every rule for a take row, chip, key or tool is at least 20 px", () => {
  const rules = [...DECK_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
  const take = rules.filter((r) => /\.rec\b|\.tk-chip|\.tk-key|\.tk-tool\b|\.cw-answer/.test(r.selector));
  assert.ok(take.length >= 8, "the take rules are found");
  for (const { selector, body } of take) {
    const size = /font:\s*[\d.]+\s+(\d+)px/.exec(body)?.[1] ?? /font-size:\s*(\d+)px/.exec(body)?.[1];
    if (size !== undefined) assert.ok(Number(size) >= 20, `${selector}: ${size}px`);
  }
});

test("the rows of a take carry no inline size and the window thread hides rows that are not shown yet", () => {
  for (const key of Object.keys(built)) assert.doesNotMatch(built[key].html, /data-take="[^"]*"[^>]*style=/, key);
  assert.match(DECK_CSS, /\.tk-thread > \[data-off\]\{display:none\}/);
});
