/**
 * Workshop 05 answer key: the Count lines of ANSWERS.md and LOESUNGEN.md, the status per line equal in
 * both editions and equal to the oracle, the pinned lines 2 to 4 of the start block, the three
 * briefing sentences, and every quote of the key found word for word in the folder.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FOLDER_FILES, FOLDER_FILES_DE } from "../workshop05/build-kit.mjs";
import { analyse } from "../workshop05/oracle/oracle.mjs";
import { loadKitFiles } from "../workshop05/oracle/load.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../workshop05");
const text = (dir, file) => readFileSync(path.join(HERE, dir, file), "utf8");
const result = analyse(loadKitFiles());

// The pinned COPY strings of the demo (lines 2 to 4 of the start block, verbatim).
const COPY = {
  en: [
    "A file is evidence only when its quote, period, scope and approval hold. I give Claude those four tests as rules, and nothing counts without a verbatim quote.",
    "COVERED, WEAK or GAP. A file out of date or unapproved: WEAK. A part without evidence, or the record shows “not met”: GAP. The weakest part counts.",
    "No quote, no COVERED. A policy shows intent; only a record shows practice.",
  ],
  de: [
    "Eine Datei ist erst ein Nachweis, wenn Zitat, Zeitraum, Umfang und Freigabe stimmen. Diese vier Prüfungen gebe ich Claude als Regeln, und ohne wörtliches Zitat zählt nichts.",
    "BELEGT, SCHWACH oder LÜCKE. Datei veraltet oder nicht freigegeben: SCHWACH. Ein Teil ohne Nachweis, oder der Nachweis zeigt „nicht erfüllt“: LÜCKE. Der schwächste Teil zählt.",
    "Ohne Zitat kein BELEGT. Eine Richtlinie zeigt Absicht, nur ein Protokoll zeigt Praxis.",
  ],
};

const EDITIONS = [
  {
    locale: "en",
    key: text("kit", "ANSWERS.md"),
    start: text("kit", "START-HERE.md"),
    words: ["COVERED", "WEAK", "GAP"],
    count2: "Count: 10 findings, 8 checked, no problem.",
    count3: "Count: 2 COVERED, 1 WEAK, 10 GAP.",
    sentences: ["Answer only what is asked", "there is no such paper, we are writing it today", "Do not sign minutes that do not match"],
    folder: FOLDER_FILES.map((file) => text("kit/folder", file)).join("\n"),
    quote: /"([^"]+)"/g,
    steps: ["## Step 1", "## Step 2", "## Step 3", "## The clock"],
  },
  {
    locale: "de",
    key: text("kit-de", "LOESUNGEN.md"),
    start: text("kit-de", "START-HIER.md"),
    words: ["BELEGT", "SCHWACH", "LÜCKE"],
    count2: "Zählung: 10 Funde, 8 geprüft ohne Befund.",
    count3: "Zählung: 2 BELEGT, 1 SCHWACH, 10 LÜCKE.",
    sentences: ["Beantworte nur, was gefragt wird", "dieses Papier gibt es nicht, wir schreiben es heute", "Unterschreibe kein Protokoll, das nicht stimmt"],
    folder: FOLDER_FILES_DE.map((file) => text("kit-de/ordner", file)).join("\n"),
    quote: /„([^“]+)“/g,
    steps: ["## Schritt 1", "## Schritt 2", "## Schritt 3", "## Die Fristen"],
  },
];

const statusRows = (edition) => {
  const body = edition.key.slice(edition.key.indexOf(edition.steps[2]), edition.key.indexOf(edition.steps[3]));
  return body.split("\n").filter((line) => new RegExp(`^\\| L\\d\\d \\| (${edition.words.join("|")}) \\|`).test(line));
};

for (const edition of EDITIONS) {
  test(`${edition.locale}: both Count lines and the rows read are in the key`, () => {
    assert.ok(edition.key.includes(edition.count2));
    assert.ok(edition.key.includes(edition.count3));
    assert.equal(result.findings.length, 10);
    assert.equal(result.decoys.length, 8);
    assert.deepEqual(result.tally, { covered: 2, weak: 1, gap: 10 });
    assert.match(edition.key, /\| (Total|Summe) \| 693 \|/);
    assert.equal(result.rowsRead, 693);
    assert.match(edition.key, /\| (Findings|Funde) \| 12 \| 9 \|/);
  });

  test(`${edition.locale}: the status of each line equals the oracle`, () => {
    const rows = statusRows(edition);
    assert.equal(rows.length, 13);
    const byLine = Object.fromEntries(rows.map((row) => [row.split("|")[1].trim(), edition.words.indexOf(row.split("|")[2].trim())]));
    assert.deepEqual(byLine, Object.fromEntries(result.lines.map((line) => [line.id, ["COVERED", "WEAK", "GAP"].indexOf(line.status)])));
  });

  test(`${edition.locale}: the start block lines 2 to 4 equal the pinned COPY strings`, () => {
    assert.deepEqual(edition.start.split("\n").slice(1, 4), COPY[edition.locale]);
  });

  test(`${edition.locale}: the three briefing sentences are in the key`, () => {
    for (const sentence of edition.sentences) assert.ok(edition.key.includes(sentence), sentence);
  });

  test(`${edition.locale}: every quote of the key is word for word in the folder`, () => {
    for (const row of statusRows(edition)) {
      const id = row.split("|")[1].trim();
      const quotes = [...row.split("|")[4].matchAll(edition.quote)].map((match) => match[1]);
      assert.ok(quotes.length > 0, `${id} has no quote`);
      for (const quote of quotes) assert.ok(edition.folder.includes(quote), `${id}: ${quote}`);
    }
  });
}

test("the two editions give the same status per line", () => {
  const read = (edition) => statusRows(edition).map((row) => [row.split("|")[1].trim(), edition.words.indexOf(row.split("|")[2].trim())]);
  assert.deepEqual(read(EDITIONS[0]), read(EDITIONS[1]));
});

test("rule 8 carries the tie-break between WEAK and GAP, and the key's L11 row points at it (a blind run must reach the same status)", () => {
  const rule8 = (dir, file) => text(dir, file).split("\n").find((line) => line.startsWith("8. ")) ?? "";
  assert.match(rule8("kit", "project-instructions.md"), /Tie-break: a paper that a later change made stale is WEAK/);
  assert.match(rule8("kit-de", "projektanweisungen.md"), /Im Zweifel gilt: Ein Papier, das eine spätere Änderung überholt hat, ist SCHWACH/);
  assert.match(EDITIONS[0].key, /\| L11 \| WEAK \|[^\n]*rule 8, tie-break/);
  assert.match(EDITIONS[1].key, /\| L11 \| SCHWACH \|[^\n]*Regel 8, Im-Zweifel-Satz/);
});
