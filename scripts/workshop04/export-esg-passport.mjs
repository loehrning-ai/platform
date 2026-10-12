#!/usr/bin/env node
/**
 * Publishes Workshop 04 ("Answer ESG by Friday") from its course source into
 * packages/website/public/workshops/esg-berichte-mit-ki/.
 *
 * Only allowlisted files leave the source: the deck (slides.html, its lib/ and the assets it
 * loads) and the participant kit as a deterministic ZIP. Nothing else in the source folder
 * (course notes, presenter material, answer keys, build scripts) is ever read for publication.
 * Text is rewritten in three reviewed places only:
 *   - the partner's co-branding leaves the deck: "loehrning.ai × <partner>" becomes
 *     "loehrning.ai", the partner's logo and its CSS are removed, the room's date lines name
 *     Moldova only, and the closing kit line points at the workshop page (PARTNER_EDITS, which
 *     also points the deck's three mentions of the private answer key at START-HERE.md);
 *   - the deck's fonts point at the woff2 statics already inventoried for this folder;
 *   - the deck's one image path into the kit folder points at the same photo in assets/proof/.
 * The export fails before writing anything if a client name or a local path survives.
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/export-esg-passport.mjs <course-source-directory>
 *   node scripts/workshop04/export-esg-passport.mjs <course-source-directory> --check
 * --check writes nothing and exits 1 when the published folder differs from a fresh export.
 */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildKitArchive, KIT_NAME, ZIP_NAME } from "./kit-archive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const SLUG = "esg-berichte-mit-ki";
export const WORKSHOP_RELATIVE = `packages/website/public/workshops/${SLUG}`;
export const WORKSHOP_DIR = path.join(REPO_ROOT, WORKSHOP_RELATIVE);

/** Deck text files copied from the source, in the order the deck loads them. */
export const DECK_TEXT_FILES = [
  "slides.html",
  "lib/tokens.css",
  "lib/deck.css",
  "lib/esg.css",
  "lib/deck-stage.js",
  "lib/esg.js",
  "lib/geo.js",
  "lib/globe.js",
  "assets/favicon.svg",
  "assets/lockup-horizontal.svg",
  "assets/kit-qr.svg",
];

/**
 * Deck images copied byte for byte: unedited Claude output from the rehearsal (the passport
 * dashboard before and after the late invoice) and the invented invoice photo. PNGs only, and
 * each must carry image chunks alone (no text or EXIF metadata).
 */
export const DECK_IMAGES = [
  "assets/proof/dashboard-before.png",
  "assets/proof/dashboard-after.png",
  "assets/proof/september-invoice.png",
];

/** The portrait the deck's host slide shows: the reviewed file already published with Workshop 02. */
export const PORTRAIT = "assets/tim-loehr.jpg";
export const PORTRAIT_SHA256 = "3df97f11e0ccc2cc6ada1216eeec12c80725764857b011bd3f9ce79e792401c4";

/**
 * Files this folder already publishes and the export keeps byte for byte: the inventoried
 * font statics with their licence notices, and the poster card (generated in this repository
 * by packages/website/scripts/plakat/build-cards.mjs).
 */
export const KEPT_FILES = [
  "assets/fonts/Typing-Static-400.woff2",
  "assets/fonts/Typing-Static-500.woff2",
  "assets/fonts/Typing-Static-600.woff2",
  "assets/fonts/Typing-Static-700.woff2",
  "assets/fonts/JetBrainsMono-var.woff2",
  "assets/fonts/OFL-1.1.txt",
  "assets/fonts/OFL-1.1-JetBrainsMono.txt",
  "card-preview.webp",
];

/** The cover poster, generated from src/lib/plakat (packages/website/scripts/plakat/build-static.mjs). */
export const POSTER = "assets/plakat-cover.svg";

