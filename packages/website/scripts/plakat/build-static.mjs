#!/usr/bin/env node
/**
 * Static poster materials of the five workshops (Werkzeichnung v2, SPEC §3.15).
 *
 * Writes, from src/lib/plakat (palettes.ts, motifs.ts, poster-svg.ts):
 *   public/workshops/<slug>/assets/plakat-cover.svg
 *     The workshop's portrait poster (400 x 500) with its numeral in outlines,
 *     for the deck cover slide.
 *   public/workshops/<slug>/assets/plakat-strip.svg, only for a workshop in
 *     COVER_BAND_WORKSHOPS: the phone strip of the same poster for a page
 *     that opens with a cover band (none at present).
 *   the --cover-* scene block (ground, ink, mid, and the scene's ink on paper
 *   for the Kopflinie) in
 *     public/workshops/<slug>/lib/tokens.css             every workshop
 *                                                        (Workshop 04: also written by
 *                                                        scripts/workshop04/export-esg-passport.mjs)
 *     scripts/course03/guide.html, builder/page/builder.html, demo/demo.html
 *                                                        (then course03/refresh-published.mjs)
 *     public/workshops/datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html
 *                                                        (then course03/overrides.mjs capture)
 *
 * The palette mapping is WORKSHOP_PLAKAT and nothing else: switching a
 * workshop's scene is one edit in palettes.ts plus a run of this script and
 * scripts/plakat/build-cards.mjs.
 *
 * Usage (from packages/website or anywhere):
 *   node scripts/plakat/build-static.mjs          write every file that would change
 *   node scripts/plakat/build-static.mjs --check  write nothing; exit 1 when a file is stale
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  coverPosterSvg,
  stripPosterSvg,
  PUBLIC_WORKSHOPS,
  REPO,
  withCoverBlock,
  withCoverBlockInHtml,
  workshopScenes,
} from "./static-lib.mjs";

const CHECK = process.argv.includes("--check");

/**
 * Workshops whose static pages open with a cover band (.wf-cover in
 * lib/workshop-frame.css): they also get the phone strip poster.
 */
const COVER_BAND_WORKSHOPS = new Set([]);

/** Extra files that carry the scene block, per workshop slug. */
const SCENE_BLOCK_TARGETS = {
  "datenbereitschaft-fuer-ki": [
    { file: join(REPO, "scripts/course03/guide.html"), kind: "html" },
    { file: join(REPO, "scripts/course03/builder/page/builder.html"), kind: "html" },
    { file: join(REPO, "scripts/course03/demo/demo.html"), kind: "html" },
    { file: join(PUBLIC_WORKSHOPS, "datenbereitschaft-fuer-ki/data-readiness-kit/readiness-lab.html"), kind: "html" },
  ],
};

const outputs = new Map();
for (const scene of workshopScenes()) {
  const folder = join(PUBLIC_WORKSHOPS, scene.slug);
  outputs.set(join(folder, "assets/plakat-cover.svg"), coverPosterSvg(scene));
  if (COVER_BAND_WORKSHOPS.has(scene.slug)) outputs.set(join(folder, "assets/plakat-strip.svg"), stripPosterSvg(scene));
  const tokens = join(folder, "lib/tokens.css");
  outputs.set(tokens, withCoverBlock(readFileSync(tokens, "utf8"), scene.plakat));
  for (const { file, kind } of SCENE_BLOCK_TARGETS[scene.slug] ?? []) {
    const text = readFileSync(file, "utf8");
    outputs.set(file, kind === "html" ? withCoverBlockInHtml(text, scene.plakat) : withCoverBlock(text, scene.plakat));
  }
}

/** One read, no separate existence check: a missing file (ENOENT) reads as null. */
function readIfPresent(file) {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const stale = [];
for (const [file, text] of outputs) {
  const current = readIfPresent(file);
  if (current === text) continue;
  stale.push(relative(REPO, file));
  if (!CHECK) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
}

if (CHECK) {
  if (stale.length) {
    console.error(`Stale poster materials (run node packages/website/scripts/plakat/build-static.mjs):\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Poster materials up to date (${outputs.size} files).`);
} else {
  console.log(stale.length ? `Wrote ${stale.length} files:\n  ${stale.join("\n  ")}` : `Poster materials up to date (${outputs.size} files).`);
  if (stale.some((file) => file.includes("datenbereitschaft-fuer-ki") || file.startsWith("scripts/course03/"))) {
    console.log("Next: node scripts/course03/overrides.mjs capture && node scripts/course03/refresh-published.mjs");
  }
}
