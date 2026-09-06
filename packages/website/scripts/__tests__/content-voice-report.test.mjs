import assert from "node:assert/strict";
import test from "node:test";

import {
  countWords,
  extractProseUnits,
  splitParagraphs,
  splitSentences,
} from "../content-prose.mjs";
import {
  aggregateBySurface,
  analyzeCorpus,
  finishAggregate,
  parseArgs,
  pathMatcher,
  renderFilesMarkdown,
  renderSummaryMarkdown,
} from "../content-voice-report.mjs";
import {
  computeVoiceMetrics,
  findFormMarkers,
  validateVoiceConfig,
} from "../content-voice-rules.mjs";

const CONFIG = validateVoiceConfig({
  scope: { strict: [] },
  allowlist: { entries: [] },
  formMap: { default: "du", courses: { "content/eu-ai-act-kurs": "sie" } },
});

const CHAPTER = [
  "# Inventar",
  "",
  "Das gilt z. B. f\u00fcr Art. 5 der KI-VO. Am 2. Februar 2025 begann die Frist. Fertig!",
  "",
  "Eins zwei. Eins zwei drei vier. Eins zwei drei vier f\u00fcnf sechs.",
  "",
  "Satz eins. Satz zwei. Satz drei. Satz vier. Satz f\u00fcnf. Satz sechs.",
  "",
  "- a",
  "- b",
  "- c",
  "",
  "1. eins",
  "2. zwei",
  "3. drei",
  "4. vier",
  "",
  "* x",
  "* y",
  "* z",
  "",
  "Das gilt sowohl heute als auch morgen. Dar\u00fcber hinaus pr\u00fcfst du dein Inventar, und Sie pr\u00fcfen Ihres.",
  "",
  "```",
  "Furthermore, code is ignored. Satz. Satz. Satz. Satz. Satz. Satz.",
  "```",
  "",
].join("\n");

test("sentence splitting protects abbreviations and ordinal dates", () => {
  assert.deepEqual(
    splitSentences("Das gilt z. B. f\u00fcr Art. 5 der KI-VO. Am 2. Februar 2025 begann die Frist. Fertig!"),
    [
      "Das gilt z. B. f\u00fcr Art. 5 der KI-VO.",
      "Am 2. Februar 2025 begann die Frist.",
      "Fertig!",
    ],
  );
  assert.deepEqual(splitSentences("It costs 3.5 EUR e.g. today. Really?"), [
    "It costs 3.5 EUR e.g. today.",
    "Really?",
  ]);
  assert.equal(countWords("Eins zwei drei-vier, f\u00fcnf!"), 4);
});

test("paragraph blocks keep their line index, type and list item count", () => {
  const blocks = splitParagraphs(CHAPTER);
  assert.deepEqual(
    blocks.map((b) => [b.type, b.lineIndex, b.items ?? null]),
    [
      ["heading", 0, null],
      ["text", 2, null],
      ["text", 4, null],
      ["text", 6, null],
      ["list", 8, 3],
      ["list", 12, 4],
      ["list", 17, 3],
      ["text", 21, null],
    ],
    "the fenced code block is blanked out and never becomes a paragraph",
  );
});

test("per-file metrics: sentences, mean and standard deviation, paragraphs, lists, connectors, form", () => {
  const unit = extractProseUnits("content/books/testbuch/01_kapitel.md", CHAPTER);
  const metrics = computeVoiceMetrics(unit);

  // 3 + 3 + 6 + 2 = 14 sentences from the four text paragraphs.
  assert.equal(metrics.sentences, 14);
  assert.equal(metrics.paragraphs, 4);
  assert.equal(metrics.longParagraphs, 1);
  assert.equal(metrics.longParagraphShare, 0.25);

  assert.equal(metrics.lists, 3);
  assert.equal(metrics.threeItemLists, 2);
  assert.deepEqual(metrics.listHistogram, { 3: 2, 4: 1 });
  assert.equal(metrics.threeItemListShare, 2 / 3);

  assert.deepEqual(metrics.connectors, { "sowohl-als-auch": 1, "darueber-hinaus": 1 });
  assert.equal(metrics.connectorTotal, 2);

  assert.equal(metrics.du, 2, "du and dein");
  assert.equal(metrics.sie, 2, "mid-sentence Sie and Ihres");
  assert.equal(metrics.form, "mixed");

  assert.equal(metrics.sentenceLengthSum, 58);
  assert.ok(Math.abs(metrics.sentenceLengthMean - 58 / 14) < 1e-12);
  assert.ok(metrics.sentenceLengthSd > 0);
});

test("standard deviation is the population deviation of sentence lengths", () => {
  const unit = extractProseUnits(
    "content/books/testbuch/02_kapitel.md",
    "Eins zwei. Eins zwei drei vier. Eins zwei drei vier f\u00fcnf sechs.",
  );
  const metrics = computeVoiceMetrics(unit);
  assert.equal(metrics.sentences, 3);
  assert.equal(metrics.sentenceLengthMean, 4);
  assert.ok(Math.abs(metrics.sentenceLengthSd - Math.sqrt(8 / 3)) < 1e-12);
  assert.equal(metrics.sentenceLengthSumSq, 4 + 16 + 36);
});

test("form markers ignore sentence-initial Sie and lower-case sie", () => {
  const markers = findFormMarkers("Sie kommt morgen. Pr\u00fcfen Sie das, sie pr\u00fcft es auch, und wir sehen Ihr Team und ihr Team.");
  assert.deepEqual(markers.map((m) => [m.form, m.word]), [["sie", "Sie"], ["sie", "Ihr"]]);
});

