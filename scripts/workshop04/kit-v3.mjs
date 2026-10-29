#!/usr/bin/env node
/**
 * Builds the two participant kits of Workshop 04 (v3, "Nachweisprobe") into
 * packages/website/public/workshops/esg-berichte-mit-ki/:
 *   crvena-zemja-nachweisprobe.zip   German edition
 *   crvena-zemja-esg-kit.zip         English edition (keeps the URL the deck and handouts print)
 *
 * The case files come from the private course source (its kit-v3/ folder, passed as the first
 * argument). The take-home files come from this repository, so the kit and the website can never
 * differ: the skill (content/skills/esg-nachweise/SKILL.md), the templates (content/vorlagen/esg-*)
 * and the install steps (claudeUiMarkdown, substituted for {{CLAUDE_UI}} in the start file).
 *
 * The archives are deterministic (stored entries, one fixed date, sorted paths) and pass the
 * repository's ZIP inspection. The script also refreshes the two ASSET_MANIFEST.json rows.
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/kit-v3.mjs <course-kit-v3-folder>           writes both zips
 *   node scripts/workshop04/kit-v3.mjs <course-kit-v3-folder> --check   exits 1 when a zip differs
 */
import { createHash } from "node:crypto";
import { closeSync, constants, existsSync, fstatSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claudeUiMarkdown } from "../../packages/website/src/lib/claude-ui.ts";
import { assertClean, assertPlainPng, listFiles } from "./export-esg-passport.mjs";
import { buildKitArchive, readKitArchive } from "./kit-archive.mjs";
import { prepareCaseGuide, prepareStartGuide } from "./kit-guide.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
const WEBSITE = path.join(REPO_ROOT, "packages/website");
export const WORKSHOP_RELATIVE = "packages/website/public/workshops/esg-berichte-mit-ki";
export const KIT_V3_RELEASE_DATE = "2026-10-25";
export const SKILL_NAME = "esg-nachweise";
const CLAUDE_UI_PLACEHOLDER = "{{CLAUDE_UI}}";

/** Case files per edition: the same 22 files, line for line, in two languages. */
const CASE_FILES = {
  de: [
    "START-HIER.md",
    "projektanweisungen.md",
    "ordner/firmenprofil.md",
    "ordner/strom_2025.csv",
    "ordner/strom_zusammenfassung_entwurf.txt",
    "ordner/wasser_2025.csv",
    "ordner/bio_zertifikat_weinberg.txt",
    "ordner/kompensation_2025.txt",
    "ordner/pv_angebot_2026.txt",
    "ordner/flaschen.csv",
    "ordner/personal_2025.csv",
    "ordner/arbeitsschutz_2025.txt",
    "ordner/richtlinien_und_compliance.txt",
    "ordner/regeln_werbeaussagen.md",
    "ordner/vsme_basismodul.md",
    "anfragen/1-fragebogen-nordvik.md",
    "anfragen/2-werbeaussagen.md",
    "anfragen/3-bankformular.md",
    "nachreichung/rechnung-EL-25-09.png",
    "loesungen/LOESUNGEN.md",
    "mitnehmen/nachweisregister-vorlage.csv",
  ],
  en: [
    "START-HERE.md",
    "project-instructions.md",
    "files/company_profile.md",
    "files/electricity_2025.csv",
    "files/electricity_summary_draft.txt",
    "files/water_2025.csv",
    "files/organic_certificate_vineyard.txt",
    "files/carbon_offsets_2025.txt",
    "files/solar_offer_2026.txt",
    "files/bottles.csv",
    "files/headcount_2025.csv",
    "files/health_safety_2025.txt",
    "files/policies_and_compliance.txt",
    "files/green_claims_rules.md",
    "files/vsme_basic_module.md",
    "requests/1-nordvik-questionnaire.md",
    "requests/2-marketing-claims.md",
    "requests/3-bank-form.md",
    "late-document/invoice-EL-25-09.png",
    "answers/ANSWERS.md",
    "take-home/evidence-register-template.csv",
  ],
};

