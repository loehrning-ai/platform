#!/usr/bin/env node
/**
 * Publishes Workshop 04 ("Answer ESG by Friday") from its course source into
 * packages/website/public/workshops/esg-berichte-mit-ki/.
 *
 * Only allowlisted files leave the source: the deck (slides.html, its lib/ and the assets it
 * loads), the phone game sheet and the participant kit as a reviewed ZIP. Trainer notes, PDFs and
 * build scripts are never copied. A site-ready package keeps its compressed ZIP byte for byte and
 * gets the reviewed padded slide-counter format; source-built decks receive the partner/font/path
 * edits below. The export fails before writing anything if a client name or local path survives.
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/export-esg-passport.mjs <site-ready-workshop-folder>
 *   node scripts/workshop04/export-esg-passport.mjs <site-ready-workshop-folder> --check
 * --check writes nothing and exits 1 when the published folder differs from a fresh export.
 */
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildKitArchive, KIT_NAME, readKitArchive, ZIP_NAME } from "./kit-archive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const SLUG = "esg-berichte-mit-ki";
export const WORKSHOP_RELATIVE = `packages/website/public/workshops/${SLUG}`;
export const WORKSHOP_DIR = path.join(REPO_ROOT, WORKSHOP_RELATIVE);

/** Deck text files copied from the source, in the order the deck loads them. */
export const DECK_TEXT_FILES = [
  "slides.html",
  "sheet.html",
  "lib/tokens.css",
  "lib/deck.css",
  "lib/esg.css",
  "lib/deck-stage.js",
  "lib/esg.js",
  "lib/geo.js",
  "lib/globe.js",
  "assets/favicon.svg",
  "assets/lockup-horizontal.svg",
  "assets/brainster-logo.svg",
  "assets/kit-qr.svg",
];

/**
 * Repository-authored deck changes. The course source (outside this repository) does not carry them, so the
 * export re-applies full copies from scripts/workshop04/overlay/ after its own transforms:
 *  - slides.html and lib/deck-stage.js: the back-to-workshop button, Shift+R and P keys, the presenter hook and the
 *    speaker notes in the Time/Say/Students/Cue/Remember format. OVERLAY_ORIGINAL pins the export output each copy
 *    was made against; if the source changed underneath, the export stops so both versions can be reconciled by hand.
 *  - presenter.html, lib/presenter.js, lib/presenter.css: the presenter view, repository-authored (no original).
 */
export const OVERLAY_DIR = path.join(HERE, "overlay");
export const OVERLAY_ORIGINAL = {
  "slides.html": "7a7365a5566d2b69688cca1d57a8afa72838413dd7c99b8c9020a17a16ad90d1",
  "lib/deck-stage.js": "69597c2ca285211609b06f8881fcb1cbbd6997a9cca28a2d44e1315a03568199",
};
export const OVERLAY_NEW_FILES = ["presenter.html", "lib/presenter.css", "lib/presenter.js"];

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
 * The deck's Typing faces, copied byte for byte from Workshop 01, where they are already
 * inventoried. They are the woff2 builds of the same Typing 2.0 the course source sets, so the
 * public deck keeps the source's line breaks (the 2.1 statics run wider and broke lines).
 */
export const FONT_SOURCE_RELATIVE = "packages/website/public/workshops/ki-prognosen-einschaetzen/assets/fonts";
export const REUSED_FONTS = [
  "assets/fonts/Typing-Regular.woff2",
  "assets/fonts/Typing-Medium.woff2",
  "assets/fonts/Typing-SemiBold.woff2",
  "assets/fonts/Typing-Bold.woff2",
];

/**
 * Files this folder already publishes and the export keeps byte for byte: the mono font with
 * the licence notices, and the poster card (generated in this repository by
 * packages/website/scripts/plakat/build-cards.mjs).
 */
