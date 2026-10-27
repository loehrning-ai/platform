import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyAllowlist,
  codeStrings,
  collectFindings,
  htmlTextLines,
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
  writeFileSync(file, JSON.stringify([{ file: "a", rule: "v4-caps", match: "x", reason: "y" }]));
  assert.equal(readAllowlist(file).length, 1, "v4 rules can be allowed like the others");
});

test("the repository is clean against its allowlist, and the allowlist has no stale entry", () => {
  const sources = targets();
  assert.ok(sources.code.length > 10 && sources.zips.length >= 4, "the lint reads demo code and the kit zips");
  const { blocking, stale } = applyAllowlist(collectFindings(sources), readAllowlist());
  assert.deepEqual(blocking, []);
  assert.deepEqual(stale, []);
});

test("deck HTML: text nodes and spoken attributes, never script, style, comments or file names", () => {
  const html = [
    '<html><head><style>.a::after{content:"—"}</style><script>const s = "—";</script></head>',
    "<body><!-- a — note -->",
    '<td class="num">—</td><p aria-label="Folie — eins">Weiter &mdash; jetzt</p>',
    "<li><span>loesungen/</span><span>START-HIER.md</span></li></body></html>",
  ].join("\n");
  const lines = htmlTextLines(html);
  assert.deepEqual(
    lines.map(({ line, text }) => [line, text]),
    [
      [3, "—"],
      [3, "Weiter — jetzt"],
      [3, "Folie — eins"],
    ],
  );
  assert.equal(lintLines("deck.html", lines).filter((finding) => finding.rule === "dash").length, 3);
});

test("deck HTML: the speaker notes in JSON script blocks count, ids and folder names do not", () => {
  const html = [
    "<html><body><p>Folie</p>",
    '<script type="application/json" id="deck-meta">{"scenes":[{"id":"pruefprotokoll","notes":{"say":["Wer würde das an die Chefin weitergeben?"]}}]}</script>',
    '<script type="application/json" class="notes">{"say":["Erst loesungen/ öffnen, dann das Urteil."]}</script>',
    '<script type="application/json">not json</script>',
    "</body></html>",
  ].join("\n");
  const lines = htmlTextLines(html);
  assert.deepEqual(
    lines.map(({ line, text }) => [line, text]),
    [
      [2, "Wer würde das an die Chefin weitergeben?"],
      [3, "Erst loesungen/ öffnen, dann das Urteil."],
      [1, "Folie"],
    ],
  );
  assert.deepEqual(lintLines("deck.html", lines).map((finding) => finding.rule), ["boss"]);
});

test("the targets include every deck and presenter page", () => {
  const { html } = targets();
  assert.ok(html.some((file) => file.endsWith("datenbereitschaft-fuer-ki/presenter.html")));
  assert.ok(html.some((file) => file.endsWith("audit-vorbereitung-mit-ki/en/slides.html")));
});

test("v4 rules: symbols, caps, calques, Tipp as a verb, UI jargon and long sentences", async () => {
  const { lintLines: lint } = await import("../copy-lint.mjs");
  const v4 = (text) => lint("x.ts", [{ line: 1, text }], { v4: true }).map((finding) => finding.rule).filter((rule) => rule.startsWith("v4-"));
  assert.deepEqual(v4("Die Summe ist Σ 12 → 14 Gläser."), ["v4-symbol", "v4-symbol"]);
  assert.deepEqual(v4("Kosten + Rest = Planzahl."), ["v4-symbol", "v4-symbol"]);
  assert.deepEqual(v4("Der Satz ist BELEGT, die CSV bleibt."), ["v4-caps"]);
  assert.deepEqual(v4("Hands on"), ["v4-calque"]);
  assert.deepEqual(v4("Week from 29 December"), ["v4-calque"]);
  assert.deepEqual(v4("Tipp auf ein Angebot."), ["v4-tipp"]);
  assert.deepEqual(v4("Die Bühne zeigt den Kipp."), ["v4-jargon", "v4-jargon"]);
  assert.deepEqual(v4(Array.from({ length: 26 }, () => "Wort").join(" ") + "."), ["v4-long"]);
  // Labels may use the middle dot; a sentence may not.
  assert.deepEqual(v4("4 Min · ohne Konto"), []);
  assert.deepEqual(v4("Das ist frei · das ist rot."), ["v4-symbol"]);
  assert.deepEqual(v4("Tippe auf „Weiter“, dann siehst du die Planzahl."), []);
  // Without the v4 option the old rules alone run.
  assert.deepEqual(lint("x.ts", [{ line: 1, text: "Die Bühne ist BELEGT." }]), []);
  // A caps word inside a file name is the name, not a shouted word.
  assert.deepEqual(v4("Öffne START-HIER.md und lies de/LOESUNGEN.md."), []);
  assert.deepEqual(v4("Die Datei infosec-policy_v3_FINAL.md ist alt, infosec-policy_v3_FINAL auch."), []);
  assert.deepEqual(v4("„FINAL“ heißt nicht freigegeben."), ["v4-caps"]);
  // In code, one caps word or one bracketed template slot is a key, not a sentence.
  const code = (text) => lint("x.ts", [{ line: 1, text }], { v4: true, code: true }).map((finding) => finding.rule);
  assert.deepEqual(code("POLICY"), []);
  assert.deepEqual(code("LÜCKE"), []);
  assert.deepEqual(code("[ZITAT / ZEITRAUM / UMFANG / FREIGABE]"), []);
  assert.deepEqual(code("Die Anforderung ist eine LÜCKE."), ["v4-caps"]);
});

test("v4 rules read the demo intros, v4 demos and the v4 blocks of demos-ui-copy.ts only", async () => {
  const { v4Lines } = await import("../copy-lint.mjs");
  const lines = [{ line: 1, text: "a" }];
  assert.equal(v4Lines("packages/website/src/lib/demo-cases/x/intro.ts", "", lines).length, 1);
  assert.equal(v4Lines("packages/website/src/lib/demo-cases/x/copy.ts", "", lines, () => "v3").length, 0);
  assert.equal(v4Lines("packages/website/src/components/demos/x/view.tsx", "", lines, () => "v4").length, 1);
  // A generated kit mirror is linted as the kit, inside its zip.
  assert.equal(v4Lines("packages/website/src/lib/demo-cases/x/kit.ts", "// GENERATED by scripts/x.mjs\n", lines, () => "v4").length, 0);
  const source = 'export const C = { de: { shell: { back: "Zurück" }, v4: { next: "Weiter" } } };';
  const all = [
    { line: 1, text: "Zurück" },
    { line: 1, text: "Weiter" },
  ];
  assert.equal(v4Lines("packages/website/src/lib/demos-ui-copy.ts", source, all).length, 2, "one-line source: both on the v4 line");
  const multi = 'export const C = {\n  shell: { back: "Zurück" },\n  v4: {\n    next: "Weiter",\n  },\n};\n';
  assert.deepEqual(
    v4Lines("packages/website/src/lib/demos-ui-copy.ts", multi, [
      { line: 2, text: "Zurück" },
      { line: 4, text: "Weiter" },
    ]).map((line) => line.text),
    ["Weiter"],
  );
});
