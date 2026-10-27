#!/usr/bin/env node
/**
 * Builds the kit of Workshop 01 ("KI-Prognosen prüfen, bevor danach geplant wird") from
 * scripts/workshop01/kit/{de,en}/ into
 *
 *   packages/website/public/workshops/ki-prognosen-einschaetzen/prognose-pruefen-kit.zip   (DE)
 *   packages/website/public/workshops/ki-prognosen-einschaetzen/forecast-check.zip     (EN)
 *
 * and writes the files the site derives from the same sources, so nothing can drift:
 *
 *   src/lib/demo-cases/ki-prognosen-einschaetzen/kit-series.ts   both kit CSVs and their SHA-256 for the demo
 *   content/vorlagen/pruefregel.md, content/vorlagen/en/release-rule.md   the blank rule as a template
 *
 * Generated members of each zip:
 *   pruefen.py                          the code block of content/skills/prognose-pruefen/SKILL.md, byte for byte
 *   claude/prognose-pruefen/SKILL.md    content/skills/prognose-pruefen/SKILL.md, byte for byte
 *   (no nested skill zip: the publication scanner forbids archives in archives; the
 *    install doc points at /skills/prognose-pruefen.zip, built from the same SKILL.md)
 *   {{CLAUDE_UI}} in START-*.md         claudeUiMarkdown(locale, "prognose-pruefen") from src/lib/claude-ui.ts
 *
 * The CSVs in scripts/workshop01/data/ are the source of truth for every number; they are
 * not regenerated. The English one has English column names and notes and the same
 * numbers (kit.test.ts holds the two together). All zips go through the site's one STORE writer (src/lib/zip/store.ts), so
 * the bytes are deterministic. Runs under Node type stripping.
 *
 * Usage (from the repository root):
 *   node scripts/workshop01/build-kit.mjs           writes everything
 *   node scripts/workshop01/build-kit.mjs --check   writes nothing, exits 1 when anything differs
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipStore } from "../../packages/website/src/lib/zip/store.ts";
import { claudeUiMarkdown } from "../../packages/website/src/lib/claude-ui.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const SITE = path.join(REPO_ROOT, "packages/website");
export const SLUG = "ki-prognosen-einschaetzen";
export const SKILL_NAME = "prognose-pruefen";
const SKILL_PATH = path.join(SITE, "content/skills", SKILL_NAME, "SKILL.md");
export const CSV_PATH = path.join(HERE, "data/linsensuppe-woechentlich.csv");
export const CSV_PATH_EN = path.join(HERE, "data/lentil-soup-weekly.csv");
const PUBLIC_DIR = path.join(SITE, "public/workshops", SLUG);

/** The two editions: same tree, file names, column names and notes in the edition's language. */
export const EDITIONS = {
  de: {
    root: "prognose-pruefen-kit",
    zip: "prognose-pruefen-kit.zip",
    csvSource: CSV_PATH,
    csv: "daten/linsensuppe-woechentlich.csv",
    installDoc: "START-HIER.md",
    template: "pruefregel.md",
    files: [
      "START-HIER.md",
      "uebung.md",
      "loesungen.md",
      "pruefregel.md",
      "daten/tool-export.txt",
      "daten/kosten.md",
      "vorlage/meine-daten.csv",
      "claude/projekt-anweisung.md",
    ],
  },
  en: {
    root: "forecast-check",
    zip: "forecast-check.zip",
    csvSource: CSV_PATH_EN,
    csv: "data/lentil-soup-weekly.csv",
    installDoc: "START-HERE.md",
    template: "release-rule.md",
    files: [
      "START-HERE.md",
      "exercise.md",
      "solutions.md",
      "release-rule.md",
      "data/tool-export.txt",
      "data/costs.md",
      "template/my-data.csv",
      "claude/project-instructions.md",
    ],
  },
};

const PLACEHOLDER = "{{CLAUDE_UI}}";

/** The one Python code block of SKILL.md, without its fences. */
export function skillCode(skill) {
  const match = /\n```python\n([\s\S]*?)\n```\n/.exec(skill);
  if (!match) throw new Error("SKILL.md has no ```python block");
  return `${match[1]}\n`;
}

