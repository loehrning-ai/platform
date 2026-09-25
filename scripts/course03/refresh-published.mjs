#!/usr/bin/env node
/**
 * Refresh the repository-derived files of the published Data Readiness workshop
 * without the external course source.
 *
 * Writes the learner guide, the builder page and builder kit, the kit README,
 * rights and publication notes, then regenerates data-readiness-kit.zip,
 * bundle-manifest.json and this workshop's ASSET_MANIFEST.json rows (including
 * card-preview.webp) from the published files.
 *
 * Edited an exported file (deck, console, lab, worksheets)? Record it first:
 *   node scripts/course03/overrides.mjs capture
 *
 * Usage (from the repository root):
 *   node scripts/course03/refresh-published.mjs           write every drifted file
 *   node scripts/course03/refresh-published.mjs --check   report drift, write nothing
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildKitArchive, kitArchiveFiles } from "./kit-archive.mjs";
import { check as checkOverrides, isRepositoryAuthored, loadOverrides } from "./overrides.mjs";
import { KIT_ASSET_RIGHTS, KIT_README, PUBLICATION } from "./published-text.mjs";
import {
  assetManifestText, assetRows, BUILDER_KIT_SOURCE, BUILDER_PAGE_SOURCE, bundleManifestText,
  DEMO_PAGE_SOURCE, GUIDE_SOURCE, listFiles, portraitRecord, TYPING_WOFF2_SOURCE, WORKSHOP_RELATIVE,
} from "./publication.mjs";

export function planRefresh(root) {
  const target = path.join(root, WORKSHOP_RELATIVE);
  const problems = checkOverrides(root);
  const { exported } = loadOverrides(root).manifest;

  // Repository-authored surfaces.
  const authored = new Map([
    ["data-readiness-kit/README.md", Buffer.from(KIT_README)],
    ["data-readiness-kit/ASSET-RIGHTS.md", Buffer.from(KIT_ASSET_RIGHTS)],
    ["PUBLICATION.md", Buffer.from(PUBLICATION)],
    ["guide.html", readFileSync(path.join(root, GUIDE_SOURCE))],
    ["builder.html", readFileSync(path.join(root, BUILDER_PAGE_SOURCE))],
    ["demo.html", readFileSync(path.join(root, DEMO_PAGE_SOURCE))],
    // The site's own Typing woff2 builds, used by the three pages above before the course TTF statics.
    ...["Regular", "Medium", "Bold"].map((weight) => [`assets/fonts/Typing-${weight}.woff2`, readFileSync(path.join(root, TYPING_WOFF2_SOURCE, `Typing-${weight}.woff2`))]),
  ]);
  const builderFiles = listFiles(path.join(root, BUILDER_KIT_SOURCE));
  for (const name of builderFiles) authored.set(`data-readiness-kit/builder/${name}`, readFileSync(path.join(root, BUILDER_KIT_SOURCE, name)));

  // Current published files, with the authored ones replaced in memory.
  const files = new Map();
  const removals = [];
  for (const name of listFiles(target)) {
    if (name === "bundle-manifest.json") continue;
    if (name.startsWith("data-readiness-kit/builder/") && !authored.has(name)) {
      removals.push(name);
      continue;
    }
    if (!isRepositoryAuthored(name) && !(name in exported)) problems.push(`${name}: unreviewed public file (neither exported nor repository-authored)`);
    files.set(name, readFileSync(path.join(target, name)));
  }
  for (const name of Object.keys(exported)) if (!files.has(name)) problems.push(`${name}: exported file is missing`);
  if (!files.has("card-preview.webp")) problems.push("card-preview.webp: missing");
  for (const [name, bytes] of authored) files.set(name, bytes);
  files.set("data-readiness-kit.zip", buildKitArchive(kitArchiveFiles(builderFiles).map((name) => [name, files.get(`data-readiness-kit/${name}`)])));

  for (const [name, bytes] of files) {
    if (/\.(?:css|csv|html|js|json|md|py|sql|txt|yml)$/.test(name) && /(?:\/Users|\/home)\//.test(bytes.toString())) problems.push(`${name}: local authoring path`);
  }

  const previous = JSON.parse(readFileSync(path.join(target, "bundle-manifest.json"), "utf8"));
  const writes = new Map();
  for (const name of [...authored.keys(), "data-readiness-kit.zip"]) writes.set(path.join(WORKSHOP_RELATIVE, name), files.get(name));
  writes.set(path.join(WORKSHOP_RELATIVE, "bundle-manifest.json"), Buffer.from(bundleManifestText(previous.sourceHashes, files)));
  writes.set("ASSET_MANIFEST.json", Buffer.from(assetManifestText(root, assetRows(files, portraitRecord(root).record))));

  const drift = [...writes].filter(([file, bytes]) => !existsSync(path.join(root, file)) || !readFileSync(path.join(root, file)).equals(bytes)).map(([file]) => file);
  return { problems, removals: removals.map((name) => path.join(WORKSHOP_RELATIVE, name)), writes, drift };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const checkOnly = process.argv.includes("--check");
  const { problems, removals, writes, drift } = planRefresh(root);
  if (problems.length) {
    console.error(`Refresh blocked:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  if (checkOnly) {
    if (drift.length || removals.length) {
      const stale = [...drift, ...removals.map((file) => `${file} (remove)`)];
      const shown = stale.slice(0, 12).map((file) => `- ${file}`);
      if (stale.length > shown.length) shown.push(`- and ${stale.length - shown.length} more`);
      console.error(`Published workshop is stale; run node scripts/course03/refresh-published.mjs\n${shown.join("\n")}`);
      process.exit(1);
    }
    console.log("Published Data Readiness workshop is up to date.");
  } else {
    for (const file of removals) rmSync(path.join(root, file));
    for (const file of drift) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      writeFileSync(path.join(root, file), writes.get(file));
    }
    const shown = drift.slice(0, 12).map((file) => `- ${file}`);
    if (drift.length > shown.length) shown.push(`- and ${drift.length - shown.length} more`);
    console.log(`Refreshed ${drift.length} files, removed ${removals.length}.${shown.length ? `\n${shown.join("\n")}` : ""}`);
  }
}
