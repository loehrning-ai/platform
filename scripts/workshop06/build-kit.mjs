#!/usr/bin/env node
/**
 * Builds the kit of Workshop 06 ("Welches Angebot ist günstiger?") into
 * packages/website/public/workshops/angebote-mit-ki-vergleichen/angebote-vergleichen-kit.zip.
 *
 * The kit was built with rotfaden (example angebote-mit-ki-vergleichen); scripts/workshop06/kit/ holds its
 * files byte for byte, except CHANGELOG.md (PORT-LOG.md, item 10). Two files come from this site instead
 * (PORT-LOG.md, items 2 to 4):
 *
 *   take-home/skill/angebote-vergleichen/SKILL.md   packages/website/content/skills/angebote-vergleichen/SKILL.md
 *   take-home/INSTALL.md                             the site's install text, claudeUiMarkdown("de", ...)
 *
 * The archive is written with the site's one zip writer (src/lib/zip/store.ts: STORE, CRC-32, 1980-01-01,
 * UTF-8 names), entries in byte order under angebote-vergleichen-kit/, and passes the repository's zip
 * inspection before it is written.
 *
 * Usage (from the repository root):
 *   node scripts/workshop06/build-kit.mjs           writes the zip
 *   node scripts/workshop06/build-kit.mjs --check   writes nothing and exits 1 when the zip differs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";
import { claudeUiMarkdown } from "../../packages/website/src/lib/claude-ui.ts";
import { zipStore } from "../../packages/website/src/lib/zip/store.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const WEBSITE = path.join(REPO_ROOT, "packages/website");
export const SLUG = "angebote-mit-ki-vergleichen";
export const KIT_NAME = "angebote-vergleichen-kit";
export const ZIP_NAME = `${KIT_NAME}.zip`;
export const SKILL_NAME = "angebote-vergleichen";
export const SOURCE_DIR = path.join(HERE, "kit");
export const ZIP_PATH = path.join(WEBSITE, "public/workshops", SLUG, ZIP_NAME);
export const SKILL_SOURCE = path.join(WEBSITE, "content/skills", SKILL_NAME, "SKILL.md");
export const SKILL_KIT_PATH = `take-home/skill/${SKILL_NAME}/SKILL.md`;
export const INSTALL_KIT_PATH = "take-home/INSTALL.md";

/** Every rotfaden file of the kit, and nothing else. */
export const KIT_FILES = [
  "ANSWERS.md",
  "CHANGELOG.md",
  "START-HERE.md",
  "fall/anfrage.md",
  "fall/angebot-a-nuernberg.md",
  "fall/angebot-b-poznan.md",
  "fall/angebot-c-brno.md",
  "fall/kosten-intern.md",
  "fall/zweiter-fall.csv",
  "karten/feldkarte.md",
  "kostenzeilen.csv",
  "schritte.md",
  "sheets/feldkarte.html",
  "take-home/projekt-anweisungen.md",
  "take-home/prompt.md",
  "vorlagen/vergleichsbasis.md",
  "vorlagen/verhandlungsmail.md",
];

/**
 * The install text of the kit: where the skill is, then the site's steps, in German and then in English
 * (the English page hands out the same zip). Each block is claudeUiMarkdown verbatim.
 */
export function installText() {
  return [
    "# In deinem eigenen Claude einrichten",
    "",
    `Der Skill liegt in diesem Kit unter ${SKILL_KIT_PATH}. Zum Hochladen in claude.ai lädst du ${SKILL_NAME}.zip`,
    `von loehrning.ai/skills/${SKILL_NAME}.zip oder von der Demo-Seite. Die Schritte folgen.`,
    "",
    claudeUiMarkdown("de", SKILL_NAME),
    "",
    "# Set it up in your own Claude",
    "",
    `The skill sits in this kit under ${SKILL_KIT_PATH}. To upload it to claude.ai, download ${SKILL_NAME}.zip`,
    `from loehrning.ai/skills/${SKILL_NAME}.zip or from the demo page. The steps follow.`,
    "",
    claudeUiMarkdown("en", SKILL_NAME),
  ].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function sourceFiles(dir = SOURCE_DIR, base = "") {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    return statSync(full).isDirectory() ? sourceFiles(full, rel) : [rel];
  });
}

/** Path inside the kit folder to its bytes, in byte order. */
export function kitEntries() {
  const present = sourceFiles().filter((name) => !name.endsWith(".DS_Store")).sort();
  if (JSON.stringify(present) !== JSON.stringify([...KIT_FILES].sort())) {
    throw new Error(`scripts/workshop06/kit differs from KIT_FILES.\nsource:   ${present.join(", ")}\nexpected: ${KIT_FILES.join(", ")}`);
  }
  const entries = [
    ...KIT_FILES.map((file) => [file, new Uint8Array(readFileSync(path.join(SOURCE_DIR, file)))]),
    [INSTALL_KIT_PATH, new TextEncoder().encode(installText())],
    [SKILL_KIT_PATH, new Uint8Array(readFileSync(SKILL_SOURCE))],
  ];
  return entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

export function buildKit() {
  const bytes = zipStore(kitEntries().map(([file, data]) => ({ path: `${KIT_NAME}/${file}`, data })));
  inspectZipArchive(Buffer.from(bytes), { label: ZIP_NAME });
  return Buffer.from(bytes);
}

/** The file's bytes, or null when it does not exist yet (read once, no separate exists check). */
function readIfPresent(file) {
  try {
    return readFileSync(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function main() {
  const check = process.argv.includes("--check");
  const bytes = buildKit();
  const current = readIfPresent(ZIP_PATH);
  if (current?.equals(bytes)) {
    console.log(`${path.relative(REPO_ROOT, ZIP_PATH)} is up to date (${bytes.length} bytes)`);
    return;
  }
  if (check) {
    console.error(`${path.relative(REPO_ROOT, ZIP_PATH)} differs from scripts/workshop06/kit; run node scripts/workshop06/build-kit.mjs`);
    process.exit(1);
  }
  writeFileSync(ZIP_PATH, bytes);
  console.log(`wrote ${path.relative(REPO_ROOT, ZIP_PATH)} (${bytes.length} bytes)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