/** Kit files as they sit in the source kit folder, published unchanged inside the ZIP. */
export const KIT_SOURCE_FILES = [
  "START-HERE.md",
  "project-instructions.md",
  "inbox/1-nordvik-questionnaire.md",
  "inbox/2-marketing-claims.md",
  "inbox/3-bank-form.md",
  "inbox/4-september-invoice.png",
  "project-files/carbon_offsets_2025.txt",
  "project-files/company_profile.md",
  "project-files/energy_bills_2025.csv",
  "project-files/energy_summary_2025_draft.txt",
  "project-files/eu_green_claims_rules.md",
  "project-files/health_safety_2025.txt",
  "project-files/hr_headcount_2025.csv",
  "project-files/organic_certificate_vineyard.txt",
  "project-files/packaging_bottles.csv",
  "project-files/policies_and_compliance.txt",
  "project-files/solar_offer_2026.txt",
  "project-files/vsme_basic_headings.md",
  "project-files/water_bills_2025.csv",
];

/** Kit entries as published inside valea-sturzilor-esg-kit.zip. */
export const KIT_FILES = [...KIT_SOURCE_FILES];

/** Every file the published folder holds, and nothing else. */
export const PUBLISHED_FILES = [...DECK_TEXT_FILES, ...DECK_IMAGES, PORTRAIT, ...KEPT_FILES, POSTER, ZIP_NAME].sort();

/** "loehrning.ai × <partner>": the partner's name stays out of this public repository. */
const CO_BRANDING = /loehrning\.ai × [A-Za-z0-9-]+/gi;

/**
 * Reviewed edits that take the partner out of slides.html, as [pattern, replacement, label].
 * Patterns match the partner's markup by shape (class names and file names are matched with a
 * wildcard), so the name itself never has to be written into this repository. Every pattern must
 * match, so a change in the source stops the export instead of leaking.
 */
const PARTNER_EDITS = [
  [/^\[data-n="(?:01|17)"\] \.(?:cv|s17)-[a-z]+ \{ display: block; height: \d+px; width: auto; \}\n(?=(?:\[data-n="01"\] \.cv-x|\n|<\/style>))/gm, "", "partner logo CSS"],
  [/\n *<span class="cv-x">×<\/span>\n *<img src="\.\/assets\/[a-z]+\.png" alt="[A-Za-z]+" class="cv-[a-z]+" \/>/, "", "cover partner logo"],
  [/\n *<span>×<\/span>\n *<img src="\.\/assets\/[a-z]+\.png" alt="[A-Za-z]+" class="s17-[a-z]+" \/>/, "", "closing partner logo"],
  [/Tim Löhr · [A-Za-z]+ Moldova · 16 October 2026 · 60 minutes/, "Tim Löhr · Moldova · 16 October 2026 · 60 minutes", "cover date line"],
  [/Workshop 04 · [A-Za-z]+ Moldova · 16 October 2026/, "Workshop 04 · Moldova · 16 October 2026", "closing date line"],
  [/content="Workshop 04 for [A-Za-z]+ Moldova: /, 'content="Workshop 04, held in Moldova: ', "page description"],
  [/<p class="s17-kitt">[A-Za-z]+ sends you the kit link today\.<\/p>/, '<p class="s17-kitt">Download the kit from the workshop page.</p>', "closing kit line"],
  [/\.\/assets\/\.\.\/valea-sturzilor-esg-kit\/inbox\/4-september-invoice\.png/, "./assets/proof/september-invoice.png", "invoice photo path"],
  // The presenter's answer key stays private; the public kit carries the same expected results in START-HERE.md.
  [/<p class="t-label">Expected status \(answer key\)<\/p>/, '<p class="t-label">Expected status (START-HERE.md)</p>', "expected-status label"],
  [/<p class="t-src">answer key, step 4<br \/>/, '<p class="t-src">kit: START-HERE.md, step 4<br />', "step 4 source line"],
  [/one short line from the answer key under the tag/, "one short line from the expected results under the tag", "style comment"],
];

/** Case names retired because they collided with real companies; none may come back. */
const RETIRED_CASE_NAMES = /Trei Dealuri|Banca Nistru|Exempla|Energo Codru|Solar Codru|Vardar Oak|vardar-oak/i;
const FONT_FILES = [
  ["Typing-Regular.ttf", "Typing-Static-400.woff2"],
  ["Typing-Medium.ttf", "Typing-Static-500.woff2"],
  ["Typing-SemiBold.ttf", "Typing-Static-600.woff2"],
  ["Typing-Bold.ttf", "Typing-Static-700.woff2"],
];

/**
 * sha256 of the partner's name in lower case. The guard hashes every nine-letter run of every
 * word in a published file, so the name itself never has to be written into this repository.
 */
export const CLIENT_NAME_SHA256 = "f8dbeed3ff06ea864e4172b306f049fafc873576c4752d3e77bb8e4752f130e7";

/**
 * A test for one lower-case word of `length` letters, known only by its sha256: true when the
 * text contains it, alone or inside a longer word, in any case.
 */
export function hashedWordGuard(hash, length) {
  return (text) => {
    for (const [word] of text.toLowerCase().matchAll(new RegExp(`[a-z]{${length},}`, "g"))) {
      for (let start = 0; start + length <= word.length; start++) {
        if (sha256(word.slice(start, start + length)) === hash) return true;
      }
    }
    return false;
  };
}

/** True when `text` contains the partner's name. */
export const mentionsClient = hashedWordGuard(CLIENT_NAME_SHA256, 9);

/** Words that must never reach a published file. */
export const FORBIDDEN = [
  [/loehrning\.ai ×/, "co-branding"],
  [/\/Users\/|\/home\/[a-z]/, "local path"],
  [/facilitator|run-of-show|answer[ -]key|ground-truth|rescue\/|admin\//i, "presenter-only material"],
  [RETIRED_CASE_NAMES, "retired case name"],
];

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Returns the text with `from` replaced, and fails when the transform no longer matches. */
function replaceExpected(text, from, to, label) {
  const next = text.replace(from, to);
  if (next === text) throw new Error(`${label}: the reviewed transform no longer matches the source`);
  return next;
}

function deckText(name, text) {
  let out = text;
  if (name === "slides.html" || name === "lib/esg.js") out = replaceExpected(out, CO_BRANDING, "loehrning.ai", name);
  if (name === "slides.html") {
    for (const [pattern, to, label] of PARTNER_EDITS) out = replaceExpected(out, pattern, to, `${name} (${label})`);
  }
  if (name === "lib/tokens.css") {
    for (const [ttf, woff2] of FONT_FILES) {
      out = replaceExpected(out, `url('../assets/fonts/${ttf}') format('truetype')`, `url('../assets/fonts/${woff2}') format('woff2')`, name);
    }
  }
  return out;
}

/** PNG chunks a published image may carry: image data only. */
const PNG_CHUNKS = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "sRGB", "gAMA", "pHYs"]);