/** Files this repository owns, copied byte for byte into the kit: kit path → path under packages/website. */
export const PLATFORM_FILES = {
  de: {
    "nachweisprobe.md": "content/vorlagen/esg-nachweisprobe.md",
    "claude/esg-nachweise/SKILL.md": `content/skills/${SKILL_NAME}/SKILL.md`,
    "mitnehmen/projektanweisungen-vorlage.md": "content/vorlagen/esg-projektanweisungen.md",
    "mitnehmen/ordner-checkliste.md": "content/vorlagen/esg-ordner-checkliste.md",
    "mitnehmen/mail-fehlendes-dokument.md": "content/vorlagen/esg-mail-fehlendes-dokument.md",
  },
  en: {
    "evidence-check.md": "content/vorlagen/en/esg-nachweisprobe.md",
    "claude/esg-nachweise/SKILL.md": `content/skills/${SKILL_NAME}/SKILL.md`,
    "take-home/project-instructions-template.md": "content/vorlagen/en/esg-projektanweisungen.md",
    "take-home/folder-checklist.md": "content/vorlagen/en/esg-ordner-checkliste.md",
    "take-home/email-missing-document.md": "content/vorlagen/en/esg-mail-fehlendes-dokument.md",
  },
};

export const KITS = {
  de: { name: "crvena-zemja-nachweisprobe", start: "START-HIER.md" },
  en: { name: "crvena-zemja-esg-kit", start: "START-HERE.md" },
};

