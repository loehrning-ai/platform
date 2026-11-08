/**
 * Workshop 05, Macedonian lines: every Cyrillic character the deck can show is in the Cyrillic subset of the Typing face
 * (assets/fonts/typing-cyr-2026.codepoints.json), so the projector never falls back to a system face or shows empty boxes.
 * Sources checked: deck-copy.json (every string) and the visible text of both built decks (script and style blocks and
 * the speaker notes are not rendered and are skipped; the .qd quotes are the usual home of Cyrillic).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.resolve(HERE, "../../packages/website/public/workshops/audit-vorbereitung-mit-ki");
const FONTS = path.join(DECK, "assets/fonts");
const listed = JSON.parse(readFileSync(path.join(FONTS, "typing-cyr-2026.codepoints.json"), "utf8"));
const covered = new Set(listed.codepoints);
const CYRILLIC = /[Ѐ-ӿ]/g;

const hex = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
const missing = (text) => [...new Set(text.match(CYRILLIC) || [])].filter((ch) => !covered.has(ch.codePointAt(0)));

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** Removes script and style blocks (any case, also "</script >") until nothing changes. */
function stripBlocks(html) {
  let prev;
  let out = html;
  do {
    prev = out;
    out = out.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ");
  } while (out !== prev);
  return out;
}

function visibleText(html) {
  return stripBlocks(html).replace(/<[^>]+>/g, " ");
}

test("the code point list covers the Macedonian letters including the five that differ from Serbian and Russian", () => {
  assert.equal(listed.font, "Typing-Cyr-2026");
  assert.equal(listed.range, "U+0400-04FF");
  assert.equal(listed.count, listed.codepoints.length);
  for (const ch of "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш") {
    assert.ok(covered.has(ch.codePointAt(0)), `${ch} (${hex(ch)}) is in the subset`);
  }
});

test("both subset files exist, are real woff2 files, and fonts.css maps them to the Cyrillic range only", () => {
  for (const name of ["Typing-Cyr-2026-Regular.woff2", "Typing-Cyr-2026-Bold.woff2"]) {
    const file = path.join(FONTS, name);
    assert.ok(existsSync(file), name);
    const bytes = readFileSync(file);
    assert.ok(bytes.length > 10_000, `${name} is not empty`);
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "wOF2", `${name} is woff2`);
  }
  const css = readFileSync(path.join(DECK, "lib/fonts.css"), "utf8");
  assert.match(css, /Typing-Cyr-2026-Regular\.woff2/);
  assert.match(css, /Typing-Cyr-2026-Bold\.woff2/);
  const faces = css.match(/@font-face\{[^}]*Typing-Cyr-2026[^}]*\}/g) || [];
  assert.equal(faces.length, 2);
  for (const face of faces) assert.match(face, /unicode-range:\s*U\+0400-04FF/);
});

test("the .qd class names the Cyrillic family first", () => {
  const css = readFileSync(path.join(DECK, "lib/w05-fx.css"), "utf8");
  assert.match(css, /\.qd[^{]*\{[^}]*font-family:\s*'Typing Cyrillic'\s*,\s*'Typing'/);
});

test("every Cyrillic character in deck-copy.json is in the subset", () => {
  const copyFile = path.resolve(HERE, "../workshop05/deck-src/deck-copy.json");
  const text = strings(JSON.parse(readFileSync(copyFile, "utf8"))).join("\n");
  assert.deepEqual(missing(text).map(hex), []);
});

test("every Cyrillic character in the visible text of the built decks (and in each .qd element) is in the subset", () => {
  for (const file of ["slides.html", "en/slides.html"]) {
    const html = readFileSync(path.join(DECK, file), "utf8");
    assert.deepEqual(missing(visibleText(html)).map(hex), [], `${file} visible text`);
    const quotes = [...html.matchAll(/<[a-z0-9]+[^>]*class="[^"]*\bqd\b[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/g)].map((m) => m[1]).join("\n");
    assert.deepEqual(missing(quotes).map(hex), [], `${file} .qd elements`);
  }
});

test("on the main slides Cyrillic appears on two slides only, the evidence wall (why) and the notice of the letter, every quote with its translation beside it", () => {
  for (const file of ["slides.html", "en/slides.html"]) {
    const html = readFileSync(path.join(DECK, file), "utf8");
    const main = html.split(/<section\b/).filter((s) => /data-kind="main"/.test(s.slice(0, 400)));
    const withCyrillic = main.filter((s) => /[\u0400-\u04FF]/.test(visibleText(s)));
    assert.deepEqual(withCyrillic.map((s) => /id="([a-z0-9]+)"/.exec(s)[1]), ["why", "letter"], `${file}: Cyrillic on the why and the letter slide only`);
    for (const slide of withCyrillic) {
      const quotes = [...slide.matchAll(/class="(?:[^"]* )?qd(?: [^"]*)?"[^>]*>([^<]*)</g)].map((m) => m[1]);
      const glosses = [...slide.matchAll(/class="(?:[^"]* )?qd-gloss(?: [^"]*)?"/g)];
      assert.ok(quotes.some((q) => /[\u0400-\u04FF]/.test(q)), `${file}: a Cyrillic .qd string`);
      const foreign = quotes.filter((q) => /[\u0400-\u04FF]/.test(q));
      assert.ok(glosses.length >= foreign.length, `${file}: every Cyrillic quote has its translation (${foreign.length} quotes, ${glosses.length} glosses)`);
    }
  }
});