/** Fails unless `bytes` is a PNG made of allowlisted chunks only, ending at IEND. */
export function assertPlainPng(name, bytes) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error(`${name} is not a PNG`);
  let cursor = 8;
  while (cursor + 12 <= bytes.length) {
    const type = bytes.subarray(cursor + 4, cursor + 8).toString("latin1");
    if (!PNG_CHUNKS.has(type)) throw new Error(`${name} carries a ${type} chunk (metadata is not published)`);
    cursor += 12 + bytes.readUInt32BE(cursor);
    if (type === "IEND") break;
  }
  if (cursor !== bytes.length) throw new Error(`${name} does not end at its IEND chunk`);
}

/** Plain files only: a symlink or a folder where a file belongs stops the export. */
function readSourceFile(root, name) {
  const file = path.join(root, ...name.split("/"));
  const stat = lstatSync(file);
  if (!stat.isFile()) throw new Error(`Not a regular file: ${name}`);
  return readFileSync(file);
}

/** Every file below `dir`, as sorted forward-slash paths. */
export function listFiles(dir, prefix = "") {
  if (!existsSync(path.join(dir, prefix))) return [];
  return readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(dir, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]))
    .sort();
}

/** The kit folder must hold exactly the reviewed files, so a new file gets a look before it ships. */
function checkKitFolder(kitDir) {
  const present = listFiles(kitDir).filter((name) => !name.endsWith(".DS_Store"));
  const unexpected = present.filter((name) => !KIT_SOURCE_FILES.includes(name));
  const missing = KIT_SOURCE_FILES.filter((name) => !present.includes(name));
  if (unexpected.length || missing.length) {
    throw new Error(`Kit folder differs from the reviewed list. Unexpected: ${unexpected.join(", ") || "none"}. Missing: ${missing.join(", ") || "none"}.`);
  }
}

