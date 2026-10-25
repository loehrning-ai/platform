import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyAllowlist,
  codeStrings,
  collectFindings,
  jsonStrings,
  lintLines,
  proseLines,
  readAllowlist,
  targets,
  zipProse,
} from "../copy-lint.mjs";

const rules = (text, options) => lintLines("x.md", [{ line: 1, text }], options).map((finding) => finding.rule);

test("flags the union list of amendment 23", () => {
  assert.deepEqual(rules("Antwort bis Freitag, sagt der Chef."), ["deadline", "boss"]);
  assert.deepEqual(rules("Ein Countdown, ein Stempel, eine Überraschung."), ["countdown", "stamp", "surprise"]);
  assert.deepEqual(rules("Richtig! Du hast 12 Punkte."), ["praise", "score"]);
  assert.deepEqual(rules("Das ist jetzt konform und nahtlos, ein Game-Changer."), ["compliance-claim", "hype", "hype"]);
  assert.deepEqual(rules("Eine Prognose — und noch eine – dazu."), ["dash", "dash"]);
  assert.deepEqual(rules("Pruefe das fuer die Uebersicht."), ["umlaut", "umlaut", "umlaut"]);
  assert.deepEqual(rules("## Was fehlt noch?", { markdown: true }), ["question-heading"]);
});

test("leaves facts, quotes, slugs and code alone", () => {
  assert.deepEqual(rules("Gerechnet pro Arbeitstag (Montag bis Freitag)."), []);
  assert.deepEqual(rules("Schreibe nie „compliant“ oder „conform“."), []);
  assert.deepEqual(rules("Siehe /demos/ki-prognosen-einschaetzen und data_fuer_x.csv."), []);
  assert.deepEqual(rules("Das ist richtig, aber unvollständig."), []);
  assert.deepEqual(rules("## Was fehlt noch?"), [], "question headings count only in Markdown");
  const strings = codeStrings('import x from "./fuer";\nconst a = { cls: "dr3-stamp", label: `Prüfe ${x} jetzt`, b: "stamp" };\n// Freitag\n', "a.ts");
  assert.deepEqual(strings.map((s) => s.text), ["dr3-stamp", "Prüfe ", " jetzt", "stamp"]);
  assert.deepEqual(lintLines("a.ts", strings, { code: true }), []);
});

test("reads JSX text, JSON values and prose outside code fences", () => {
  assert.deepEqual(codeStrings("const a = <p>Bis Freitag</p>;", "a.tsx").map((s) => s.text), ["Bis Freitag"]);
  assert.deepEqual(jsonStrings('{"s1":{"notes":["Bis Freitag"]}}'), [{ line: "s1.notes[0]", text: "Bis Freitag" }]);
  const lines = proseLines("Text `bis Freitag`\n```\nbis Freitag\n```\nEnde");
  assert.deepEqual(lines.map((l) => l.text.trim()), ["Text", "Ende"]);
});

test("reads Markdown members out of a stored zip", async () => {
  const { zipStore } = await import("../../packages/website/src/lib/zip/store.ts").catch(() => ({ zipStore: null }));
  if (!zipStore) return; // node without TypeScript stripping: the kit run below still covers real zips
  const members = zipProse(zipStore([{ path: "kit/README.md", data: "Bis Freitag" }, { path: "kit/a.csv", data: "x" }]));
  assert.deepEqual(members, [{ name: "kit/README.md", text: "Bis Freitag" }]);
});

test("an allowlist entry allows its findings, and one that allows nothing is stale", () => {
  const findings = lintLines("f.md", [{ line: 1, text: "Bis Freitag, Chef." }]);
  const { blocking, stale } = applyAllowlist(findings, [
    { file: "f.md", rule: "deadline", match: "Freitag", reason: "debt" },
    { file: "f.md", rule: "hype", match: "magisch", reason: "debt" },
  ]);
  assert.deepEqual(blocking.map((f) => f.rule), ["boss"]);
  assert.deepEqual(stale.map((e) => e.rule), ["hype"]);
});

test("rejects an allowlist entry without a reason or with an unknown rule", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "copy-lint-"));
  const file = path.join(dir, "allow.json");
  writeFileSync(file, JSON.stringify([{ file: "a", rule: "deadline", match: "x" }]));
  assert.throws(() => readAllowlist(file), /reason/);
  writeFileSync(file, JSON.stringify([{ file: "a", rule: "nope", match: "x", reason: "y" }]));
  assert.throws(() => readAllowlist(file), /unknown rule/);
});

test("the repository is clean against its allowlist, and the allowlist has no stale entry", () => {
  const sources = targets();
  assert.ok(sources.code.length > 10 && sources.zips.length >= 4, "the lint reads demo code and the kit zips");
  const { blocking, stale } = applyAllowlist(collectFindings(sources), readAllowlist());
  assert.deepEqual(blocking, []);
  assert.deepEqual(stale, []);
});
