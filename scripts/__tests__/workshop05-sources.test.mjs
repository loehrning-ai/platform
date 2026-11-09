/**
 * Workshop 05: sources are named for people, never by an internal research id. The built pages (both editions, speaker notes
 * included) and the deck copy carry the publisher and the date of each source (State Statistical Office, 15 Apr 2026; DIT
 * proposed annual report 2025; Telma, 26 May 2026; ...), not the ids of the research files (NEWS-13, DATA-11, TIME-05,
 * CLAUDE-40, INDUSTRIES-10, VER-01, CAD-22, Q-01, V-CLAUDE-A1) or the review rounds (round-1 verified X7, verified tax F40).
 * The invented employees keep their ids (E-02): they are part of the case, not a source.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LANGS, readPage } from "../workshop05/deck-src/deck-html.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COPY = readFileSync(path.join(HERE, "../workshop05/deck-src/deck-copy.json"), "utf8");
const ID = /\b(?:V-)?(?:NEWS|DATA|TIME|CLAUDE|INDUSTRIES|VER|CAD|Q)-[A-Z]?\d+\b/g;
const ROUND = /round-1 verified|verified tax F\d+|ersten Runde geprüft|\bX7\b|\bF40\b/g;

test("the id patterns catch every kind of research id and leave the employee ids alone", () => {
  for (const id of ["NEWS-13", "DATA-11", "TIME-05", "CLAUDE-40", "INDUSTRIES-10", "VER-01", "CAD-22", "Q-01", "V-CLAUDE-A1"]) assert.match(id, new RegExp(ID.source));
  for (const ok of ["E-02", "E-14", "Q2 2026", "ISO/IEC 17021-1", "Art. 57(3)"]) assert.doesNotMatch(ok, new RegExp(ID.source));
});

for (const lang of LANGS) {
  test(`${lang}: the built slides.html (speaker notes included) names no research id and no review round`, () => {
    const html = readPage(lang);
    assert.deepEqual(html.match(ID) ?? [], [], `${lang}: research ids in the page`);
    assert.deepEqual(html.match(ROUND) ?? [], [], `${lang}: review rounds in the page`);
  });
}

test("the deck copy names no research id and no review round", () => {
  assert.deepEqual(COPY.match(ID) ?? [], []);
  assert.deepEqual(COPY.match(ROUND) ?? [], []);
});