test("analyzeCorpus counts banned hits and terms per file with the allowlist applied", () => {
  const corpus = analyzeCorpus(
    [
      {
        relFile: "content/ki-fuehrerschein/block-1-lessons.json",
        text: JSON.stringify({
          lessons: [
            {
              id: "l1",
              sections: [
                { content: "Dar\u00fcber hinaus ist das Zertifikat quasi fertig. Stell dir vor." },
              ],
            },
          ],
        }),
      },
      { relFile: "content/books/testbuch/01_kapitel.md", text: "Stell dir vor, das Buch ist fertig." },
    ],
    validateVoiceConfig({
      scope: { strict: [] },
      allowlist: {
        entries: [
          { file: "content/ki-fuehrerschein/", rule: "VOICE-FILLER", reason: "test suppression" },
        ],
      },
      formMap: { default: "du", courses: {} },
    }),
  );
  const lesson = corpus.get("content/ki-fuehrerschein/block-1-lessons.json");
  assert.equal(lesson.bans, 1, "the transition counts, the allowlisted filler does not");
  assert.equal(lesson.terms, 1);
  assert.deepEqual(lesson.findingsByRule, { "VOICE-TRANSITION": 1, "VOICE-TERM": 1 });
  const book = corpus.get("content/books/testbuch/01_kapitel.md");
  assert.equal(book.bans, 0, "a single Stell dir vor per surface is within budget");
});

function corpusFrom(entries) {
  return analyzeCorpus(entries, CONFIG);
}

test("surface aggregation marks files missing at the baseline as new and renders before -> after", () => {
  const before = corpusFrom([
    { relFile: "content/ki-fuehrerschein/a.md", text: "Dar\u00fcber hinaus gilt das. Eins zwei drei." },
  ]);
  const after = corpusFrom([
    { relFile: "content/ki-fuehrerschein/a.md", text: "Das gilt. Eins zwei drei." },
    { relFile: "content/ki-fuehrerschein/b.md", text: "Neu. Ganz neu hier." },
  ]);
  const rows = aggregateBySurface(after, before);
  assert.deepEqual(rows.map((r) => r.surface), ["content/ki-fuehrerschein", "Total"]);
  const [surface, total] = rows;
  assert.equal(surface.current.files, 2);
  assert.equal(surface.current.newFiles, 1);
  assert.equal(surface.baseline.files, 1);
  assert.equal(surface.baseline.bans, 1);
  assert.equal(surface.current.bans, 0);
  assert.equal(total.current.newFiles, 1);

  const summary = renderSummaryMarkdown(rows, { baseline: "origin/main" });
  assert.match(summary, /baseline `origin\/main`/);
  assert.match(summary, /\| content\/ki-fuehrerschein \| 2 \(1 new\) \|/);
  assert.match(summary, /\| 1 -> 0 \|/, "bans column shows before -> after");

  const files = renderFilesMarkdown(after, before);
  assert.match(files, /content\/ki-fuehrerschein\/b\.md \(new\)/);
  assert.match(files, /content\/ki-fuehrerschein\/a\.md \| de \|/);

  const noBaseline = renderSummaryMarkdown(aggregateBySurface(after, null));
  assert.doesNotMatch(noBaseline, /->/);
});

test("finishAggregate derives mean, deviation and shares from sums", () => {
  const finished = finishAggregate({
    files: 1,
    newFiles: 0,
    words: 10,
    sentences: 3,
    sentenceLengthSum: 12,
    sentenceLengthSumSq: 56,
    paragraphs: 4,
    longParagraphs: 1,
    lists: 3,
    threeItemLists: 2,
    bans: 0,
    terms: 0,
    connectors: 0,
    du: 0,
    sie: 0,
  });
  assert.equal(finished.sentenceLengthMean, 4);
  assert.ok(Math.abs(finished.sentenceLengthSd - Math.sqrt(8 / 3)) < 1e-12);
  assert.equal(finished.longParagraphShare, 0.25);
  assert.equal(finished.threeItemListShare, 2 / 3);
});

test("argument parsing accepts the CI invocation shape", () => {
  const options = parseArgs(["--", "--markdown", "--baseline", "origin/main", "--paths", "content/a,src/lib/b", "--paths=content/c", "--verbose"]);
  assert.equal(options.markdown, true);
  assert.equal(options.json, false);
  assert.equal(options.baseline, "origin/main");
  assert.deepEqual(options.paths, ["content/a", "src/lib/b", "content/c"]);
  assert.equal(options.verbose, true);
  assert.equal(parseArgs(["--json"]).markdown, false);
  assert.equal(parseArgs([]).markdown, true, "markdown is the default output");
  assert.throws(() => parseArgs(["--baseline"]), /needs a value/);
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
});

test("path matchers accept directory prefixes and globs", () => {
  const dir = pathMatcher("content/ki-fuehrerschein/");
  assert.ok(dir("content/ki-fuehrerschein/glossary.json"));
  assert.ok(!dir("content/ki-fuehrerschein-extra/glossary.json"));
  const glob = pathMatcher("src/lib/**/de/*.ts");
  assert.ok(glob("src/lib/codex/lessons/de/l01.ts"));
  assert.ok(!glob("src/lib/codex/lessons/l01.ts"));
  const star = pathMatcher("content/*/en/*.json");
  assert.ok(star("content/ai-native/en/modul-1-lessons.json"));
  assert.ok(!star("content/ai-native/en/quiz/questions.json"));
});
