#!/usr/bin/env node
/**
 * Publishes the Workshop 04 deck ("ESG-Berichte mit KI", v3) into
 * packages/website/public/workshops/esg-berichte-mit-ki/.
 *
 * The input is the course source's built deck folder (German at the root, English in en/). Only
 * the allowlisted files leave it. The export fills two placeholders the source leaves open:
 *   {{claude-ui:<path>}}  one string from src/lib/claude-ui.ts (CLAUDE_UI_DE or CLAUDE_UI_EN by edition)
 *   {{qr:<url>}}          an inline SVG QR code for a loehrning.ai URL
 * and adds lib/deck-keys.js from scripts/workshops/deck-keys.js, the cover block of lib/tokens.css
 * and the poster (packages/website/scripts/plakat). The fonts, the poster card and the two kit zips
 * (scripts/workshop04/kit-v3.mjs) are kept byte for byte. A file the folder holds for a decision
 * outside this export (HELD_PATH_SHA256) is neither written nor removed, and its manifest row stays.
 * The export fails before writing anything if a client name, a local path or an open placeholder
 * survives.
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/export-esg-passport.mjs <course-deck-site-folder>
 *   node scripts/workshop04/export-esg-passport.mjs <course-deck-site-folder> --check
 * --check writes nothing and exits 1 when the published folder differs from a fresh export.
 */
import { createHash } from "node:crypto";
import { closeSync, constants, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CLAUDE_UI_DE, CLAUDE_UI_EN } from "../../packages/website/src/lib/claude-ui.ts";
import { KIT_NAME, readKitArchive, ZIP_NAME } from "./kit-archive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const SLUG = "esg-berichte-mit-ki";
export const WORKSHOP_RELATIVE = `packages/website/public/workshops/${SLUG}`;
export const WORKSHOP_DIR = path.join(REPO_ROOT, WORKSHOP_RELATIVE);

/** The deck, as the course source builds it: German at the root, English in en/. */
export const DECK_FILES = [
  "slides.html",
  "en/slides.html",
  "presenter.html",
  "en/presenter.html",
  "sheet.html",
  "lib/deck-stage.js",
  "lib/scenes.js",
  "lib/deck.css",
  "lib/tokens.css",
  "lib/presenter.js",
  "lib/presenter.css",
  "assets/favicon.svg",
];

/** The shared key contract, copied from the repository (scripts/workshops/sync-deck-keys.mjs checks it). */
export const DECK_KEYS = "lib/deck-keys.js";
export const DECK_KEYS_SOURCE = path.join(REPO_ROOT, "scripts/workshops/deck-keys.js");

/** The Typing faces, copied byte for byte from Workshop 01, where they are inventoried. */
export const FONT_SOURCE_RELATIVE = "packages/website/public/workshops/ki-prognosen-einschaetzen/assets/fonts";
export const REUSED_FONTS = [
  "assets/fonts/Typing-Regular.woff2",
  "assets/fonts/Typing-Medium.woff2",
  "assets/fonts/Typing-SemiBold.woff2",
  "assets/fonts/Typing-Bold.woff2",
];

/** Files this folder already publishes and the export keeps byte for byte. */
export const KEPT_FILES = [
  "assets/fonts/JetBrainsMono-var.woff2",
  "assets/fonts/OFL-1.1.txt",
  "assets/fonts/OFL-1.1-JetBrainsMono.txt",
  "card-preview.webp",
];

/** The cover poster the site's workshop cards show, generated from src/lib/plakat. */
export const POSTER = "assets/plakat-cover.svg";

/** The two participant kits (v3), built by scripts/workshop04/kit-v3.mjs and kept byte for byte. */
export const KIT_V3_ZIPS = { "crvena-zemja-nachweisprobe.zip": "crvena-zemja-nachweisprobe/", [ZIP_NAME]: `${KIT_NAME}/` };

/**
 * sha256 of the published path of each file held for an owner decision: the export neither writes
 * nor removes it, nothing it writes links to it, and its ASSET_MANIFEST.json row stays as it is.
 * Only the hash is written here, so the path's words never enter this repository's source.
 */
export const HELD_PATH_SHA256 = new Set(["8c626bef58fd20e9c340b56e9b85052618d59e3467cef8433e314dfb5f0e0c50"]);

