/**
 * Workshop 05 deck, the words rule. Reads the BUILT pages (slides.html, en/slides.html), not deck-copy.json.
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
import { BANNED } from "../workshop05/deck-src/build.mjs";
import { countDeck } from "../workshop05/deck-src/count-words.mjs";
import {
  LANGS,
  classesOf,
  hasClass,
  mainSlides,
  notesOf,
  readPage,
  slidesOf,
  stepsOf,
  tokensIn,
  visibleMatches,
  withoutNotes,
} from "../workshop05/deck-src/deck-html.mjs";

const ids = ["cover", "doors", "papers", "letter", "clock", "plan", "ghost", "neighbour", "table", "drawer", "tests", "status", "forward", "step1", "step2", "xray", "step3", "ladder", "judge", "visit", "after", "taxsheet", "isosheet", "notmeasured", "transfer", "close"];

/** The counted words per press state of each main slide (the deck's design numbers; the rule is in the header). */
const COUNTS = {
  en: {
    cover: [11], doors: [2, 13, 24, 22], papers: [6, 1, 2, 9, 15, 14], letter: [13, 17, 20, 24, 23], clock: [9, 24, 19, 23],
    plan: [6, 13, 18, 19, 16], ghost: [8, 8, 17, 22], neighbour: [13, 15, 19, 23, 21], table: [6, 8, 20], drawer: [4, 16, 20],
    tests: [9, 15, 24], status: [5, 12, 19, 19], forward: [2, 4, 4, 4, 20, 18], step1: [14, 25, 23], step2: [5, 23, 20, 23, 23],
    xray: [14, 12, 14, 18, 22, 25], step3: [5, 23, 24, 22, 22, 23], ladder: [22, 25, 25, 19, 25, 19], judge: [13, 17, 22],
    visit: [14, 14, 19, 14, 17, 22, 13], after: [15, 6, 24, 23], taxsheet: [25, 16, 24, 19, 23, 15, 18, 17],
    isosheet: [24, 25, 19, 19, 17, 22], notmeasured: [6, 11], transfer: [5, 9, 11, 13, 15, 18, 24], close: [20, 11, 5, 6],
  },
  de: {
    cover: [10], doors: [2, 11, 20, 19], papers: [5, 1, 2, 7, 14, 12], letter: [12, 16, 19, 23, 18], clock: [9, 24, 19, 22],
    plan: [7, 14, 19, 20, 17], ghost: [6, 6, 16, 21], neighbour: [11, 13, 17, 22, 21], table: [7, 9, 20], drawer: [4, 15, 18],
    tests: [9, 15, 24], status: [5, 13, 20, 18], forward: [3, 5, 5, 5, 21, 21], step1: [13, 24, 19], step2: [6, 24, 21, 25, 21],
    xray: [11, 9, 11, 15, 18, 19], step3: [5, 23, 24, 22, 21, 21], ladder: [23, 24, 23, 16, 21, 14], judge: [13, 17, 20],
    visit: [12, 12, 15, 12, 15, 20, 12], after: [15, 6, 20, 22], taxsheet: [20, 13, 21, 18, 24, 12, 18, 14],
    isosheet: [23, 22, 16, 19, 16, 21], notmeasured: [5, 10], transfer: [5, 8, 10, 13, 15, 18, 24], close: [18, 10, 3, 4],
  },
};

const GLOSS_CAP = { en: 12, de: 14 };
const pages = Object.fromEntries(LANGS.map((lang) => [lang, readPage(lang)]));
const slide = (lang, id) => {
  const found = slidesOf(pages[lang]).find((s) => s.attrs.id === id);
  assert.ok(found, `${lang}: slide ${id}`);
  return found;
};
const textAt = (lang, id, k) => countDeck(pages[lang]).find((s) => s.id === id).states[k].join(" ");

