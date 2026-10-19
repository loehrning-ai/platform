import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { DEFAULT_BOOK, runGate } from "../book-voice-gate.mjs";
import { lintChapter, splitSentences, wordCount } from "../book-voice-structure.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures", "book-voice");
const gateScript = path.join(here, "..", "book-voice-gate.mjs");
const clean = readFileSync(path.join(fixtures, "clean-sample.md"), "utf-8");
const slop = readFileSync(path.join(fixtures, "seeded-slop.md"), "utf-8");

/** A throwaway website root holding one book with the given chapter files. */
function makeRoot(chapters) {
  const root = mkdtempSync(path.join(os.tmpdir(), "book-voice-gate-"));
  const dir = path.join(root, DEFAULT_BOOK);
  mkdirSync(path.join(dir, "en"), { recursive: true });
  for (const [name, text] of Object.entries(chapters)) writeFileSync(path.join(dir, name), text);
  return root;
}

const ruleNames = (report) => new Set(report.findings.map((f) => f.rule));

test("clean sample passes every structural gate", () => {
  const report = lintChapter(clean, "clean-sample.md");
  assert.deepEqual(report.gate.failures, []);
  assert.equal(report.gate.pass, true);
  assert.ok(report.stats.short_share >= 0.55 && report.stats.short_share <= 0.65);
  assert.ok(report.stats.long_share >= 0.1);
  assert.ok(report.stats.sd_words > 9);
});

test("seeded slop fails each plan target", () => {
  const report = lintChapter(slop, "seeded-slop.md");
  assert.equal(report.gate.pass, false);
  const text = report.gate.failures.join("\n");
  for (const key of ["short_share", "long_share", "sd_words", "bold_labels", "wrong_quotes", "staged_contrast_total", "dashes_between_words"]) {
    assert.match(text, new RegExp(key), `expected a ${key} failure`);
  }
  const rules = ruleNames(report);
  for (const rule of ["wrong_quote", "bold_label", "nicht_x_sondern_y", "das_ist_kein_x", "nicht_nur_sondern_auch", "closer", "question_answer", "announcer", "intensifier", "dash_between_words"]) {
    assert.ok(rules.has(rule), `expected a ${rule} finding`);
  }
});

test("sentence splitter keeps abbreviations, ordinals and decimals together", () => {
  const parts = splitSentences("Das gilt z. B. f\u00fcr 38.633 Betriebe, d. h. f\u00fcr fast alle. Am 3. Oktober starten wir. Dann folgt Schritt zwei.");
  assert.equal(parts.length, 3);
  assert.equal(wordCount("Das sind 38.633 Betriebe."), 4);
});

test("wrong quotation marks are found, correct ones are not", () => {
  const wrong = lintChapter('Sie sagte \u201eJa, wir nutzen KI" und ging.\n\nEr nannte es "Analog".\n', "q.md");
  assert.equal(wrong.counts.wrong_quotes, 2);
  const right = lintChapter("Sie sagte \u201eJa, wir nutzen KI\u201c und ging.\n", "q.md");
  assert.equal(right.counts.wrong_quotes, 0);
  const attr = lintChapter('<a href="https://example.org" title="x">Link</a> und Text.\n', "q.md");
  assert.equal(attr.counts.wrong_quotes, 0);
});

test("dashes between words fail, number ranges and hyphenated words do not", () => {
  const em = lintChapter("Das Ergebnis \u2014 und das ist klar \u2014 spricht f\u00fcr sich.\n", "d.md");
  assert.equal(em.counts.dashes_between_words, 2);
  const spaced = lintChapter("Das Ergebnis - und das ist klar - spricht f\u00fcr sich.\n", "d.md");
  assert.equal(spaced.counts.dashes_between_words, 2);
  const ok = lintChapter("Der Kurs dauert 2\u20133 Stunden und nutzt ein KI-Check-Setup.\n", "d.md");
  assert.equal(ok.counts.dashes_between_words, 0);
  assert.equal(ok.counts.dash_number_ranges, 1);
});

test("bold labels count only at the start of a paragraph or list item", () => {
  const text = "**Etikett.** Danach folgt ein Satz.\n\n- **Zweites:** Noch ein Satz.\n\nIm Satz steht **ein Begriff** mitten drin.\n";
  const report = lintChapter(text, "b.md");
  assert.equal(report.counts.bold_labels, 2);
  assert.equal(report.counts.bold_total, 3);
});

