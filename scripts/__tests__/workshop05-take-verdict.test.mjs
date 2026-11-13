/**
 * Workshop 05 deck, the verdict on a shown take. The deck's chip ("differs from the key") and its "This run" line must be the
 * verdict of the acceptance checker (recordings/check-take.mjs), never a second reading of the numbers: for every take the deck
 * shows, the deck says "differs" exactly when the checker reports a mismatch with the key, and the built page carries the chip
 * that verdict asks for.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkTake, readTake } from "../workshop05/recordings/check-take.mjs";
import { SLOT_TURN } from "../workshop05/recordings/check-take.mjs";
import { compareWithKey, loadTakes, recordedOn } from "../workshop05/deck-src/take.mjs";
import { TAKES_JSON } from "../workshop05/deck-src/take.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = { de: "slides.html", en: "en/slides.html" };
const page = (lang) => readFileSync(path.resolve(HERE, "../../packages/website/public/workshops/audit-vorbereitung-mit-ki", PAGES[lang]), "utf8");
const copy = JSON.parse(readFileSync(path.resolve(HERE, "../workshop05/deck-src/deck-copy.json"), "utf8"));
const shown = JSON.parse(readFileSync(TAKES_JSON, "utf8"));

for (const lang of Object.keys(shown)) {
  for (const kind of Object.keys(shown[lang])) {
    const id = shown[lang][kind];
    test(`${id}: the deck's same/differs verdict is the checker's verdict`, () => {
      const { recording, location } = readTake(id);
      const checker = checkTake(recording, { location });
      const slots = Object.keys(SLOT_TURN).filter((slot) => SLOT_TURN[slot][0] === kind);
      const deckDiffs = slots.flatMap((slot) => compareWithKey(recording, slot));
      assert.equal(deckDiffs.length > 0, checker.mismatches.length > 0, `${id}: deck says ${deckDiffs.length} differences, the checker ${checker.mismatches.length}`);
      assert.equal(deckDiffs.length, checker.mismatches.length, `${id}: the same mismatches`);
      assert.equal(loadTakes(lang)[kind].id, id);
    });
  }
}

/** [slide id, recording kind, slot, id of the chip element] */
const CHIPS = [
  ["step1", "chain", "step1", "chip"],
  ["step2", "chain", "step2", "chip"],
  ["register", "register", "step4", "chip"],
  ["register", "register", "ask", "chip2"],
];
const sectionOf = (html, id) => html.split("<section ").find((part) => part.startsWith(`class="slide ${id}`)) ?? "";
const chipOf = (section, chipId) => new RegExp(`data-id="${chipId}"[^>]*>([^<]*)<`).exec(section)?.[1];

for (const lang of Object.keys(shown)) {
  test(`${lang}: the chip of every shown turn on the built page follows the checker's verdict for that turn`, () => {
    const html = page(lang);
    for (const [slide, kind, slot, chipId] of CHIPS) {
      const { recording } = readTake(shown[lang][kind]);
      const date = recordedOn(recording.recorded_at, lang);
      const differs = compareWithKey(recording, slot).length > 0;
      const want = differs ? copy[lang].take.chipDiff.replace("{date}", date) : copy[lang].take.chipSame.replace("{date}", date).replace("{model}", "");
      const got = chipOf(sectionOf(html, slide), chipId);
      assert.ok(got, `${lang} ${slide}: a chip`);
      assert.equal(got.includes("differs") || got.includes("weicht"), differs, `${lang} ${slide} ${slot}: chip "${got}", checker says ${differs ? "differs" : "same"}`);
      if (differs) assert.equal(got, want);
    }
  });
}
