#!/usr/bin/env node
// Copies scripts/workshops/workshop-frame.css into every workshop folder that uses it
// (packages/website/public/workshops/<slug>/lib/workshop-frame.css).
// Usage: node scripts/workshops/sync-frame.mjs [--check]
// --check exits 1 when a copy differs from the source (no files are written).
// Never copy into assets/: that path is served immutable for a year.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const source = path.join(here, "workshop-frame.css");

/** Workshop folders that link lib/workshop-frame.css. Add a slug here when a workshop adopts the frame. */
export const FRAME_WORKSHOPS = ["ki-prognosen-einschaetzen", "geschaeftsberichte-mit-ki-lesen"];

export function frameCopyPath(slug) {
  return path.join(repo, "packages/website/public/workshops", slug, "lib/workshop-frame.css");
}

function main() {
  const check = process.argv.includes("--check");
  const bytes = readFileSync(source);
  let drift = 0;
  for (const slug of FRAME_WORKSHOPS) {
    const target = frameCopyPath(slug);
    const same = existsSync(target) && readFileSync(target).equals(bytes);
    if (same) continue;
    if (check) {
      drift += 1;
      console.error(`drift: ${path.relative(repo, target)} differs from scripts/workshops/workshop-frame.css`);
    } else {
      writeFileSync(target, bytes);
      console.log(`wrote ${path.relative(repo, target)}`);
    }
  }
  if (check && drift) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
