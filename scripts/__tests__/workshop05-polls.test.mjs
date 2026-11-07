/**
 * Workshop 05 deck, structure and polls. Reads the BUILT pages (both editions and both presenter pages):
 *  - 26 main slides with their ids, minutes and labels, 5400 seconds, five appendix slides, 31 notes per edition;
 *  - the nine polls, each name on exactly one slide, with their button counts, values and labels;
 *  - ghost bars read the polls they should, and the plain show-of-hands questions have no buttons;
 *  - the five W05 scripts after the engine scripts in the designed order, no inline script, no key handler of ours,
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

const IDS = ["cover", "doors", "papers", "letter", "clock", "plan", "ghost", "neighbour", "table", "drawer", "tests", "status", "forward", "step1", "step2", "xray", "step3", "ladder", "judge", "visit", "after", "taxsheet", "isosheet", "notmeasured", "transfer", "close"];
const MINUTES = [1, 2, 2, 2, 3, 3, 3, 3, 3, 1, 3, 3, 3, 5, 7, 4, 6, 4, 2, 3, 3, 4, 4, 2, 6, 8];
/** Slides per act (Act 0 to Act 6) and the minutes of each act. */
const ACT_SLIDES = [3, 3, 2, 5, 4, 4, 5];
const ACT_MINUTES = [5, 8, 6, 13, 22, 12, 24];

const LABELS = {
  en: ["Cover", "Three doors", "Papers and a vote", "The letter", "The clock", "Elena's plan", "Edit a date", "The other 54 percent", "The inspector's list", "Where each paper lives", "Four tests per paper", "COVERED, WEAK or GAP", "Fix forward", "Tuesday, step 1: make the table", "Wednesday, step 2: run the check", "Wednesday: X-ray of the folder", "Thursday, step 3: plan and briefing", "The data ladder", "Two lawyers and an AI", "The visit", "After the visit", "Case B: the tax control", "Case C: ISO audits", "What we found no number for", "Your own sheet", "Which check now"],
  de: ["Titel", "Drei Türen", "Papiere und Abstimmung", "Der Brief", "Die Uhr", "Elenas Plan", "Ein Datum ändern", "Die anderen 54 Prozent", "Die Liste des Inspektors", "Wo jedes Papier liegt", "Vier Prüfungen pro Papier", "BELEGT, SCHWACH oder LÜCKE", "Nach vorne reparieren", "Dienstag, Schritt 1: die Tabelle bauen", "Mittwoch, Schritt 2: den Check laufen lassen", "Mittwoch: Röntgenbild des Ordners", "Donnerstag, Schritt 3: Plan und Briefing", "Die Datenleiter", "Zwei Anwälte und eine KI", "Der Besuch", "Nach dem Besuch", "Fall B: die Steuerprüfung", "Fall C: ISO-Audits", "Wofür wir keine Zahl fanden", "Dein eigenes Blatt", "Welche Kontrolle jetzt"],
};

/** Poll name, the slide it lives on, and the button labels per language (values count from 0 in this order). */
const POLLS = {
  door: { slide: "papers", en: ["Labour", "Tax", "Certifier", "Not sure"], de: ["Arbeit", "Steuer", "Zertifizierer", "Unsicher"] },
  clock: { slide: "clock", en: ["Yes", "No"], de: ["Ja", "Nein"] },
  plan: { slide: "plan", en: ["Fine", "Not sure", "No"], de: ["In Ordnung", "Unsicher", "Nein"] },
  "plan-after": { slide: "forward", en: ["Fine", "Not sure", "No"], de: ["In Ordnung", "Unsicher", "Nein"] },
  findings: { slide: "step2", en: ["6", "10", "15", "20"], de: ["6", "10", "15", "20"] },
  tally: { slide: "step3", en: ["0 to 1", "2", "3 to 5", "6 to 13"], de: ["0 bis 1", "2", "3 bis 5", "6 bis 13"], key: 1 },
  ladder: { slide: "ladder", en: ["Public text", "Invented rows only", "AI writes, you run", "Real data: four gates"], de: ["Öffentlicher Text", "Nur erfundene Zeilen", "KI schreibt, du führst aus", "Echte Daten: vier Tore"] },
  appeal: { slide: "after", en: ["8 days", "15 days", "30 days", "Not possible"], de: ["8 Tage", "15 Tage", "30 Tage", "Nicht möglich"], key: 1 },
  "door-end": { slide: "close", en: ["Labour", "Tax", "Certifier", "Not sure"], de: ["Arbeit", "Steuer", "Zertifizierer", "Unsicher"] },
};

/** Ghost bars: the slide that shows them and the poll they read. */
const SHOWS = [
  { slide: "forward", reads: "plan" },
  { slide: "xray", reads: "findings" },
  { slide: "close", reads: "door" },
];

/** Plain shows of hands: no buttons, no counters. */
const HANDS_ONLY = ["ghost", "taxsheet", "isosheet", "notmeasured"];

const SCRIPT_ORDER = ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js", "w05-tally.js", "w05-clock.js", "w05-matrix.js", "w05-days.js", "w05-gates.js"];

