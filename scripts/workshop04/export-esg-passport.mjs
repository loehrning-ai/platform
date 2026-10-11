#!/usr/bin/env node
/**
 * Publishes Workshop 04 ("Answer ESG by Friday") from its course source into
 * packages/website/public/workshops/esg-berichte-mit-ki/.
 *
 * Only allowlisted files leave the source: the deck (slides.html, its lib/ and the assets it
 * loads) and the participant kit as a deterministic ZIP. Nothing else in the source folder
 * (course notes, presenter material, answer keys, build scripts) is ever read for publication.
 * Text is rewritten in three reviewed places only:
 *   - the co-branding "loehrning.ai × <partner>" becomes "loehrning.ai";
 *   - the deck's fonts point at the woff2 statics already inventoried for this folder;
 *   - the questionnaire ships as CSV (the publication guards refuse .xlsx), and the two lines
 *     that name its file say .csv.
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
import { questionnaireCsv } from "./questionnaire-csv.mjs";

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
  "lib/cover-globe.css",
  "lib/esg.css",
  "lib/deck-stage.js",
  "lib/esg.js",
  "assets/favicon.svg",
  "assets/globe.svg",
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

/** Kit files as they sit in the source kit folder. The .xlsx is published as CSV. */
export const KIT_SOURCE_FILES = [
  "START-HERE.md",
  "project-instructions.md",
  "inbox/1-customer-questionnaire.xlsx",
  "inbox/2-website-claims.md",
  "inbox/3-bank-esg-form.md",
  "project-files/01-company-profile.md",
  "project-files/02-people-2025.md",
  "project-files/03-electricity-bills-2025.csv",
  "project-files/04-fuel-log-2025.csv",
  "project-files/05-waste-and-water-2025.md",
  "project-files/06-policies.md",
  "project-files/07-certificates.md",
  "project-files/08-emission-factors.md",
  "project-files/09-solar-quote.md",
  "project-files/10-vsme-basic-headings.md",
  "project-files/11-eu-green-claims-rules.md",
];
const QUESTIONNAIRE_XLSX = "inbox/1-customer-questionnaire.xlsx";
const QUESTIONNAIRE_CSV = "inbox/1-customer-questionnaire.csv";

/** Kit entries as published inside vardar-oak-esg-kit.zip. */
export const KIT_FILES = KIT_SOURCE_FILES.map((name) => (name === QUESTIONNAIRE_XLSX ? QUESTIONNAIRE_CSV : name));

/** Every file the published folder holds, and nothing else. */
export const PUBLISHED_FILES = [...DECK_TEXT_FILES, PORTRAIT, ...KEPT_FILES, POSTER, ZIP_NAME].sort();

/** "loehrning.ai × <partner>": the partner's name stays out of this public repository. */
const CO_BRANDING = /loehrning\.ai × [A-Za-z0-9-]+/g;
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
  [/facilitator|run-of-show|answer[ -]key|ground-truth|rescue\//i, "presenter-only material"],
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
  if (name === "slides.html") out = replaceExpected(out, /1-customer-questionnaire\.xlsx/g, "1-customer-questionnaire.csv", name);
  if (name === "lib/tokens.css") {
    for (const [ttf, woff2] of FONT_FILES) {
      out = replaceExpected(out, `url('../assets/fonts/${ttf}') format('truetype')`, `url('../assets/fonts/${woff2}') format('woff2')`, name);
    }
  }
  return out;
}

function kitText(name, text) {
  if (name === "START-HERE.md") return replaceExpected(text, /1-customer-questionnaire\.xlsx/g, "1-customer-questionnaire.csv", name);
  return text;
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
    if (name === QUESTIONNAIRE_XLSX) return [QUESTIONNAIRE_CSV, Buffer.from(questionnaireCsv(bytes))];
    return [name, Buffer.from(kitText(name, bytes.toString("utf8")))];
  });
  for (const [name, bytes] of kit) assertClean(`${ZIP_NAME}/${name}`, bytes);
  written.set(ZIP_NAME, buildKitArchive(kit));

  for (const [name, bytes] of written) assertClean(name, bytes);
  const names = [...written.keys()].sort();
  if (JSON.stringify(names) !== JSON.stringify(PUBLISHED_FILES)) throw new Error("Export does not match the published file list");
  return written;
}

/** Files whose manifest row follows the file; every other row must already match its bytes. */
const GENERATED_ASSETS = new Set([ZIP_NAME, POSTER, "card-preview.webp"]);

/** ASSET_MANIFEST.json rows for this folder: generated rows refreshed, stale rows dropped, the kit added. */
export function manifestText(written) {
  const manifestPath = path.join(REPO_ROOT, "ASSET_MANIFEST.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const prefix = `${WORKSHOP_RELATIVE}/`;
  const zipPath = `${prefix}${ZIP_NAME}`;
  const assets = [];
  let zipSeen = false;
  for (const entry of manifest.assets) {
    if (!entry.path.startsWith(prefix)) {
      assets.push(entry);
      continue;
    }
    const name = entry.path.slice(prefix.length);
    if (name === ZIP_NAME) zipSeen = true;
    const bytes = written.get(name);
    if (!bytes) continue;
    if (!GENERATED_ASSETS.has(name) && (entry.sha256 !== sha256(bytes) || entry.sizeBytes !== bytes.length)) {
      throw new Error(`${entry.path} no longer matches its reviewed ASSET_MANIFEST.json row`);
    }
    assets.push({ ...entry, sizeBytes: bytes.length, sha256: sha256(bytes) });
  }
  if (!zipSeen) {
    const bytes = written.get(ZIP_NAME);
    const at = assets.findIndex((entry) => entry.path === `${prefix}card-preview.webp`);
    const row = {
      path: zipPath,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
      owner: "Tim Löhr",
      source: "Original Answer ESG by Friday workshop material (Workshop 04 participant kit, invented company data), exported by scripts/workshop04/export-esg-passport.mjs, owner-authorized loehrning.ai publication",
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