for (const lang of LANGS) {
  test(`${lang}: 26 main slides in the designed order, then five appendix slides`, () => {
    const all = slidesOf(pages[lang]);
    assert.deepEqual(mainSlides(pages[lang]).map((s) => s.attrs.id), ids);
    assert.deepEqual(all.slice(26).map((s) => s.attrs.id), ["a1", "a2", "a3", "a4", "a5"]);
    assert.ok(all.slice(26).every((s) => s.attrs["data-kind"] === "appendix"));
  });

  test(`${lang}: at most 25 counted words in every press state of every main slide`, () => {
    for (const s of countDeck(pages[lang]).filter((x) => x.kind === "main")) {
      s.states.forEach((tokens, k) => assert.ok(tokens.length <= 25, `${lang} ${s.id} press ${k}: ${tokens.length} words: ${tokens.join(" ")}`));
    }
  });

  test(`${lang}: the counted words per press state are the designed counts, slide by slide`, () => {
    const counted = Object.fromEntries(countDeck(pages[lang]).filter((x) => x.kind === "main").map((s) => [s.id, s.states.map((t) => t.length)]));
    assert.deepEqual(Object.keys(counted), ids);
    for (const id of ids) assert.deepEqual(counted[id], COUNTS[lang][id], `${lang} ${id}`);
  });

  test(`${lang}: appendix slides have at most 60 counted words`, () => {
    for (const s of countDeck(pages[lang]).filter((x) => x.kind === "appendix")) {
      assert.ok(s.states[0].length <= 60, `${lang} ${s.id}: ${s.states[0].length} words`);
    }
  });

  test(`${lang}: exempt classes keep their caps (gloss, prompt, figure cells, output lines, focus)`, () => {
    for (const section of slidesOf(pages[lang])) {
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
        assert.ok(outs.length <= 16, `${lang} ${id} press ${k}: ${outs.length} output lines`);
        for (const o of outs) assert.ok(tokensIn(o).length <= 16, `${lang} ${id} press ${k}: output line of ${tokensIn(o).length} words`);
        for (const f of visibleMatches(section, k, (n) => hasClass(n, "focus"))) {
          assert.ok(tokensIn(f).length <= 12, `${lang} ${id} press ${k}: focus text of ${tokensIn(f).length} words`);
        }
      }
      assert.ok(promptsSeen <= 1, `${lang} ${id}: ${promptsSeen} prompt cards at once`);
      if (!main) assert.equal(promptsSeen, 0);
    }
  });

  test(`${lang}: sources, translations and invented labels are visible text, never focus-only`, () => {
    for (const section of slidesOf(pages[lang])) {
      const id = section.attrs.id;
      const everywhere = (match) => visibleMatches(section, stepsOf(section), match, { nested: true });
      // A source tag or a gloss is its own element and must not sit inside a focus extra or be one.
      const walk = (node, inFocus) => {
        if (!node.tag) return;
        const here = inFocus || hasClass(node, "focus");
        if (here && (hasClass(node, "src") || hasClass(node, "qd-gloss"))) assert.fail(`${lang} ${id}: a source or translation is a focus extra`);
        for (const child of node.children ?? []) walk(child, here);
      };
      walk(section, false);
      // Every quoted line in another language than the page has its translation in the same main slide. The appendix
      // tables name laws by their Macedonian title in a row that already says what the law is.
      if (section.attrs["data-kind"] === "main") {
        const quotes = everywhere((n) => hasClass(n, "qd"));
        const foreign = quotes.filter((q) => (q.attrs.lang ? q.attrs.lang !== lang : /[\u0400-\u04FF]/.test(tokensIn(q).join(" "))));
        const glosses = everywhere((n) => hasClass(n, "qd-gloss"));
        if (foreign.length > 0) assert.ok(glosses.length >= 1, `${lang} ${id}: a foreign quote without a translation`);
      }
      // Nothing that carries the word invented may be a focus extra.
      for (const f of visibleMatches(section, stepsOf(section), (n) => hasClass(n, "focus"), { nested: true })) {
        assert.doesNotMatch(tokensIn(f).join(" "), /invented|erfunden|\b(19|20)\d\d\b/i, `${lang} ${id}: a qualifier inside a focus extra`);
      }
    }
  });

  test(`${lang}: the numbers carry their qualifier in visible text`, () => {
    const en = lang === "en";
    const must = (id, k, pattern, what) => assert.match(textAt(lang, id, k), pattern, `${lang} ${id} press ${k}: ${what}`);
    must("doors", 1, /2024/, "31 building site visits carry their year");
    must("doors", 2, /2025/, "214 businesses carry their year");
    must("letter", 0, en ? /invented/ : /erfunden/, "the company is labelled invented");
    must("letter", 3, /\(2022\)/, "84 of 100 firms carry the survey year");
    must("neighbour", 0, /2025/, "the DIT counts carry the report year");
    must("neighbour", 0, /April 2026/, "the report carries its version date");
    must("ghost", 2, en ? /size assumed/ : /Größe angenommen/, "the fine carries its assumption");
    must("ghost", 2, /ZIN Art\. 83/, "the fine carries its article");
    must("taxsheet", 0, /2023/, "the survey share carries its year");
    must("taxsheet", 5, en ? /2025, derived/ : /2025, errechnet/, "the inspector hours are marked derived");
    must("taxsheet", 6, en ? /2025, derived/ : /2025, errechnet/, "the payment order is marked derived");
    must("isosheet", 3, /2024/, "the consultancy price carries its year");
    must("isosheet", 3, en ? /advert/ : /Werbung/, "the consultancy price carries its source");
    must("step3", 3, en ? /invented/ : /erfunden/, "the visit date is labelled invented");
    must("step2", 3, en ? /invented example, not a recording/ : /erfundenes Beispiel, keine Aufzeichnung/, "the example is labelled");
    for (let k = 0; k <= 5; k += 1) {
      must("xray", k, en ? /Computed from the kit files\. Not a Claude run\./ : /Aus den Kit-Dateien gerechnet\. Kein Claude-Lauf\./, "the script output says what it is");
    }
    must("step3", 2, en ? /Computed from the kit/ : /Aus dem Kit gerechnet/, "the tally says it is computed");
    must("step1", 1, en ? /computed from the kit/ : /aus dem Kit gerechnet/i, "the expected table says it is computed");
  });

  test(`${lang}: no AI answer is shown as recorded, the empty frame says so`, () => {
    const frame = lang === "en" ? /Your Claude result: not recorded yet\./ : /Dein Claude-Ergebnis: noch nicht aufgezeichnet\./;
    assert.match(textAt(lang, "step1", 2), frame);
    assert.match(textAt(lang, "step2", 4), frame);
    assert.match(textAt(lang, "step3", 4), frame);
    const html = withoutNotes(pages[lang]);
    assert.doesNotMatch(html, /claude-runs|recorded run|Aufzeichnung vom|recorded on/i);
  });

  test(`${lang}: no banned word, no dash character and no arrow on slides or in notes, real umlauts`, () => {
    const html = pages[lang];
    const slides = withoutNotes(html);
    for (const pattern of BANNED) {
      const hit = pattern.exec(slides);
      assert.equal(hit, null, `${lang}: banned ${JSON.stringify(hit?.[0])} on a slide`);
    }
    assert.doesNotMatch(html, /[‒-―−→]/, `${lang}: a dash or an arrow in slides or notes`);
    // The notes obey the same bans as the slides.
    for (const note of notesOf(html)) {
      for (const pattern of BANNED) assert.equal(pattern.exec(note), null, `${lang}: banned ${JSON.stringify(pattern.exec(note)?.[0])} in note ${note.slice(0, 30)}`);
    }
    if (lang === "de") {
      const text = slides.replace(/<[^>]+>/g, " ");
      assert.doesNotMatch(text, /\b(fuer|ueber|Pruefung\w*|Aenderung\w*|Loehr|Gebuehr\w*|Aerzt\w*|Uebung\w*|Buero\w*|Groesse|koennen|moechte|muessen|waehrend)\b/i, "an ASCII substitute for an umlaut");
    }
    assert.doesNotMatch(html, /\/Users\/|\/private\/|mavengence|facilitator\/|CLAUDE\.md|vardar|tannwald/i);
  });

  test(`${lang}: the class lists of exempt elements never hide counted text behind an exempt wrapper`, () => {
    // An exempt class is for quotes, translations, prompt cards, figure cells, script output and focus extras only:
    // a poll button or a counter inside one would escape the count.
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
