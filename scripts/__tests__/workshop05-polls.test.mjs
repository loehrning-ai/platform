/**
 * Workshop 05 deck, structure and polls. Reads the BUILT pages (both editions and both presenter pages):
 *  - 16 main slides with their ids, minutes and labels (REDESIGN-3 D4), 5400 seconds, four appendix slides, 20 notes per edition;
 *  - the six polls, each name on exactly one slide, with their button counts, values and labels;
 *  - the ghost bars on the close slide read the poll "door";
 *  - the W05 scripts (tally, field, scrub) after the engine scripts, no inline script but the notes, no key handler of ours,
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

const LABELS = {
  en: ["Cover", "Today", "Audits happen here", "Which firms and why", "We are Gradba-Pro", "A visit in four days", "Where is our data?", "Our kit", "Step 1: make the table", "Step 2: run the check", "Four tests, three statuses", "Step 3: status, plan, briefing", "Step 4: build the register", "Stay ready", "Safety: what goes in, who signs", "Which check now"],
  de: ["Titel", "Heute", "Hier wird oft kontrolliert", "Welche Firmen und warum", "Wir sind Gradba-Pro", "Besuch in vier Tagen", "Wo sind unsere Daten?", "Unser Kit", "Schritt 1: die Tabelle bauen", "Schritt 2: den Check laufen lassen", "Vier Prüfungen, drei Status", "Schritt 3: Status, Plan, Briefing", "Schritt 4: das Register bauen", "Bereit bleiben", "Sicherheit: was hinein darf, wer unterschreibt", "Welche Kontrolle jetzt"],
};

/** Poll name, the slide it lives on, and the button labels per language (values count from 0 in this order). */
const POLLS = {
  clock: { slide: "letter", en: ["Yes", "No"], de: ["Ja", "Nein"] },
  finds: { slide: "step2", en: ["6", "10", "14", "20"], de: ["6", "10", "14", "20"] },
  status: { slide: "tests", en: ["COVERED", "WEAK", "GAP"], de: ["BELEGT", "SCHWACH", "LÜCKE"] },
  ladder: { slide: "safety", en: ["Public text", "Invented rows", "AI writes, you run", "Real data, four gates"], de: ["Öffentlicher Text", "Erfundene Zeilen", "KI schreibt, du führst aus", "Echte Daten, vier Tore"] },
  door: { slide: "sectors", en: ["Labour", "Tax", "Certifier", "Not sure"], de: ["Arbeit", "Steuer", "Zertifizierer", "Unsicher"] },
  "door-end": { slide: "close", en: ["Labour", "Tax", "Certifier", "Not sure"], de: ["Arbeit", "Steuer", "Zertifizierer", "Unsicher"] },
};

/** Ghost bars: the slide that shows them and the poll they read. */
const SHOWS = [{ slide: "close", reads: "door" }];

/** Appendix slide, the main slide that links to it (and it links back to). */
const LINKS = { a1: "letter", a2: "safety", a3: "why", a4: "sectors" };

const SCRIPT_ORDER = ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js", "w05-tally.js", "w05-field.js", "w05-scrub.js"];

const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));
const classOf = (node) => (node.attrs?.class ?? "").split(/\s+/);
/** The visible label of a poll button: its text without the counter. */
const labelOf = (button) => {
  const words = (node) => (node.text !== undefined ? tokensIn(node) : node.attrs?.["data-poll-n"] !== undefined ? [] : (node.children ?? []).flatMap(words));
  return words(button).join(" ");
};
const slideIn = (lang, id) => slidesOf(pages[lang]).find((s) => s.attrs.id === id);

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

  test(`${lang}: the six polls, each name on exactly one slide, with their buttons, values and labels`, () => {
    const found = {};
    for (const s of slidesOf(pages[lang])) {
      for (const button of withAttr(s, "data-poll")) {
        (found[button.attrs["data-poll"]] ??= []).push({ slide: s.attrs.id, button });
      }
    }
    assert.deepEqual(Object.keys(found).sort(), Object.keys(POLLS).sort());
    for (const [name, spec] of Object.entries(POLLS)) {
      const buttons = found[name];
      assert.ok(buttons.every((b) => b.slide === spec.slide), `${lang} poll ${name} sits on ${spec.slide} only`);
      assert.equal(buttons.length, spec[lang].length, `${lang} poll ${name}: button count`);
      assert.deepEqual(buttons.map((b) => b.button.attrs["data-value"]), spec[lang].map((_, i) => String(i)), `${lang} poll ${name}: values`);
      assert.deepEqual(buttons.map((b) => labelOf(b.button)), spec[lang], `${lang} poll ${name}: labels`);
      for (const { button } of buttons) {
        assert.equal(button.tag, "button", `${lang} poll ${name}: a real button`);
        assert.equal(withAttr(button, "data-poll-n").length, 1, `${lang} poll ${name}: one counter per button`);
      }
      const keys = buttons.filter((b) => classOf(b.button).includes("is-key")).map((b) => Number(b.button.attrs["data-value"]));
      assert.deepEqual(keys, spec.key === undefined ? [] : [spec.key], `${lang} poll ${name}: is-key marks the answer the slide reveals`);
    }
  });

  test(`${lang}: ghost bars read the poll door, and no poll name or ghost is left over`, () => {
    for (const { slide, reads } of SHOWS) {
      const shows = withAttr(slideIn(lang, slide), "data-poll-show").map((n) => n.attrs["data-poll-show"]);
      assert.ok(shows.includes(reads), `${lang} ${slide} shows poll ${reads}`);
      for (const name of shows) assert.ok(name in POLLS, `${lang} ${slide} reads an existing poll`);
    }
    for (const el of everyElement(pages[lang])) {
      if (el.attrs?.["data-poll-show"] !== undefined) assert.ok(el.attrs["data-poll-show"] in POLLS, `ghost of ${el.attrs["data-poll-show"]}`);
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

  test(`${lang}: every appendix slide is linked from a main slide and links back to a main slide`, () => {
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
      assert.deepEqual(from, [LINKS[a]], `${lang}: ${a} is linked from ${LINKS[a]} only`);
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

test("both editions have the same ids, the same polls and the same number of steps per slide", () => {
  const shape = (lang) => slidesOf(pages[lang]).map((s) => `${s.attrs.id}:${s.attrs["data-step-total"]}:${s.attrs["data-seconds"]}`);
  assert.deepEqual(shape("de"), shape("en"));
});
