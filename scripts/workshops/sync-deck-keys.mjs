#!/usr/bin/env node
// Copies scripts/workshops/deck-keys.js into every workshop deck that uses it
// (packages/website/public/workshops/<slug>/lib/deck-keys.js) and checks that each
// deck loads it before its stage script and names itself with data-deck-id.
// Usage: node scripts/workshops/sync-deck-keys.mjs [--check]
// --check exits 1 on any drift (no files are written).
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
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