/** Fails on a client name, a local path or presenter-only words in any text the export writes. */
export function assertClean(name, bytes) {
  if (!/\.(?:css|csv|html|js|md|svg|txt)$/.test(name)) return;
  const text = bytes.toString("utf8");
  if (mentionsClient(text)) throw new Error(`client name in ${name}`);
  for (const [pattern, label] of FORBIDDEN) {
    if (pattern.test(text)) throw new Error(`${label} in ${name}`);
  }
}

/** Builds the full published folder in memory: Map<publishedPath, Buffer>. */
export async function exportWorkshop(source) {
  if (!source || !existsSync(path.join(source, "slides.html"))) {
    throw new Error("Usage: node scripts/workshop04/export-esg-passport.mjs <course-source-directory> [--check]");
  }
  const written = new Map();
  for (const name of DECK_TEXT_FILES) {
    written.set(name, Buffer.from(deckText(name, readSourceFile(source, name).toString("utf8"))));
  }
  for (const name of DECK_IMAGES) {
    const bytes = readSourceFile(source, name);
    assertPlainPng(name, bytes);
    written.set(name, bytes);
  }

  const portrait = readSourceFile(source, PORTRAIT);
  if (sha256(portrait) !== PORTRAIT_SHA256) throw new Error("The host portrait is not the reviewed file");
  written.set(PORTRAIT, portrait);

  const { coverPosterSvg, withCoverBlock, workshopScenes } = await import(
    pathToFileURL(path.join(REPO_ROOT, "packages/website/scripts/plakat/static-lib.mjs")).href
  );
  const scene = workshopScenes().find((entry) => entry.slug === SLUG);
  if (!scene) throw new Error(`No poster scene for ${SLUG} in src/lib/plakat/palettes.ts`);
  written.set("lib/tokens.css", Buffer.from(withCoverBlock(written.get("lib/tokens.css").toString("utf8"), scene.plakat)));
  written.set(POSTER, Buffer.from(coverPosterSvg(scene)));

  for (const name of KEPT_FILES) {
    if (!existsSync(path.join(WORKSHOP_DIR, name))) throw new Error(`${WORKSHOP_RELATIVE}/${name} is missing; restore it from Git`);
    written.set(name, readSourceFile(WORKSHOP_DIR, name));
  }

  const kitDir = path.join(source, KIT_NAME);
  checkKitFolder(kitDir);
  const kit = KIT_SOURCE_FILES.map((name) => {
    const bytes = readSourceFile(kitDir, name);
    if (name.endsWith(".png")) assertPlainPng(name, bytes);
    return [name, bytes];
  });
  for (const [name, bytes] of kit) assertClean(`${ZIP_NAME}/${name}`, bytes);
  written.set(ZIP_NAME, buildKitArchive(kit));

  for (const [name, bytes] of written) assertClean(name, bytes);
  const names = [...written.keys()].sort();
  if (JSON.stringify(names) !== JSON.stringify(PUBLISHED_FILES)) throw new Error("Export does not match the published file list");
  return written;
}

/** Files whose manifest row follows the file; every other row must already match its bytes. */
const GENERATED_ASSETS = new Set([ZIP_NAME, POSTER, "card-preview.webp", ...DECK_IMAGES]);

/** The row a new binary gets when the manifest has none yet. */
const NEW_ROW_SOURCES = {
  [ZIP_NAME]: "Original Answer ESG by Friday workshop material (Workshop 04 participant kit, invented company data), exported by scripts/workshop04/export-esg-passport.mjs, owner-authorized loehrning.ai publication",
  "assets/proof/dashboard-before.png": "Original Answer ESG by Friday workshop material (unedited Claude output from the Workshop 04 rehearsal, invented company data), exported by scripts/workshop04/export-esg-passport.mjs, owner-authorized loehrning.ai publication",
  "assets/proof/dashboard-after.png": "Original Answer ESG by Friday workshop material (unedited Claude output from the Workshop 04 rehearsal, invented company data), exported by scripts/workshop04/export-esg-passport.mjs, owner-authorized loehrning.ai publication",
  "assets/proof/september-invoice.png": "Original Answer ESG by Friday workshop material (photo of an invented invoice, rendered for Workshop 04), exported by scripts/workshop04/export-esg-passport.mjs, owner-authorized loehrning.ai publication",
};