/** Every file the export writes, and nothing else. */
export const PUBLISHED_FILES = [...DECK_FILES, DECK_KEYS, ...REUSED_FONTS, ...KEPT_FILES, POSTER, ...Object.keys(KIT_V3_ZIPS)].sort();

/** Size budget per edition (deck spec §7), in bytes. */
export const BUDGET = { "slides.html": 160_000, "en/slides.html": 160_000, "lib/scenes.js": 14_000, "lib/presenter.js": 15_000 };

/** Case names retired because they collided with real companies; none may come back. */
const RETIRED_CASE_NAMES = /Trei Dealuri|Banca Nistru|Valea Sturzilor|valea-sturzilor|Exempla|Energo Codru|Solar Codru|Vardar Oak|vardar-oak/i;

/**
 * sha256 of the partner's name in lower case. The guard hashes every nine-letter run of every
 * word in a published file, so the name itself never has to be written into this repository.
 */
export const CLIENT_NAME_SHA256 = "f8dbeed3ff06ea864e4172b306f049fafc873576c4752d3e77bb8e4752f130e7";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
  [/\/Users\/|\/home\/[a-z]|\/private\/(?:tmp|var)/, "local path"],
  [/facilitator|run-of-show|ground-truth|rescue\/|admin\//i, "presenter-only material"],
  [/_obsidian\b|\bCLAUDE\.md|\bAGENTS\.md/, "internal reference"],
  [RETIRED_CASE_NAMES, "retired case name"],
];

/** Fails on a client name, a local path or presenter-only words in any text the export writes. */
export function assertClean(name, bytes) {
  if (!/\.(?:css|csv|html|js|md|svg|txt)$/.test(name)) return;
  const text = bytes.toString("utf8");
  if (mentionsClient(text)) throw new Error(`client name in ${name}`);
  for (const [pattern, label] of FORBIDDEN) {
    if (pattern.test(text)) throw new Error(`${label} in ${name}`);
  }
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
  let fd;
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (error?.code === "ELOOP") throw new Error(`Not a regular file: ${name}`);
    throw error;
  }
  try {
    if (!fstatSync(fd).isFile()) throw new Error(`Not a regular file: ${name}`);
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** Every file below `dir`, as sorted forward-slash paths. */
export function listFiles(dir, prefix = "") {
  if (!existsSync(path.join(dir, prefix))) return [];
  return readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(dir, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]))
    .sort();
}

export const isHeld = (name) => HELD_PATH_SHA256.has(sha256(name));

const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The string at a dotted path of the edition's Claude UI copy ("app.steps.0"). */
export function claudeUi(lang, dotted) {
  const value = dotted.split(".").reduce((node, key) => (node == null ? undefined : node[key]), lang === "en" ? CLAUDE_UI_EN : CLAUDE_UI_DE);
  if (typeof value !== "string") throw new Error(`{{claude-ui:${dotted}}} names no string in src/lib/claude-ui.ts`);
  return value;
}

const requireFromSite = createRequire(path.join(REPO_ROOT, "packages/website/package.json"));

/** An inline, deterministic QR code for a loehrning.ai URL, drawn in Druckschwarz on Kalkweiß. */
export async function qrSvg(url) {
  if (!/^https:\/\/loehrning\.ai\/[a-z0-9/-]*$/.test(url)) throw new Error(`QR codes point to loehrning.ai only: ${url}`);
  const svg = await requireFromSite("qrcode").toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#121212ff", light: "#f3f0e9ff" } });
  return svg.trim().replace("<svg ", `<svg role="img" aria-label="QR: ${escapeHtml(url.replace("https://", ""))}" `);
}

/** Fills the source's placeholders in one deck page. */
export async function fillPlaceholders(name, text) {
  const lang = name.startsWith("en/") ? "en" : "de";
  let out = text.replace(/\{\{claude-ui:([a-z0-9.]+)\}\}/gi, (_whole, dotted) => escapeHtml(claudeUi(lang, dotted)));
  for (const [whole, url] of [...out.matchAll(/\{\{qr:([^}]+)\}\}/g)]) out = out.replace(whole, await qrSvg(url));
  if (/\{\{[^}]*\}\}/.test(out)) throw new Error(`${name} keeps an open placeholder`);
  return out;
}