export const KEPT_FILES = [
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
  "ANSWERS.md",
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

/** Kit entries as published inside crvena-zemja-esg-kit.zip. */
export const KIT_FILES = [...KIT_SOURCE_FILES];

/** Every file the published folder holds, and nothing else. */
export const PUBLISHED_FILES = [...DECK_TEXT_FILES, ...OVERLAY_NEW_FILES, ...DECK_IMAGES, PORTRAIT, ...REUSED_FONTS, ...KEPT_FILES, POSTER, ZIP_NAME].sort();

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
  [/Tim Löhr · [A-Za-z]+ · 16 October 2026 · 60 minutes/, "Tim Löhr · North Macedonia · 16 October 2026 · 60 minutes", "cover date line"],
  [/Workshop 04 · [A-Za-z]+ · 16 October 2026/, "Workshop 04 · North Macedonia · 16 October 2026", "closing date line"],
  [/content="Workshop 04 for [A-Za-z]+: /, 'content="Workshop 04, held in North Macedonia: ', "page description"],
  [/<p class="s17-kitt">[A-Za-z]+ sends you the kit link today\.<\/p>/, '<p class="s17-kitt">Download the kit from the workshop page.</p>', "closing kit line"],
  [/\.\/assets\/\.\.\/crvena-zemja-esg-kit\/inbox\/4-september-invoice\.png/, "./assets/proof/september-invoice.png", "invoice photo path"],
  // The published deck links participants to the kit rather than trainer-only working notes.
  [/<p class="t-label">Expected status \(answer key\)<\/p>/, '<p class="t-label">Expected status (START-HERE.md)</p>', "expected-status label"],
  [/<p class="t-src">answer key, step 4<br \/>/, '<p class="t-src">kit: START-HERE.md, step 4<br />', "step 4 source line"],
  [/one short line from the answer key under the tag/, "one short line from the expected results under the tag", "style comment"],
];

/** Case names retired because they collided with real companies; none may come back. */
const RETIRED_CASE_NAMES = /Trei Dealuri|Banca Nistru|Valea Sturzilor|valea-sturzilor|Exempla|Energo Codru|Solar Codru|Vardar Oak|vardar-oak/i;
const FONT_FILES = [
  ["Typing-Regular.ttf", "Typing-Regular.woff2"],
  ["Typing-Medium.ttf", "Typing-Medium.woff2"],
  ["Typing-SemiBold.ttf", "Typing-SemiBold.woff2"],
  ["Typing-Bold.ttf", "Typing-Bold.woff2"],
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
  [/facilitator|run-of-show|ground-truth|rescue\/|admin\//i, "presenter-only material"],
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

/** Keep the published deck counter readable and padded across single- and double-digit slides. */
function preparedDeckText(name, text) {
  if (name !== "lib/deck-stage.js") return text;
  let out = replaceExpected(
    text,
    '.count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }',
    '.count .sep { color: rgba(255,255,255,0.45); margin: 0; font-weight: 400; }',
    `${name} (counter spacing)`,
  );
  out = replaceExpected(
    out,
    '<span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>',
    '<span class="count" aria-live="polite"><span class="current">01</span><span class="sep"> / </span><span class="total">01</span></span>',
    `${name} (counter format)`,
  );
  out = replaceExpected(
    out,
    'this._totalEl.textContent = String(this._slides.length || 1);',
    'this._totalEl.textContent = pad2(this._slides.length || 1);',
    `${name} (total format)`,
  );
  return replaceExpected(
    out,
    'this._countEl.textContent = String(curr + 1);',
    'this._countEl.textContent = pad2(curr + 1);',
    `${name} (current format)`,
  );
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
  // Open once without following a symlink, then check and read that same handle.
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
  // Brainster is now an expressly requested workshop partner. Permit only its
  // accessible logo label and asset reference; keep the hashed client guard elsewhere.
  const clientCheckText = text
    .replace(/\balt="Brainster"/g, "")
    .replaceAll("assets/brainster-logo.svg", "");
  if (mentionsClient(clientCheckText)) throw new Error(`client name in ${name}`);
  for (const [pattern, label] of FORBIDDEN) {
    if (pattern.test(text)) throw new Error(`${label} in ${name}`);
  }
}

/** Builds the full published folder in memory: Map<publishedPath, Buffer>. */
export async function exportWorkshop(source) {
  if (!source || !existsSync(path.join(source, "slides.html"))) {
    throw new Error("Usage: node scripts/workshop04/export-esg-passport.mjs <site-ready-workshop-folder> [--check]");
  }
  const written = new Map();
  const prebuiltPackage = existsSync(path.join(source, "sheet.html")) && existsSync(path.join(source, ZIP_NAME));
  for (const name of DECK_TEXT_FILES) {
    const text = readSourceFile(source, name).toString("utf8");
    written.set(name, Buffer.from(prebuiltPackage ? preparedDeckText(name, text) : deckText(name, text)));
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
  for (const name of REUSED_FONTS) {
    written.set(name, readSourceFile(path.join(REPO_ROOT, FONT_SOURCE_RELATIVE), path.basename(name)));
  }

  const suppliedArchive = path.join(source, ZIP_NAME);
  if (existsSync(suppliedArchive)) {
    const archive = readSourceFile(source, ZIP_NAME);
    const entries = readKitArchive(archive);
    const names = entries.map(([name]) => name).sort();
    if (JSON.stringify(names) !== JSON.stringify([...KIT_FILES].sort())) {
      throw new Error(`${ZIP_NAME} differs from the reviewed kit file list`);
    }
    for (const [name, bytes] of entries) assertClean(`${ZIP_NAME}/${name}`, bytes);
    written.set(ZIP_NAME, archive);
  } else {
    const kitDir = path.join(source, KIT_NAME);
    checkKitFolder(kitDir);
    const kit = KIT_SOURCE_FILES.map((name) => {
      const bytes = readSourceFile(kitDir, name);
      if (name.endsWith(".png")) assertPlainPng(name, bytes);
      return [name, bytes];
    });
    for (const [name, bytes] of kit) assertClean(`${ZIP_NAME}/${name}`, bytes);
    written.set(ZIP_NAME, buildKitArchive(kit));
  }

  for (const [name, original] of Object.entries(OVERLAY_ORIGINAL)) {
    const overlay = readSourceFile(OVERLAY_DIR, name);
    const exported = written.get(name);
    if (!exported) throw new Error(`Overlay for ${name}, which this export does not write`);
    if (sha256(exported) !== original && !exported.equals(overlay)) {
      throw new Error(`The course source changed ${name} since its overlay was made. Reconcile scripts/workshop04/overlay/${name} by hand, then update OVERLAY_ORIGINAL.`);
    }
    written.set(name, overlay);
  }
  for (const name of OVERLAY_NEW_FILES) written.set(name, readSourceFile(OVERLAY_DIR, name));

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
  for (const name of REUSED_FONTS) {
    if (seen.has(name)) continue;
    const reviewed = manifest.assets.find((entry) => entry.path === `${FONT_SOURCE_RELATIVE}/${path.basename(name)}`);
    if (!reviewed || reviewed.sha256 !== sha256(written.get(name))) throw new Error(`${name}: no matching reviewed row under ${FONT_SOURCE_RELATIVE}`);
    const at = assets.findIndex((entry) => entry.path === `${prefix}assets/fonts/JetBrainsMono-var.woff2`);
    assets.splice(at === -1 ? assets.length : at, 0, { ...reviewed, path: `${prefix}${name}` });
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
