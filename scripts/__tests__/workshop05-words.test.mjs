/**
 * Workshop 05 deck, the words rule. Reads the BUILT pages (slides.html, en/slides.html), not deck-copy.json, and builds the
 * two chip variants of a recorded take in memory from synthetic recordings (fixture-takes.mjs).
 * For every main slide and every press state it counts the visible tokens (a token holds a letter or a digit; the classes
 * qd, qd-gloss, prompt-body, fig, out and focus are exempt; poll counters and numerals count), and asserts:
 *  - at most 25 per press state, in both languages, and the exact counts the deck was designed to (the printed counts);
 *  - the caps of the exempt classes (gloss 12 EN and 14 DE, prompt 150 words and one per slide, 15 figure cells per
 *    slide, output 16 lines of at most 16 words, focus 12 words, appendix slides at most 60 counted words);
 *  - that sources, translations and qualifiers are visible text, never focus-only, and the qualifiers of the numbers;
 *  - the banned words and the dash and arrow ban on all slide text and all notes.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { BANNED, buildEdition } from "../workshop05/deck-src/build.mjs";
import { countDeck } from "../workshop05/deck-src/count-words.mjs";
import { deckData } from "../workshop05/deck-src/data.mjs";
import { fixtureTakes } from "../workshop05/deck-src/fixture-takes.mjs";
import {
  LANGS,
  classesOf,
  hasClass,
  mainSlides,
  notesOf,
  readPage,
  showsAt,
  slidesOf,
  stepsOf,
  tokensIn,
  visibleMatches,
  withoutNotes,
} from "../workshop05/deck-src/deck-html.mjs";

const ids = ["cover", "today", "why", "sectors", "we", "letter", "time", "kit", "step1", "step2", "tests", "step3", "register", "watch", "safety", "close"];

/** The counted words per press state of each main slide (SPEC-2 2.3; the rule is in the header). A null is a press that shows a
 *  recorded take: its count depends on the chip variant and is asserted by the fixture tests below. */
const COUNTS = {
  en: {
    cover: [12], today: [1, 1, 1, 22], why: [17, 23, 16, 18, 18, 22, 19, 12], sectors: [20, 22, 20, 22, 19], we: [14, 18, 22, 23],
    letter: [16, 18, 22, 22, 18, 20, 14, 21], time: [19, 17, 20, 23], kit: [11, 15, 17, 24], step1: [17, 25, null], step2: [17, 19, null],
    tests: [7, 7, 11, 23, 20], step3: [17, null, 14, 22], register: [23, 17, null, 10, 18, 12, null, 14],
    watch: [16, 21, 22, 16, 20], safety: [17, 17, 23, 21, 19, 12], close: [21, 24, 8],
  },
  de: {
    cover: [10], today: [1, 1, 1, 22], why: [14, 22, 14, 15, 17, 21, 17, 11], sectors: [18, 21, 18, 21, 18], we: [12, 18, 19, 23],
    letter: [13, 19, 22, 20, 18, 21, 14, 20], time: [17, 17, 20, 23], kit: [10, 16, 15, 22], step1: [16, 25, null], step2: [18, 20, null],
    tests: [7, 7, 11, 22, 18], step3: [16, null, 14, 20], register: [22, 16, null, 9, 18, 13, null, 16],
    watch: [15, 18, 19, 16, 20], safety: [16, 17, 24, 22, 21, 10], close: [20, 24, 9],
  },
};
/** The counted words of the take presses with the chip of a take that matches the key (the chip is a figure cell: it is not counted). */
const TAKE_COUNTS = {
  en: { step1: { 2: 19 }, step2: { 2: 19 }, step3: { 1: 15 }, register: { 2: 17, 6: 17 } },
  de: { step1: { 2: 19 }, step2: { 2: 19 }, step3: { 1: 15 }, register: { 2: 18, 6: 16 } },
};

const GLOSS_CAP = { en: 12, de: 14 };
const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));
const slide = (lang, id) => {
  const found = slidesOf(pages[lang]).find((s) => s.attrs.id === id);
  assert.ok(found, `${lang}: slide ${id}`);
  return found;
};
const textAt = (lang, id, k) => countDeck(pages[lang]).find((s) => s.id === id).states[k].join(" ");
/** Every visible word at a press, figure cells and recorded lines included (a qualifier may sit in a label on the drawing). */
function visibleTextAt(html, id, k) {
  const section = slidesOf(html).find((x) => x.attrs.id === id);
  const out = [];
  const walk = (n) => {
    if (n.text !== undefined) return void out.push(n.text);
    if (!n.tag || ["svg", "script", "style"].includes(n.tag) || !showsAt(n, k)) return;
    (n.children ?? []).forEach(walk);
  };
  (section.children ?? []).forEach(walk);
  return out.join(" ").replace(/\s+/g, " ");
}
/** Recorded lines are real model output: outside the banned-word and dash scans (our own copy is not). */
const withoutTakes = (html) => html.replace(/<(p|tr)\b[^>]*data-take="[^"]*"[^>]*>[\s\S]*?<\/\1>/g, "");
const counted = (html) => Object.fromEntries(countDeck(html).filter((x) => x.kind === "main").map((s) => [s.id, s.states.map((t) => t.length)]));