const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));
const classOf = (node) => (node.attrs?.class ?? "").split(/\s+/);
/** The visible label of a poll button: its text without the counter. */
const labelOf = (button) => {
  const words = (node) => (node.text !== undefined ? tokensIn(node) : node.attrs?.["data-poll-n"] !== undefined ? [] : (node.children ?? []).flatMap(words));
  return words(button).join(" ");
};
const slideIn = (lang, id) => slidesOf(pages[lang]).find((s) => s.attrs.id === id);

test("the designed minutes add up to 90 and the acts to 5, 8, 6, 13, 22, 12, 24", () => {
  assert.equal(ACT_SLIDES.reduce((a, b) => a + b, 0), 26);
  assert.equal(MINUTES.reduce((a, b) => a + b, 0), 90);
  let from = 0;
  const perAct = ACT_SLIDES.map((n) => {
    const sum = MINUTES.slice(from, from + n).reduce((a, b) => a + b, 0);
    from += n;
    return sum;
  });
  assert.deepEqual(perAct, ACT_MINUTES);
});

for (const lang of LANGS) {
  test(`${lang}: 26 main slides with the designed ids, minutes and labels, 5400 seconds in all`, () => {
    const main = mainSlides(pages[lang]);
    assert.deepEqual(main.map((s) => s.attrs.id), IDS);
    assert.deepEqual(main.map((s) => Number(s.attrs["data-seconds"]) / 60), MINUTES);
    assert.equal(main.reduce((sum, s) => sum + Number(s.attrs["data-seconds"]), 0), 5400);
    assert.deepEqual(main.map((s) => s.attrs["data-label"]), LABELS[lang]);
  });

  test(`${lang}: data-kind is only main or appendix, appendix slides carry 0 seconds and the ids a1 to a5`, () => {
    const all = slidesOf(pages[lang]);
    for (const s of all) assert.ok(["main", "appendix"].includes(s.attrs["data-kind"]), `${s.attrs.id}: kind ${s.attrs["data-kind"]}`);
    const appendix = all.filter((s) => s.attrs["data-kind"] === "appendix");
    assert.deepEqual(appendix.map((s) => s.attrs.id), ["a1", "a2", "a3", "a4", "a5"]);
    for (const s of appendix) assert.equal(s.attrs["data-seconds"], "0");
    assert.equal(all.length, 31);
  });

  test(`${lang}: 31 notes in slide order, each with Time, Say, Students, Cue and Remember, the first line is the label`, () => {
    const notes = notesOf(pages[lang]);
    const all = slidesOf(pages[lang]);
    assert.equal(notes.length, 31);
    notes.forEach((note, i) => {
      assert.match(note, /^(\d\d|a\d) · .+\nTime: .+\nSay: .+\nStudents: .+\nCue: .+\nRemember: .+/s, `${lang} note ${i + 1}`);
      const number = i < 26 ? String(i + 1).padStart(2, "0") : `a${i - 25}`;
      assert.equal(note.split("\n")[0], `${number} · ${all[i].attrs["data-label"]}`);
    });
  });

  test(`${lang}: the nine polls, each name on exactly one slide, with their buttons, values and labels`, () => {
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

  test(`${lang}: ghost bars read the polls plan, findings and door, and show-of-hands slides have no buttons`, () => {
    for (const { slide, reads } of SHOWS) {
      const shows = withAttr(slideIn(lang, slide), "data-poll-show").map((n) => n.attrs["data-poll-show"]);
      assert.ok(shows.includes(reads), `${lang} ${slide} shows poll ${reads}`);
      for (const name of shows) assert.ok(name in POLLS, `${lang} ${slide} reads an existing poll`);
    }
    for (const id of HANDS_ONLY) {
      const s = slideIn(lang, id);
      assert.equal(withAttr(s, "data-poll").length, 0, `${lang} ${id}: buttons on a plain show of hands`);
      assert.equal(withAttr(s, "data-poll-n").length, 0, `${lang} ${id}: a counter on a plain show of hands`);
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
    const inline = [...html.matchAll(/<script\b([^>]*)>/g)].filter((m) => !/\bsrc=/.test(m[1])).map((m) => m[1].trim());
    for (const attrs of inline) assert.match(attrs, /type="application\/json"/, `${lang}: an inline executable script`);
    assert.deepEqual([...html.matchAll(/<script type="application\/json" id="([^"]+)"/g)].map((m) => m[1]).sort(), ["speaker-notes", "w05-matrix"]);
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
    for (const a of ["a1", "a2", "a3", "a4", "a5"]) {
      const from = Object.entries(targets).filter(([id, tos]) => IDS.includes(id) && tos.includes(a)).map(([id]) => id);
      assert.ok(from.length >= 1, `${lang}: no main slide links to ${a}`);
      const back = targets[a] ?? [];
      assert.ok(back.length >= 1 && back.every((to) => IDS.includes(to)), `${lang}: ${a} has no link back to a main slide`);
    }
    assert.ok(targets.clock.includes("a1") && targets.clock.includes("a5") && targets.taxsheet.includes("a1") && targets.neighbour.includes("a3") && targets.notmeasured.includes("a4") && targets.ladder.includes("a2"));
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