export const zipName = (locale) => `${KITS[locale].name}.zip`;
export const zipPath = (locale) => path.join(REPO_ROOT, WORKSHOP_RELATIVE, zipName(locale));
/** Every path inside one edition, sorted. */
export const kitFiles = (locale) => [...CASE_FILES[locale], ...Object.keys(PLATFORM_FILES[locale])].sort();

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Plain files only: a symlink or a folder where a file belongs stops the build. */
function readPlainFile(root, name) {
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

/** Number of lines as a text editor counts them. */
const lineCount = (bytes) => bytes.toString("utf8").replace(/\n$/, "").split("\n").length;

/** One edition's entries as [pathInsideKit, Buffer] pairs. */
export function kitEntries(locale, sourceRoot) {
  const folder = path.join(sourceRoot, KITS[locale].name);
  const present = listFiles(folder).filter((name) => !name.endsWith(".DS_Store"));
  const unexpected = present.filter((name) => !CASE_FILES[locale].includes(name));
  const missing = CASE_FILES[locale].filter((name) => !present.includes(name));
  if (unexpected.length || missing.length) {
    throw new Error(`${KITS[locale].name} differs from the reviewed list. Unexpected: ${unexpected.join(", ") || "none"}. Missing: ${missing.join(", ") || "none"}.`);
  }
  const entries = CASE_FILES[locale].map((name) => {
    let bytes = readPlainFile(folder, name);
    if (name === KITS[locale].start) {
      const text = bytes.toString("utf8");
      if (text.split(CLAUDE_UI_PLACEHOLDER).length !== 2) throw new Error(`${name} must hold ${CLAUDE_UI_PLACEHOLDER} exactly once`);
      bytes = Buffer.from(prepareStartGuide(locale, text.replace(CLAUDE_UI_PLACEHOLDER, claudeUiMarkdown(locale, SKILL_NAME).trimEnd())));
    }
    if (name.endsWith(".md")) bytes = Buffer.from(prepareCaseGuide(locale, name, bytes.toString("utf8")));
    if (name.endsWith(".png")) assertPlainPng(name, bytes);
    return [name, bytes];
  });
  for (const [name, source] of Object.entries(PLATFORM_FILES[locale])) entries.push([name, readPlainFile(WEBSITE, source)]);
  for (const [name, bytes] of entries) assertClean(`${zipName(locale)}/${name}`, bytes);
  return entries;
}

/** DE and EN are one kit in two languages: every case file has the same number of lines. */
export function assertLineParity(de, en) {
  const deMap = new Map(de);
  const enMap = new Map(en);
  CASE_FILES.de.forEach((name, index) => {
    if (name.endsWith(".png")) return;
    const other = CASE_FILES.en[index];
    const [a, b] = [lineCount(deMap.get(name)), lineCount(enMap.get(other))];
    if (a !== b) throw new Error(`Line drift: ${name} has ${a} lines, ${other} has ${b}`);
  });
}

export function buildKits(sourceRoot) {
  const de = kitEntries("de", sourceRoot);
  const en = kitEntries("en", sourceRoot);
  assertLineParity(de, en);
  return {
    de: buildKitArchive(de, { isoDate: KIT_V3_RELEASE_DATE, prefix: `${KITS.de.name}/` }),
    en: buildKitArchive(en, { isoDate: KIT_V3_RELEASE_DATE, prefix: `${KITS.en.name}/` }),
  };
}

/** Refresh repo-owned copy without requiring the private authoring checkout. */
export function refreshPublishedKits() {
  return Object.fromEntries(["de", "en"].map((locale) => {
    const entries = readKitArchive(readFileSync(zipPath(locale)), { prefix: `${KITS[locale].name}/` });
    const refreshed = entries.map(([name, bytes]) => {
      if (name === KITS[locale].start) {
        const currentUi = bytes.toString("utf8").replace(/(## (?:Claude einrichten|Set up Claude)\n)[\s\S]*?(?=\n## (?:Mit Codex|With Codex)|$)/, (_, heading) => `${heading}\n${claudeUiMarkdown(locale, SKILL_NAME).trimEnd()}\n`);
        bytes = Buffer.from(prepareStartGuide(locale, currentUi));
      }
      if (PLATFORM_FILES[locale][name]) bytes = readPlainFile(WEBSITE, PLATFORM_FILES[locale][name]);
      if (name.endsWith(".md")) bytes = Buffer.from(prepareCaseGuide(locale, name, bytes.toString("utf8")));
      assertClean(`${zipName(locale)}/${name}`, bytes);
      return [name, bytes];
    });
    return [locale, buildKitArchive(refreshed, { isoDate: KIT_V3_RELEASE_DATE, prefix: `${KITS[locale].name}/` })];
  }));
}

const ROW_SOURCE = {
  de: "Original Workshop 04 participant kit, German edition (invented company data), built by scripts/workshop04/kit-v3.mjs, owner-authorized loehrning.ai publication",
  en: "Original Workshop 04 participant kit, English edition (invented company data), built by scripts/workshop04/kit-v3.mjs, owner-authorized loehrning.ai publication",
};

/** ASSET_MANIFEST.json with the rows of both zips refreshed (added next to each other when new). */
export function manifestWithKits(manifestText, zips) {
  const manifest = JSON.parse(manifestText);
  const assets = [...manifest.assets];
  for (const locale of ["en", "de"]) {
    const rowPath = `${WORKSHOP_RELATIVE}/${zipName(locale)}`;
    const bytes = zips[locale];
    const row = {
      path: rowPath,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
      owner: "Tim Löhr",
      source: ROW_SOURCE[locale],
      license: "LicenseRef-Loehrning-Brand",
      redistribution: "Included for loehrning.ai course operation; no standalone reuse rights granted",
    };
    const at = assets.findIndex((entry) => entry.path === rowPath);
    if (at !== -1) assets[at] = { ...assets[at], ...row };
    else {
      const anchor = assets.findIndex((entry) => entry.path === `${WORKSHOP_RELATIVE}/${zipName("en")}`);
      assets.splice(anchor === -1 ? assets.length : anchor, 0, row);
    }
  }
  const text = JSON.stringify({ ...manifest, assets }, null, 2).replace(/[\u007f-￿]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `${text}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const refresh = args.includes("--refresh-published");
  const source = args.find((arg) => !arg.startsWith("--"));
  if (!refresh && (!source || !existsSync(path.join(source, KITS.de.name)))) {
    throw new Error("Usage: node scripts/workshop04/kit-v3.mjs <course-kit-v3-folder> [--check], or --refresh-published [--check]");
  }
  const zips = refresh ? refreshPublishedKits() : buildKits(path.resolve(source));
  const manifestPath = path.join(REPO_ROOT, "ASSET_MANIFEST.json");
  const manifestBefore = readFileSync(manifestPath, "utf8");
  const manifestAfter = manifestWithKits(manifestBefore, zips);
  if (check) {
    const stale = ["de", "en"].filter((locale) => !existsSync(zipPath(locale)) || !readFileSync(zipPath(locale)).equals(zips[locale]));
    for (const locale of stale) console.error(`${WORKSHOP_RELATIVE}/${zipName(locale)} differs from a fresh build`);
    if (manifestBefore !== manifestAfter) console.error("ASSET_MANIFEST.json: kit rows are stale");
    if (stale.length || manifestBefore !== manifestAfter) process.exit(1);
    console.log("Both Workshop 04 kits match a fresh build.");
    return;
  }
  for (const locale of ["de", "en"]) writeFileSync(zipPath(locale), zips[locale]);
  writeFileSync(manifestPath, manifestAfter);
  console.log(`Wrote ${zipName("de")} (${zips.de.length} bytes) and ${zipName("en")} (${zips.en.length} bytes).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