test("staged contrast forms are all detected", () => {
  const cases = [
    ["Nicht der Preis z\u00e4hlt. Sondern der Nutzen.", "nicht_x_sondern_y"],
    ["Nicht der Preis z\u00e4hlt, sondern der Nutzen.", "nicht_x_sondern_y"],
    ["Das ist kein Trend. Das ist ein Wendepunkt.", "das_ist_kein_x"],
    ["Es geht hier nicht um Technik. Es geht um Verantwortung.", "nicht_x_sondern_y"],
    ["Das hilft nicht nur dir, sondern auch deinem Team.", "nicht_nur_sondern_auch"],
  ];
  for (const [text, rule] of cases) {
    assert.ok(ruleNames(lintChapter(`${text}\n`, "c.md")).has(rule), `${rule} in: ${text}`);
  }
  assert.equal(lintChapter("Ohne Gegensatz kommt der Satz aus.\n", "c.md").counts.staged_contrast_total, 0);
});

test("short chapters skip the share gates but keep the count gates", () => {
  const report = lintChapter("Kurz.\n\nZu kurz.\n\n**Label.** Text.\n\n**Label.** Text.\n\n**Label.** Text.\n", "s.md");
  assert.match(report.stats.note, /insufficient/);
  assert.deepEqual(report.gate.failures, ["bold_labels 3 > 2"]);
});

test("code fences and front matter are ignored", () => {
  const text = "---\ntitle: \"x\"\n---\n\n```\nDas ist kein Code. Das ist Text \u2014 oder?\n```\n";
  const report = lintChapter(text, "f.md");
  assert.equal(report.counts.dashes_between_words, 0);
  assert.equal(report.stats.sentences, 0);
});

test("runGate passes a clean book root", () => {
  const root = makeRoot({ "01_sauber.md": clean });
  try {
    const result = runGate({ root });
    assert.deepEqual(result.voice.errors, []);
    assert.deepEqual(result.structure.failures, []);
    assert.equal(result.pass, true);
    assert.equal(result.chapters, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runGate fails a book root with seeded slop, in platform rules and structure", () => {
  const withPlatformSlop = `${slop}\nDar\u00fcber hinaus ist es von entscheidender Bedeutung, ganzheitlich zu denken.\n`;
  const root = makeRoot({ "01_sauber.md": clean, "02_schlecht.md": withPlatformSlop });
  try {
    const result = runGate({ root });
    assert.equal(result.pass, false);
    assert.ok(result.voice.errors.length > 0, "platform voice rules should flag the seeded slop");
    assert.ok(result.structure.failures.some((m) => m.startsWith("02_schlecht.md")));
    assert.ok(!result.structure.failures.some((m) => m.startsWith("01_sauber.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("structural checks skip the en/ mirror and non-chapter files", () => {
  const root = makeRoot({ "01_sauber.md": clean, "notes.md": slop });
  writeFileSync(path.join(root, DEFAULT_BOOK, "en", "01_slop.md"), slop);
  try {
    assert.equal(runGate({ root }).chapters, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--warnings-fail turns structural warnings into a failure", () => {
  const warnOnly = `${clean}\nUnd jetzt der wichtigste Punkt.\n`;
  const root = makeRoot({ "01_warn.md": warnOnly });
  try {
    assert.equal(runGate({ root }).pass, true);
    assert.equal(runGate({ root, warningsFail: true }).pass, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CLI exits 0 on a clean root and 1 on slop, and prints JSON on request", () => {
  const good = makeRoot({ "01_sauber.md": clean });
  const bad = makeRoot({ "01_schlecht.md": slop });
  try {
    const ok = spawnSync(process.execPath, [gateScript, "--root", good], { encoding: "utf-8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /PASS/);
    const fail = spawnSync(process.execPath, [gateScript, "--root", bad, "--json"], { encoding: "utf-8" });
    assert.equal(fail.status, 1);
    const parsed = JSON.parse(fail.stdout);
    assert.equal(parsed.pass, false);
    assert.ok(parsed.structure.failures.length > 0);
    const unknown = spawnSync(process.execPath, [gateScript, "--bogus"], { encoding: "utf-8" });
    assert.equal(unknown.status, 2);
  } finally {
    rmSync(good, { recursive: true, force: true });
    rmSync(bad, { recursive: true, force: true });
  }
});

test("figure and ticker directives are not prose: they count as no sentence and trigger no closer", () => {
  const body = "Ein Satz mit genug Wörtern, damit er als Satz zählt und nicht als Marker.\n\n::figure{id=\"C3\"}\n\nNoch ein Satz, der danach folgt und ganz normal weitergeht.\n";
  const withMarker = lintChapter(body, "marker.md");
  const without = lintChapter(body.replace('::figure{id="C3"}\n\n', ""), "marker.md");
  assert.equal(withMarker.stats.sentences, without.stats.sentences);
  assert.equal(withMarker.findings.some((f) => f.rule === "closer"), false);
});
