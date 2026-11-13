/**
 * Workshop 05 deck, structure and the no-poll rule. Reads the BUILT pages (both editions and both presenter pages):
 *  - 16 main slides with their ids, minutes and labels (REDESIGN-3 D4), 5400 seconds, four appendix slides, 20 notes per edition;
 *  - no poll, no vote button, no ghost bar and no question to the room on any slide (Tim, 13 Nov 2026: the slides explain, they
 *    do not quiz); a question mark is allowed only where a slide quotes a checklist question of the inspector, a kit prompt or
 *    a recorded answer;
 *  - the W05 scripts (field, scrub) after the engine scripts, no inline script but the notes, no key handler of ours,
 *    w05-fx.css after deck.css on the two decks only, and every local file the pages name exists;
 *  - every appendix slide is reachable from a link and links back.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  DECK_DIR,
  LANGS,
  PAGES,
  everyElement,
  mainSlides,
  notesOf,
  readPage,
  slidesOf,
  tokensIn,
  withAttr,
} from "../workshop05/deck-src/deck-html.mjs";

const IDS = ["cover", "today", "why", "sectors", "we", "letter", "time", "kit", "step1", "step2", "tests", "step3", "register", "watch", "safety", "close"];
const MINUTES = [1, 3, 5, 4, 4, 7, 4, 5, 6, 9, 5, 8, 11, 8, 6, 4];
const APPENDIX = ["a1", "a2", "a3", "a4"];

/** The labels are the agenda of the workshop page too (workshops-audit.ts); they change only in lockstep with it. */
const LABELS = {
  en: ["Cover", "Today", "Audits happen here", "Which firms and why", "We are Gradba-Pro", "A visit in four days", "Where is our data?", "Our kit", "Step 1: make the table", "Step 2: run the check", "Four tests, three statuses", "Step 3: status, plan, briefing", "Step 4: build the register", "Stay ready", "Safety: what goes in, who signs", "Which check now"],
  de: ["Titel", "Heute", "Hier wird oft kontrolliert", "Welche Firmen und warum", "Wir sind Gradba-Pro", "Besuch in vier Tagen", "Wo sind unsere Daten?", "Unser Kit", "Schritt 1: die Tabelle bauen", "Schritt 2: den Check laufen lassen", "Vier Prüfungen, drei Status", "Schritt 3: Status, Plan, Briefing", "Schritt 4: das Register bauen", "Bereit bleiben", "Sicherheit: was hinein darf, wer unterschreibt", "Welche Kontrolle jetzt"],
};

/** Where a slide may show a question mark: a checklist question of the inspector (the step 1 document, the L10 row of the tests
 *  slide), a kit prompt, a recorded answer or a quote. Everything else on a slide is a statement. */
const QUOTED = ["tk-doc", "rw", "prompt", "prompt-body", "qd", "qd-gloss", "out"];

/** Appendix slide, the main slide that links to it (and it links back to). 13 Nov 2026 (Tim): no main slide links to law detail,
 *  so a1 (laws) is linked from no main slide; its back link still returns to the letter. */
const LINKS = { a1: "letter", a2: "safety", a3: "why", a4: "sectors" };
const LINKED_FROM = { a1: [], a2: ["safety"], a3: ["why"], a4: ["sectors"] };

const SCRIPT_ORDER = ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js", "w05-field.js", "w05-scrub.js"];

const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));
const classOf = (node) => (node.attrs?.class ?? "").split(/\s+/);
/** The text of a slide outside quoted places (checklist questions, prompts, recorded lines, quotes). */
function ownText(node, out = []) {
  if (node.text !== undefined) out.push(node.text);
  else if (node.tag && !["script", "style", "svg"].includes(node.tag) && node.attrs?.["data-take"] === undefined && !classOf(node).some((c) => QUOTED.includes(c))) {
    for (const child of node.children ?? []) ownText(child, out);
  }
  return out;
}

test("the designed minutes add up to 90", () => {
  assert.equal(IDS.length, 16);
  assert.equal(MINUTES.reduce((a, b) => a + b, 0), 90);
});