function sourceFiles(dir, base = "") {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    return statSync(full).isDirectory() ? sourceFiles(full, rel) : [rel];
  });
}

export function buildEdition(locale) {
  const edition = EDITIONS[locale];
  const dir = path.join(HERE, "kit", locale);
  const present = sourceFiles(dir).sort();
  const expected = [...edition.files].sort();
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    throw new Error(`kit/${locale} differs from EDITIONS.${locale}.files\nsource:   ${present.join(", ")}\nexpected: ${expected.join(", ")}`);
  }
  const skill = readFileSync(SKILL_PATH, "utf8");
  const members = edition.files.map((file) => {
    let text = readFileSync(path.join(dir, file), "utf8");
    if (file === edition.installDoc) {
      if (!text.includes(PLACEHOLDER)) throw new Error(`${file} has no ${PLACEHOLDER}`);
      text = text.replace(PLACEHOLDER, claudeUiMarkdown(locale, SKILL_NAME));
    } else if (text.includes(PLACEHOLDER)) {
      throw new Error(`${file}: ${PLACEHOLDER} belongs in ${edition.installDoc} only`);
    }
    return [file, text];
  });
  members.push(
    [edition.csv, readFileSync(edition.csvSource)],
    ["pruefen.py", skillCode(skill)],
    [`claude/${SKILL_NAME}/SKILL.md`, skill],
  );
  const entries = members
    .map(([file, data]) => ({ path: `${edition.root}/${file}`, data: typeof data === "string" ? data : new Uint8Array(data) }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return Buffer.from(zipStore(entries));
}

export function kitSeriesSource() {
  const csv = readFileSync(CSV_PATH, "utf8");
  const sha = createHash("sha256").update(readFileSync(CSV_PATH)).digest("hex");
  const csvEn = readFileSync(CSV_PATH_EN, "utf8");
  const shaEn = createHash("sha256").update(readFileSync(CSV_PATH_EN)).digest("hex");
  return [
    "/**",
    " * GENERATED by scripts/workshop01/build-kit.mjs from scripts/workshop01/data/linsensuppe-woechentlich.csv",
    " * and scripts/workshop01/data/lentil-soup-weekly.csv (same numbers, English column names and notes).",
    " * Do not edit: change the CSVs, rebuild, and regenerate the fixtures in __fixtures__/.",
    " * The demo parses this text with the same parser it uses for a visitor's own file.",
    " */",
    "",
    `export const KIT_CSV_SHA256 = ${JSON.stringify(sha)};`,
    "",
    `export const KIT_CSV = ${JSON.stringify(csv)};`,
    "",
    `export const KIT_CSV_EN_SHA256 = ${JSON.stringify(shaEn)};`,
    "",
    `export const KIT_CSV_EN = ${JSON.stringify(csvEn)};`,
    "",
  ].join("\n");
}

/** Every output path and its fresh bytes. */
export function outputs() {
  const out = new Map();
  for (const locale of ["de", "en"]) {
    const edition = EDITIONS[locale];
    out.set(path.join(PUBLIC_DIR, edition.zip), buildEdition(locale));
    const template = readFileSync(path.join(HERE, "kit", locale, edition.template));
    out.set(path.join(SITE, "content/vorlagen", locale === "de" ? "" : "en", edition.template), template);
  }
  out.set(path.join(SITE, "src/lib/demo-cases", SLUG, "kit-series.ts"), Buffer.from(kitSeriesSource(), "utf8"));
  return out;
}

/** The file's bytes, or null when it does not exist: one read, no exists-then-read race. */
function readIfPresent(file) {
  try {
    return readFileSync(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [file, bytes] of outputs()) {
    const rel = path.relative(REPO_ROOT, file);
    const same = readIfPresent(file)?.equals(bytes) ?? false;
    if (check) {
      if (!same) {
        stale += 1;
        console.log(`${rel} differs from a fresh build.`);
      }
    } else if (!same) {
      writeFileSync(file, bytes);
      console.log(`Wrote ${rel} (${bytes.length} bytes).`);
    }
  }
  if (check) {
    console.log(stale === 0 ? "Workshop 01 kit is up to date." : `${stale} file(s) out of date: run node scripts/workshop01/build-kit.mjs`);
    process.exit(stale === 0 ? 0 : 1);
  }
}