for (const lang of LANGS) {
  test(`${lang}: 16 main slides in the designed order, then four appendix slides`, () => {
    const all = slidesOf(pages[lang]);
    assert.deepEqual(mainSlides(pages[lang]).map((s) => s.attrs.id), ids);
    assert.deepEqual(all.slice(16).map((s) => s.attrs.id), ["a1", "a2", "a3", "a4"]);
    assert.ok(all.slice(16).every((s) => s.attrs["data-kind"] === "appendix"));
  });

  test(`${lang}: at most 25 counted words in every press state of every main slide`, () => {
    for (const s of countDeck(pages[lang]).filter((x) => x.kind === "main")) {
      s.states.forEach((tokens, k) => assert.ok(tokens.length <= 25, `${lang} ${s.id} press ${k}: ${tokens.length} words: ${tokens.join(" ")}`));
    }
  });

  test(`${lang}: the counted words per press state are the designed counts, slide by slide`, () => {
    const got = counted(pages[lang]);
    assert.deepEqual(Object.keys(got), ids);
    for (const id of ids) {
      const want = COUNTS[lang][id];
      assert.equal(got[id].length, want.length, `${lang} ${id}: press count`);
      want.forEach((n, k) => {
        if (n === null) return;
        assert.equal(got[id][k], n, `${lang} ${id} press ${k}`);
      });
    }
  });

  test(`${lang}: both chip variants of a recorded take stay within 25 counted words and the designed counts`, () => {
    const d = deckData(lang);
    const same = counted(buildEdition(lang, d, fixtureTakes(lang, { d })));
    const differs = counted(buildEdition(lang, d, fixtureTakes(lang, { d, differs: true })));
    for (const [id, presses] of Object.entries(TAKE_COUNTS[lang])) {
      for (const [k, printed] of Object.entries(presses)) {
        assert.equal(same[id][k], printed, `${lang} ${id} press ${k}: the take that matches the key`);
        assert.ok(differs[id][k] <= 25, `${lang} ${id} press ${k}: ${differs[id][k]} words when the take differs from the key`);
      }
    }
    for (const html of [counted(buildEdition(lang, d, fixtureTakes(lang, { d })))]) {
      for (const [id, states] of Object.entries(html)) states.forEach((n, k) => assert.ok(n <= 25, `${lang} ${id} press ${k}: ${n}`));
    }
    // outside the take presses nothing changes
    for (const id of ids) COUNTS[lang][id].forEach((n, k) => n !== null && assert.equal(same[id][k], n, `${lang} ${id} press ${k} with takes`));
  });

  test(`${lang}: appendix slides have at most 60 counted words`, () => {
    for (const s of countDeck(pages[lang]).filter((x) => x.kind === "appendix")) {
      assert.ok(s.states[0].length <= 60, `${lang} ${s.id}: ${s.states[0].length} words`);
    }
  });

  test(`${lang}: exempt classes keep their caps (gloss, prompt, figure cells, output lines, focus)`, () => {
    for (const html of [pages[lang], buildEdition(lang, deckData(lang), fixtureTakes(lang))]) {
      for (const section of slidesOf(html)) {
        const id = section.attrs.id;
        const main = section.attrs["data-kind"] === "main";
        let promptsSeen = 0;
        for (let k = 0; k <= stepsOf(section); k += 1) {
          for (const g of visibleMatches(section, k, (n) => hasClass(n, "qd-gloss"))) {
            assert.ok(tokensIn(g).length <= GLOSS_CAP[lang], `${lang} ${id} press ${k}: gloss of ${tokensIn(g).length} words`);
          }
          const prompts = visibleMatches(section, k, (n) => hasClass(n, "prompt-body"));
          promptsSeen = Math.max(promptsSeen, prompts.length);
          for (const p of prompts) assert.ok(tokensIn(p).length <= 150, `${lang} ${id}: prompt of ${tokensIn(p).length} words`);
          const figs = visibleMatches(section, k, (n) => hasClass(n, "fig"));
          assert.ok(figs.length <= 15, `${lang} ${id} press ${k}: ${figs.length} figure cells`);
          const outs = visibleMatches(section, k, (n) => hasClass(n, "out"));
          // a recorded answer is at most 16 recorded lines; a line longer than 16 words is shown as several rows of at most 16 words
          for (const o of outs) assert.ok(tokensIn(o).length <= 16, `${lang} ${id} press ${k}: output line of ${tokensIn(o).length} words`);
          const lines = new Set(outs.map((o) => o.attrs["data-line"]).filter(Boolean));
          assert.ok(lines.size <= 16, `${lang} ${id} press ${k}: ${lines.size} recorded lines`);
          for (const f of visibleMatches(section, k, (n) => hasClass(n, "focus"))) {
            assert.ok(tokensIn(f).length <= 12, `${lang} ${id} press ${k}: focus text of ${tokensIn(f).length} words`);
          }
        }
        assert.ok(promptsSeen <= 1, `${lang} ${id}: ${promptsSeen} prompt cards at once`);
        if (!main) assert.equal(promptsSeen, 0);
      }
    }
  });

  test(`${lang}: sources, translations and invented labels are visible text, never focus-only`, () => {
    for (const section of slidesOf(pages[lang])) {
      const id = section.attrs.id;
      const everywhere = (match) => visibleMatches(section, stepsOf(section), match, { nested: true });
      const walk = (node, inFocus) => {
        if (!node.tag) return;
        const here = inFocus || hasClass(node, "focus");
        if (here && (hasClass(node, "src") || hasClass(node, "qd-gloss"))) assert.fail(`${lang} ${id}: a source or translation is a focus extra`);
        for (const child of node.children ?? []) walk(child, here);
      };
      walk(section, false);
      if (section.attrs["data-kind"] === "main") {
        const quotes = everywhere((n) => hasClass(n, "qd"));
        const foreign = quotes.filter((q) => (q.attrs.lang ? q.attrs.lang !== lang : /[\u0400-\u04FF]/.test(tokensIn(q).join(" "))));
        const glosses = everywhere((n) => hasClass(n, "qd-gloss"));
        if (foreign.length > 0) assert.ok(glosses.length >= 1, `${lang} ${id}: a foreign quote without a translation`);
      }
      for (const f of visibleMatches(section, stepsOf(section), (n) => hasClass(n, "focus"), { nested: true })) {
        assert.doesNotMatch(tokensIn(f).join(" "), /invented|erfunden|\b(19|20)\d\d\b/i, `${lang} ${id}: a qualifier inside a focus extra`);
      }
    }
  });

  test(`${lang}: the numbers carry their qualifier in visible text`, () => {
    const en = lang === "en";
    const must = (id, k, pattern, what) => assert.match(visibleTextAt(pages[lang], id, k), pattern, `${lang} ${id} press ${k}: ${what}`);
    must("cover", 0, en ? /invented/ : /erfunden/, "the case is labelled invented");
    // builder 2 (REDESIGN-3 D4): the evidence act was rebuilt, so the presses that carry each qualifier moved
    must("why", 0, /2025/, "the 26,484 inspections carry their year");
    must("why", 0, /DIT/, "the 26,484 inspections carry their source");
    // fix round 2: the kinds and the decisions share one press (5), so the regions are press 6 and Bitola press 7
    must("why", 5, en ? /own calculation/ : /eigene Rechnung/, "one decision in four is marked as our own calculation");
    must("why", 1, /2026/, "the first news card carries its date");
    must("why", 2, /2024/, "the heat wave card carries its year");
    must("why", 6, /OpenStreetMap/, "the places of the regions carry their gazetteer");
    must("we", 0, en ? /invented/ : /erfunden/, "the firm is labelled invented");
    must("we", 2, /2026/, "the risk ladder carries the year of its plan");
    must("we", 3, /2025/, "the complaints carry their year");
    must("letter", 0, en ? /invented/ : /erfunden/, "the letter case is labelled invented");
    must("letter", 3, /Law on Inspection Supervision|Gesetz über die Inspektionsaufsicht/, "the three working days carry their law");
    must("letter", 5, /Art\. 83/, "the fine carries its article");
    must("time", 2, en ? /recorded|not recorded yet/ : /aufgezeichnet/, "the step times say they come from a recording, or that there is none");
    must("tests", 0, en ? /invented/ : /erfunden/, "the example row is labelled invented");
    must("sectors", 0, /2024/, "the firm count carries its year");
    must("sectors", 3, en ? /own calculation/ : /eigene Rechnung/, "the informal shares are marked as our own calculation");
    must("register", 3, en ? /Dates only/ : /Nur Daten/, "the register says it holds dates, no health content");
    // REDESIGN-3 D4: the plan facts carry their source and date, the watch list its check date, the kit facts theirs
    must("kit", 2, en ? /Anthropic help centre, 6 Nov 2026/ : /Anthropic-Hilfe, 6\. Nov\. 2026/, "the first-use steps carry their source");
    must("watch", 1, en ? /no monthly option/i : /Keine monatliche Option/, "the weekly schedule says it has no monthly option");
    must("watch", 1, en ? /Anthropic help centre, 5 Nov 2026/ : /Anthropic-Hilfe, 5\. Nov\. 2026/, "the plan facts carry their source");
    must("watch", 3, en ? /checked 8 Nov 2026/ : /geprüft am 8\. Nov\. 2026/, "the watch list carries its check date");
    must("safety", 4, en ? /never creates, changes or backdates/ : /nie einen Nachweis an, ändert oder rückdatiert/, "the record rule is on the never press");
    must("safety", 5, en ? /effective 12 Nov 2026/ : /gültig ab 12\. Nov\. 2026/, "the Usage Policy carries its date");
    const html = withoutTakes(pages[lang]);
    assert.match(html, en ? /Gradba audit \(invented\)/ : /Gradba-Audit \(erfunden\)/, "the Claude window is labelled as an invented case");
  });

  test(`${lang}: no recorded answer is shown without a take: the empty frame says so, or the take carries its chip`, () => {
    const html = pages[lang];
    const frame = lang === "en" ? /Your Claude result: not recorded yet\./ : /Dein Claude-Ergebnis: noch nicht aufgezeichnet\./;
    const chip = lang === "en" ? /recorded \d{1,2} \w+ \d{4}, / : /aufgezeichnet \d\d\.\d\d\.\d{4}, /;
    for (const [id, k] of [["step1", 2], ["step2", 2], ["step3", 1], ["register", 2], ["register", 6]]) {
      const section = slide(lang, id);
      const hasTake = /"data-take":"/.test(JSON.stringify(section));
      assert.match(visibleTextAt(html, id, k), hasTake ? chip : frame, `${lang} ${id} press ${k}`);
    }
    assert.doesNotMatch(withoutTakes(html), /claude-runs|Aufzeichnung vom/i);
  });

  test(`${lang}: no banned word, no dash character and no arrow on slides or in notes, real umlauts`, () => {
    for (const html of [pages[lang], buildEdition(lang, deckData(lang), fixtureTakes(lang))]) {
      const slides = withoutTakes(withoutNotes(html));
      for (const pattern of BANNED) {
        const hit = pattern.exec(slides);
        assert.equal(hit, null, `${lang}: banned ${JSON.stringify(hit?.[0])} on a slide`);
      }
      assert.doesNotMatch(withoutTakes(html), /[‒-―−→]/, `${lang}: a dash or an arrow in slides or notes`);
      for (const note of notesOf(html)) {
        for (const pattern of BANNED) assert.equal(pattern.exec(note), null, `${lang}: banned ${JSON.stringify(pattern.exec(note)?.[0])} in note ${note.slice(0, 30)}`);
      }
      if (lang === "de") {
        // file names of the kit are what they are (AENDERUNGEN.md): only prose is checked
        const text = slides.replace(/<[^>]+>/g, " ").replace(/\b[\w-]+\.(md|csv|py|zip|txt)\b/g, " ");
        assert.doesNotMatch(text, /\b(fuer|ueber|Pruefung\w*|Aenderung\w*|Loehr|Gebuehr\w*|Aerzt\w*|Uebung\w*|Buero\w*|Groesse|koennen|moechte|muessen|waehrend)\b/i, "an ASCII substitute for an umlaut");
      }
      assert.doesNotMatch(html, /\/Users\/|\/private\/|mavengence|facilitator\/|CLAUDE\.md|vardar works|tannwald|Vier Tage bis zur Kontrolle/i);
    }
  });

  test(`${lang}: the class lists of exempt elements never hide counted text behind an exempt wrapper`, () => {
    for (const section of slidesOf(pages[lang])) {
      const walk = (node, exempt) => {
        if (!node.tag) return;
        const here = exempt || classesOf(node).some((c) => ["qd", "qd-gloss", "prompt-body", "fig", "out", "focus"].includes(c));
        if (here && node.attrs?.["data-poll"] !== undefined) assert.fail(`${lang} ${section.attrs.id}: a poll button inside an exempt element`);
        if (here && node.attrs?.["data-poll-n"] !== undefined) assert.fail(`${lang} ${section.attrs.id}: a poll counter inside an exempt element`);
        for (const child of node.children ?? []) walk(child, here);
      };
      walk(section, false);
    }
  });
}