for (const lang of LANGS) {
  test(`${lang}: 16 main slides with the designed ids, minutes and labels, 5400 seconds in all`, () => {
    const main = mainSlides(pages[lang]);
    assert.deepEqual(main.map((s) => s.attrs.id), IDS);
    assert.deepEqual(main.map((s) => Number(s.attrs["data-seconds"]) / 60), MINUTES);
    assert.equal(main.reduce((sum, s) => sum + Number(s.attrs["data-seconds"]), 0), 5400);
    assert.deepEqual(main.map((s) => s.attrs["data-label"]), LABELS[lang]);
  });

  test(`${lang}: data-kind is only main or appendix, appendix slides carry 0 seconds and the ids a1 to a4`, () => {
    const all = slidesOf(pages[lang]);
    for (const s of all) assert.ok(["main", "appendix"].includes(s.attrs["data-kind"]), `${s.attrs.id}: kind ${s.attrs["data-kind"]}`);
    const appendix = all.filter((s) => s.attrs["data-kind"] === "appendix");
    assert.deepEqual(appendix.map((s) => s.attrs.id), APPENDIX);
    for (const s of appendix) assert.equal(s.attrs["data-seconds"], "0");
    assert.equal(all.length, 20);
  });

  test(`${lang}: 20 notes in slide order, each with Time, Say, Students, Cue and Remember, the first line is the label`, () => {
    const notes = notesOf(pages[lang]);
    const all = slidesOf(pages[lang]);
    assert.equal(notes.length, 20);
    notes.forEach((note, i) => {
      assert.match(note, /^(\d\d|a\d) · .+\nTime: .+\nSay: .+\nStudents: .+\nCue: .+\nRemember: .+/s, `${lang} note ${i + 1}`);
      const number = i < 16 ? String(i + 1).padStart(2, "0") : `a${i - 15}`;
      assert.equal(note.split("\n")[0], `${number} · ${all[i].attrs["data-label"]}`);
    });
  });

  test(`${lang}: no poll, no vote button and no ghost bar on any slide`, () => {
    for (const s of slidesOf(pages[lang])) {
      for (const name of ["data-poll", "data-poll-name", "data-poll-show", "data-poll-n"]) {
        assert.equal(withAttr(s, name).length, 0, `${lang} ${s.attrs.id}: an element with ${name}`);
      }
    }
    for (const el of everyElement(pages[lang])) {
      assert.ok(!classOf(el).some((c) => ["poll", "pb", "poll__opt", "gb", "gb__bar"].includes(c)), `${lang}: a poll or ghost element (${el.attrs?.class})`);
    }
    assert.doesNotMatch(pages[lang], /w05-tally/, `${lang}: the poll counter script is gone`);
  });

  test(`${lang}: no question to the room: a question mark only in a checklist question, a prompt, a recorded line or a quote`, () => {
    for (const s of slidesOf(pages[lang])) {
      const text = ownText(s).join(" ").replace(/\s+/g, " ");
      const at = text.indexOf("?");
      assert.equal(at, -1, `${lang} ${s.attrs.id}: a question on the slide near ${JSON.stringify(text.slice(Math.max(0, at - 70), at + 1))}`);
    }
  });

  test(`${lang}: scripts in the designed order, no inline script, no key handler of our own`, () => {
    const html = pages[lang];
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => path.basename(m[1]));
    assert.deepEqual(srcs, SCRIPT_ORDER);
    const up = lang === "de" ? "./lib/" : "../lib/";
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) assert.ok(m[1].startsWith(up), `${lang}: ${m[1]} under ${up}`);
    const inline = [...html.matchAll(/<script\b([^>]*)>/gi)].filter((m) => !/\bsrc=/.test(m[1])).map((m) => m[1].trim());
    for (const attrs of inline) assert.match(attrs, /type="application\/json"/, `${lang}: an inline executable script`);
    assert.deepEqual([...html.matchAll(/<script type="application\/json" id="([^"]+)"/g)].map((m) => m[1]).sort(), ["speaker-notes"]);
    assert.doesNotMatch(html, /\son(click|keydown|keyup|load|error)=/i, `${lang}: an inline event handler`);
  });

  test(`${lang}: w05-fx.css is linked after deck.css, and every local file the page names exists`, () => {
    const html = pages[lang];
    const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => path.basename(m[1]));
    assert.deepEqual(sheets, ["fonts.css", "engine.css", "deck.css", "w05-fx.css"]);
    const folder = path.dirname(path.join(DECK_DIR, PAGES[lang]));
    for (const m of html.matchAll(/\b(?:src|href)="((?:\.\.?\/)[^"#?]+)"/g)) {
      assert.ok(existsSync(path.resolve(folder, m[1])), `${lang}: ${m[1]} does not exist`);
    }
  });

  test(`${lang}: every appendix slide but a1 is linked from a main slide, and each links back to a main slide`, () => {
    const targets = {};
    for (const s of slidesOf(pages[lang])) {
      const walk = (node) => {
        if (!node.tag) return;
        if (node.tag === "a" && node.attrs.href?.startsWith("#")) (targets[s.attrs.id] ??= []).push(node.attrs.href.slice(1));
        for (const child of node.children ?? []) walk(child);
      };
      walk(s);
    }
    const ids = new Set(slidesOf(pages[lang]).map((s) => s.attrs.id));
    for (const [from, tos] of Object.entries(targets)) for (const to of tos) assert.ok(ids.has(to), `${lang}: ${from} links to missing #${to}`);
    for (const a of APPENDIX) {
      const from = Object.entries(targets).filter(([id, tos]) => IDS.includes(id) && tos.includes(a)).map(([id]) => id);
      assert.deepEqual(from, LINKED_FROM[a], `${lang}: ${a} is linked from ${LINKED_FROM[a].join(", ") || "no main slide"} only`);
      const back = targets[a] ?? [];
      assert.deepEqual(back, [LINKS[a]], `${lang}: ${a} links back to ${LINKS[a]}`);
    }
  });
}

test("the presenter pages do not load the deck stylesheets or the W05 scripts", () => {
  for (const file of ["presenter.html", "en/presenter.html"]) {
    const html = readFileSync(path.join(DECK_DIR, file), "utf8");
    assert.doesNotMatch(html, /w05-fx\.css|deck\.css|w05-[a-z]+\.js/, file);
  }
});

test("both editions have the same ids and the same number of steps per slide", () => {
  const shape = (lang) => slidesOf(pages[lang]).map((s) => `${s.attrs.id}:${s.attrs["data-step-total"]}:${s.attrs["data-seconds"]}`);
  assert.deepEqual(shape("de"), shape("en"));
});