/** ASSET_MANIFEST.json rows for this folder: generated rows refreshed, stale rows dropped, the kit added. */
export function manifestText(written) {
  const manifestPath = path.join(REPO_ROOT, "ASSET_MANIFEST.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const prefix = `${WORKSHOP_RELATIVE}/`;
  const assets = [];
  const seen = new Set();
  for (const entry of manifest.assets) {
    if (!entry.path.startsWith(prefix)) {
      assets.push(entry);
      continue;
    }
    const name = entry.path.slice(prefix.length);
    seen.add(name);
    const bytes = written.get(name);
    if (!bytes) continue;
    if (!GENERATED_ASSETS.has(name) && (entry.sha256 !== sha256(bytes) || entry.sizeBytes !== bytes.length)) {
      throw new Error(`${entry.path} no longer matches its reviewed ASSET_MANIFEST.json row`);
    }
    assets.push({ ...entry, sizeBytes: bytes.length, sha256: sha256(bytes) });
  }
  for (const [name, source] of Object.entries(NEW_ROW_SOURCES)) {
    if (seen.has(name)) continue;
    const bytes = written.get(name);
    const at = assets.findIndex((entry) => entry.path === `${prefix}card-preview.webp`);
    const row = {
      path: `${prefix}${name}`,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
      owner: "Tim Löhr",
      source,
      license: "LicenseRef-Loehrning-Brand",
      redistribution: "Included for loehrning.ai course operation; no standalone reuse rights granted",
    };
    assets.splice(at === -1 ? assets.length : at, 0, row);
  }
  const text = JSON.stringify({ ...manifest, assets }, null, 2).replace(/[\u007f-￿]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `${text}\n`;
}

/** Differences between the published folder and an export: [path, reason][]. */
export function drift(written) {
  const present = listFiles(WORKSHOP_DIR);
  const problems = [];
  for (const name of present) if (!written.has(name)) problems.push([name, "not part of the export"]);
  for (const [name, bytes] of written) {
    const file = path.join(WORKSHOP_DIR, name);
    if (!existsSync(file)) problems.push([name, "missing"]);
    else if (!readFileSync(file).equals(bytes)) problems.push([name, "differs"]);
  }
  return problems;
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const source = args.find((arg) => !arg.startsWith("--"));
  const written = await exportWorkshop(source && path.resolve(source));
  const problems = drift(written);
  const manifest = manifestText(written);
  const manifestStale = readFileSync(path.join(REPO_ROOT, "ASSET_MANIFEST.json"), "utf8") !== manifest;
  if (check) {
    for (const [name, reason] of problems) console.error(`${WORKSHOP_RELATIVE}/${name}: ${reason}`);
    if (manifestStale) console.error("ASSET_MANIFEST.json: rows for this workshop are stale");
    if (problems.length || manifestStale) process.exit(1);
    console.log(`${WORKSHOP_RELATIVE} matches the export (${written.size} files).`);
    return;
  }
  for (const [name, reason] of problems) {
    if (reason === "not part of the export") rmSync(path.join(WORKSHOP_DIR, name));
  }
  for (const [name, bytes] of written) {
    mkdirSync(path.dirname(path.join(WORKSHOP_DIR, name)), { recursive: true });
    writeFileSync(path.join(WORKSHOP_DIR, name), bytes);
  }
  for (const dir of listDirs(WORKSHOP_DIR).reverse()) if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
  writeFileSync(path.join(REPO_ROOT, "ASSET_MANIFEST.json"), manifest);
  console.log(`Exported ${written.size} files to ${WORKSHOP_RELATIVE} (${problems.length} changed or removed).`);
}

function listDirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => [path.join(dir, entry.name), ...listDirs(path.join(dir, entry.name))]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
