#!/usr/bin/env node
// Copies scripts/workshops/deck-keys.js into every workshop deck that uses it
// (packages/website/public/workshops/<slug>/lib/deck-keys.js) and checks that each
// deck loads it before its stage script and names itself with data-deck-id. A deck
// with its own engine (DECK_KEYS_EQUIVALENT) is checked against its pinned file.
// Usage: node scripts/workshops/sync-deck-keys.mjs [--check]
// --check exits 1 on any drift (no files are written).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCopy } from "./sync-frame.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
export const DECK_KEYS_SOURCE = path.join(here, "deck-keys.js");

/** The page of each workshop that follows the key contract: its deck, or W01's lab. */
export const DECK_KEYS_PAGES = {
  "ki-prognosen-einschaetzen": "hands-on.html",
};

/** Decks wired to the shared key contract. Add a slug when a deck adopts it (W4 and W5 builders). */
export const DECK_KEYS_WORKSHOPS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "datenbereitschaft-fuer-ki",
  "esg-berichte-mit-ki",
  "audit-vorbereitung-mit-ki",
];

/**
 * Decks that keep their own engine and are held to the contract by an explicit, tested equivalence
 * instead of the shared file. Workshop 06's deck is rotfaden's single-file output, published byte for
 * byte: it binds the five contract keys the same way (ArrowRight, ArrowLeft, r or Shift+R, P, Escape
 * out of an appendix; never with Ctrl, Meta or Alt, never in a text field, a held key fires once) and
 * binds more on top: ArrowDown, PageDown and Space also go forward, ArrowUp, PageUp and Shift+Space
 * back, and while its presenter view is open G, T, B, F, the digits and ? work there. The pinned
 * hash makes any change to the file a deliberate one, re-checked by tests/e2e/deck-keys.spec.ts.
 */
export const DECK_KEYS_EQUIVALENT = {
  "angebote-mit-ki-vergleichen": {
    page: "slides.html",
    sha256: "2bb4a11e9dda9e5c19a6db00459a1f0179b30889f98bb04a2f9ce978f8ccb878",
    extraKeys: ["ArrowDown", "PageDown", "Space", "ArrowUp", "PageUp", "Shift+Space"],
    /** The handler lines that carry the five contract keys. */
    contract: [
      "if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;",
      "const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown']), PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);",
      "if (e.repeat) { if (nav) e.preventDefault(); return; }",
      "else if (k === 'R' || k === 'r') { e.preventDefault(); press(reset); }",
      "else if (k === 'p' || k === 'P') togglePresenter();",
      "else if (k === 'Escape') { if (scenes[cur].kind === 'appendix') press(leaveAppendix);",
    ],
  },
};

/** Problems with a deck held by equivalence; empty while it is the pinned file with the contract lines. */
export function equivalenceProblems(slug, bytes) {
  const entry = DECK_KEYS_EQUIVALENT[slug];
  if (!entry) return [`${slug}: no key equivalence is declared`];
  const problems = [];
  const text = bytes.toString("utf8");
  for (const line of entry.contract) if (!text.includes(line)) problems.push(`${slug}/${entry.page}: the key handler lost "${line}"`);
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== entry.sha256) problems.push(`${slug}/${entry.page} changed (sha256 ${sha}): re-check the key equivalence, then update its pin`);
  return problems;
}

export const deckFolder = (slug) => path.join(repo, "packages/website/public/workshops", slug);
export const deckKeysCopyPath = (slug) => path.join(deckFolder(slug), "lib/deck-keys.js");

/** Problems with how slides.html loads the keys; empty when the wiring is right. */
export function wiringProblems(slug, slidesHtml, page = "slides.html") {
  const problems = [];
  const keys = slidesHtml.indexOf('src="./lib/deck-keys.js"');
  const stage = slidesHtml.indexOf('src="./lib/deck-stage.js"');
  if (keys === -1) problems.push(`${slug}/${page} does not load ./lib/deck-keys.js`);
  else if (stage !== -1 && keys > stage) problems.push(`${slug}/${page} loads deck-keys.js after deck-stage.js`);
  const html = slidesHtml.match(/<html\b[^>]*>/)?.[0] ?? "";
  if (!html.includes(`data-deck-id="${slug}"`)) problems.push(`${slug}/${page}: <html> needs data-deck-id="${slug}"`);
  return problems;
}

function main() {
  const check = process.argv.includes("--check");
  const bytes = readFileSync(DECK_KEYS_SOURCE);
  const problems = [];
  for (const slug of DECK_KEYS_WORKSHOPS) {
    const target = deckKeysCopyPath(slug);
    if (!(readCopy(target)?.equals(bytes) ?? false)) {
      if (check) problems.push(`drift: ${path.relative(repo, target)} differs from scripts/workshops/deck-keys.js`);
      else {
        writeFileSync(target, bytes);
        console.log(`wrote ${path.relative(repo, target)}`);
      }
    }
    const page = DECK_KEYS_PAGES[slug] ?? "slides.html";
    problems.push(...wiringProblems(slug, readFileSync(path.join(deckFolder(slug), page), "utf8"), page));
  }
  for (const [slug, entry] of Object.entries(DECK_KEYS_EQUIVALENT)) {
    problems.push(...equivalenceProblems(slug, readFileSync(path.join(deckFolder(slug), entry.page))));
  }
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
