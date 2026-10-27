#!/usr/bin/env node
/**
 * Compiles every demo's tile tracks (src/components/demos/<slug>/tile-motion.ts)
 * to src/components/demos/hub/tile-scenes.css.
 *
 *   bun run demo-tiles:generate   write the file
 *   bun run demo-tiles:check      fail when the committed file is stale
 *
 * Runs under Node type stripping; motion.ts and the tile-motion files import
 * only types, so no resolver is needed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const WEBSITE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(WEBSITE, "src/components/demos/hub/tile-scenes.css");
const load = (relative) => import(pathToFileURL(join(WEBSITE, relative)).href);

const { DEMO_SLUGS } = await load("src/lib/demos.ts");
const { compileAllCss } = await load("src/lib/demo-tiles/motion.ts");

const scenes = [];
for (const [index, slug] of DEMO_SLUGS.entries()) {
  const file = `src/components/demos/${slug}/tile-motion.ts`;
  if (!existsSync(join(WEBSITE, file))) throw new Error(`${file} is missing`);
  const { MOTION } = await load(file);
  scenes.push({ scene: `w0${index + 1}`, motion: MOTION });
}

const css = compileAllCss(scenes);
if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== css) {
    console.error("tile-scenes.css is stale. Run `bun run demo-tiles:generate`.");
    process.exit(1);
  }
  console.log("tile-scenes.css is up to date.");
} else {
  writeFileSync(OUT, css);
  console.log(`wrote ${OUT}`);
}