/** Builds the full published folder in memory: Map<publishedPath, Buffer>. */
export async function exportWorkshop(source) {
  if (!source || !existsSync(path.join(source, "slides.html")) || !existsSync(path.join(source, "en/slides.html"))) {
    throw new Error("Usage: node scripts/workshop04/export-esg-passport.mjs <course-deck-site-folder> [--check]");
  }
  const written = new Map();
  for (const name of DECK_FILES) {
    const text = readSourceFile(source, name).toString("utf8");
    written.set(name, Buffer.from(name.endsWith(".html") ? await fillPlaceholders(name, text) : text));
  }
  written.set(DECK_KEYS, readFileSync(DECK_KEYS_SOURCE));

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
  for (const name of REUSED_FONTS) {
    written.set(name, readSourceFile(path.join(REPO_ROOT, FONT_SOURCE_RELATIVE), path.basename(name)));
  }
  for (const [zip, prefix] of Object.entries(KIT_V3_ZIPS)) {
    if (!existsSync(path.join(WORKSHOP_DIR, zip))) throw new Error(`${WORKSHOP_RELATIVE}/${zip} is missing; build it with scripts/workshop04/kit-v3.mjs`);
    const archive = readSourceFile(WORKSHOP_DIR, zip);
    for (const [name, bytes] of readKitArchive(archive, { prefix })) assertClean(`${zip}/${name}`, bytes);
    written.set(zip, archive);
  }

  for (const [name, bytes] of written) {
    assertClean(name, bytes);
    if (name.endsWith(".html") && /assets\/[a-z-]+-logo\.svg/.test(bytes.toString("utf8"))) throw new Error(`${name} links a logo file`);
  }
  for (const [name, limit] of Object.entries(BUDGET)) {
    if (written.get(name).length > limit) throw new Error(`${name} is ${written.get(name).length} bytes, over its budget of ${limit}`);
  }
  const names = [...written.keys()].sort();
  if (JSON.stringify(names) !== JSON.stringify(PUBLISHED_FILES)) throw new Error("Export does not match the published file list");
  return written;
}

/** Files whose manifest row follows the file; every other row must already match its bytes. */
const GENERATED_ASSETS = new Set([...Object.keys(KIT_V3_ZIPS), POSTER, "card-preview.webp"]);

/** ASSET_MANIFEST.json rows for this folder: generated rows refreshed, rows of retired files dropped, held rows kept. */
export function manifestText(written) {
  const manifestPath = path.join(REPO_ROOT, "ASSET_MANIFEST.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const prefix = `${WORKSHOP_RELATIVE}/`;
  const assets = [];
  for (const entry of manifest.assets) {
    if (!entry.path.startsWith(prefix)) {
      assets.push(entry);
      continue;
    }
    const name = entry.path.slice(prefix.length);
    if (isHeld(name)) {
      assets.push(entry);
      continue;
    }
    const bytes = written.get(name);
    if (!bytes) continue;
    if (!GENERATED_ASSETS.has(name) && (entry.sha256 !== sha256(bytes) || entry.sizeBytes !== bytes.length)) {
      throw new Error(`${entry.path} no longer matches its reviewed ASSET_MANIFEST.json row`);
    }
    assets.push({ ...entry, sizeBytes: bytes.length, sha256: sha256(bytes) });
  }
  const text = JSON.stringify({ ...manifest, assets }, null, 2).replace(/[\u007f-￿]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `${text}\n`;
}

/** Differences between the published folder and an export: [path, reason][]. Held files are skipped. */
export function drift(written) {
  const present = listFiles(WORKSHOP_DIR).filter((name) => !isHeld(name));
  const problems = [];
  for (const name of present) if (!written.has(name)) problems.push([name, "not part of the export"]);
  for (const [name, bytes] of written) {
    const file = path.join(WORKSHOP_DIR, name);
    if (!existsSync(file)) problems.push([name, "missing"]);
    else if (!readFileSync(file).equals(bytes)) problems.push([name, "differs"]);
  }
  return problems;
}

function listDirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => [path.join(dir, entry.name), ...listDirs(path.join(dir, entry.name))]);
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
