#!/usr/bin/env node
// Copies the shared deck engine (scripts/workshops/deck-engine/) into the lib/ folder of every deck
// that runs it, so the decks can never drift apart: packages/website/public/workshops/<slug>/lib/<file>.
//
// Usage: node scripts/workshops/sync-deck-engine.mjs [--check] [--deck <slug>]
//   --check        writes nothing, exits 1 when any listed deck's copy differs from the source
//   --deck <slug>  also syncs (or checks) one deck that is not listed yet, e.g. while porting it
//
// A deck joins by adding its slug to ENGINE_DECKS, at the moment its pages load these files.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCopy } from "./sync-frame.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
export const ENGINE_DIR = path.join(here, "deck-engine");

/** Every engine file, published as lib/<name> in each deck. */
export const ENGINE_FILES = [
  "deck-stage.js",
  "scenes.js",
  "globe.js",
  "geo.js",
  "presenter.js",
  "presenter.css",
  "engine.css",
  "icons.svg",
];

/** Decks whose lib/ must equal the engine byte for byte. */
export const ENGINE_DECKS = ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"];

export const engineSourcePath = (name) => path.join(ENGINE_DIR, name);
export const engineCopyPath = (slug, name) => path.join(repo, "packages/website/public/workshops", slug, "lib", name);

/** [slug, file] pairs whose copy is missing or differs from the source. */
export function engineDrift(slugs = ENGINE_DECKS) {
  const drift = [];
  for (const name of ENGINE_FILES) {
    const bytes = readFileSync(engineSourcePath(name));
    for (const slug of slugs) if (!(readCopy(engineCopyPath(slug, name))?.equals(bytes) ?? false)) drift.push([slug, name]);
  }
  return drift;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const at = args.indexOf("--deck");
  const extra = at >= 0 ? args[at + 1] : null;
  if (at >= 0 && !/^[a-z0-9-]+$/.test(extra ?? "")) {
    console.error("--deck needs a workshop slug");
    process.exit(2);
  }
  const slugs = extra && !ENGINE_DECKS.includes(extra) ? [...ENGINE_DECKS, extra] : ENGINE_DECKS;
  const drift = engineDrift(slugs);
  if (check) {
    for (const [slug, name] of drift) console.error(`drift: ${path.relative(repo, engineCopyPath(slug, name))} differs from scripts/workshops/deck-engine/${name}`);
    if (drift.length) process.exit(1);
    return;
  }
  for (const [slug, name] of drift) {
    writeFileSync(engineCopyPath(slug, name), readFileSync(engineSourcePath(name)));
    console.log(`wrote ${path.relative(repo, engineCopyPath(slug, name))}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
