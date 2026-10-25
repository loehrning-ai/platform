#!/usr/bin/env node
/**
 * Builds the kit of Workshop 01 ("KI-Prognosen prüfen, bevor danach geplant wird") from
 * scripts/workshop01/kit/{de,en}/ into
 *
 *   packages/website/public/workshops/ki-prognosen-einschaetzen/prognose-pruefen.zip   (DE)
 *   packages/website/public/workshops/ki-prognosen-einschaetzen/forecast-check.zip     (EN)
 *
 * and writes the files the site derives from the same sources, so nothing can drift:
 *
 *   src/lib/demo-cases/ki-prognosen-einschaetzen/kit-series.ts   the kit CSV and its SHA-256 for the demo
 *   content/vorlagen/pruefregel.md, content/vorlagen/en/release-rule.md   the blank rule as a template
 *
 * Generated members of each zip:
 *   pruefen.py                          the code block of content/skills/prognose-pruefen/SKILL.md, byte for byte
 *   claude/prognose-pruefen/SKILL.md    content/skills/prognose-pruefen/SKILL.md, byte for byte
 *   (no nested skill zip: the publication scanner forbids archives in archives; the
 *    install doc points at /skills/prognose-pruefen.zip, built from the same SKILL.md)
 *   {{CLAUDE_UI}} in START-*.md         claudeUiMarkdown(locale, "prognose-pruefen") from src/lib/claude-ui.ts
 *
 * The CSV in scripts/workshop01/data/ is the source of truth for every number; it is not
 * regenerated. All zips go through the site's one STORE writer (src/lib/zip/store.ts), so
 * the bytes are deterministic. Runs under Node type stripping.
 *
 * Usage (from the repository root):
 *   node scripts/workshop01/build-kit.mjs           writes everything
 *   node scripts/workshop01/build-kit.mjs --check   writes nothing, exits 1 when anything differs
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
const PUBLIC_DIR = path.join(SITE, "public/workshops", SLUG);

/** The two editions: same tree, file names in the edition's language, the CSV byte-identical. */
export const EDITIONS = {
  de: {
    root: "prognose-pruefen",
    zip: "prognose-pruefen.zip",
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
    [edition.csv, readFileSync(CSV_PATH)],
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
  return [
    "/**",
    " * GENERATED by scripts/workshop01/build-kit.mjs from scripts/workshop01/data/linsensuppe-woechentlich.csv.",
    " * Do not edit: change the CSV, rebuild, and regenerate the fixtures in __fixtures__/.",
    " * The demo parses this text with the same parser it uses for a visitor's own file.",
    " */",
    "",
    `export const KIT_CSV_SHA256 = ${JSON.stringify(sha)};`,
    "",
    `export const KIT_CSV = ${JSON.stringify(csv)};`,
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [file, bytes] of outputs()) {
    const rel = path.relative(REPO_ROOT, file);
    const same = existsSync(file) && readFileSync(file).equals(bytes);
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
