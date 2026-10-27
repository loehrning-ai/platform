#!/usr/bin/env node
/**
 * Builds the two participant kits of Workshop 05 ("Audit Preparation with AI: Organize Evidence and
 * Find Gaps") into packages/website/public/workshops/audit-vorbereitung-mit-ki/:
 *
 *   vardar-audit-kit.zip      English edition, from scripts/workshop05/kit/
 *   vardar-audit-kit-de.zip   German edition: START-HIER, projektanweisungen, LOESUNGEN and the
 *                             nachweis-index template from scripts/workshop05/kit-de/; the request,
 *                             the draft reply and the eleven folder files are the English case files
 *                             (the customer audits in English), under ordner/
 *
 * Both editions carry the skill at claude/audit-nachweise/SKILL.md, byte for byte from
 * packages/website/content/skills/audit-nachweise/SKILL.md; the German one carries the gap request
 * template from content/vorlagen/luecken-anfrage.md. The build also writes the kit texts the demo
 * shows into packages/website/src/lib/demo-cases/audit-vorbereitung-mit-ki/kit.ts, so the demo and the
 * zips carry the same bytes.
 *
 * Each start file holds one marker line, <!-- claude-ui:en --> or <!-- claude-ui:de -->, replaced with
 * claudeUiMarkdown(locale, "audit-nachweise") from packages/website/src/lib/claude-ui.ts.
 *
 * The ZIPs are deterministic: stored entries, UTF-8 names, 0644 file modes, no extra fields, one
 * fixed modification time. Every archive passes the repository's ZIP inspection before it is written.
 *
 * Usage (from the repository root):
 *   node scripts/workshop05/build-kit.mjs           writes both ZIPs and kit.ts
 *   node scripts/workshop05/build-kit.mjs --check   writes nothing and exits 1 when anything differs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "../course03/kit-archive.mjs";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";
import { claudeUiMarkdown } from "../../packages/website/src/lib/claude-ui.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
export const SLUG = "audit-vorbereitung-mit-ki";
export const KIT_NAME = "vardar-audit-kit";
export const KIT_PREFIX = `${KIT_NAME}/`;
export const ZIP_NAME = `${KIT_NAME}.zip`;
export const KIT_NAME_DE = "vardar-audit-kit-de";
export const ZIP_NAME_DE = `${KIT_NAME_DE}.zip`;
export const SKILL_NAME = "audit-nachweise";
export const KIT_RELEASE_DATE = "2026-10-26";
export const SOURCE_DIR = path.join(HERE, "kit");
export const SOURCE_DIR_DE = path.join(HERE, "kit-de");
const WEBSITE = path.join(REPO_ROOT, "packages/website");
const PUBLIC_DIR = path.join(WEBSITE, "public/workshops", SLUG);
export const ZIP_PATH = path.join(PUBLIC_DIR, ZIP_NAME);
export const ZIP_PATH_DE = path.join(PUBLIC_DIR, ZIP_NAME_DE);
export const KIT_TS_PATH = path.join(WEBSITE, "src/lib/demo-cases", SLUG, "kit.ts");
/** Where the skill sits in both kits, the same path as in every workshop kit. */
export const SKILL_KIT_PATH = `claude/${SKILL_NAME}/SKILL.md`;
const SKILL_SOURCE = path.join(WEBSITE, "content/skills", SKILL_NAME, "SKILL.md");
const GAP_TEMPLATE_DE = path.join(WEBSITE, "content/vorlagen/luecken-anfrage.md");

/** The eleven files of the folder, in the order the demo lists them. */
export const FOLDER_FILES = [
  "system-list_2026-09.csv",
  "subprocessors_2026-09.csv",
  "ai-use-rule_v1.md",
  "vendor-page_claude_2026-06-15.md",
  "access-review_2026-08-14.csv",
  "training-records_2026.csv",
  "incident-log_2026.csv",
  "backup-report_2026-10.txt",
  "it-notes_2026-10-06.md",
  "infosec-policy_v3_FINAL.md",
  "infosec-policy_v4_DRAFT.md",
];

/** Every source file of the English kit, and nothing else. */
export const KIT_FILES = [
  "START-HERE.md",
  "ANSWERS.md",
  "project-instructions.md",
  "request_tannwald.md",
  "draft-reply.md",
  ...FOLDER_FILES.map((file) => `folder/${file}`),
  "templates/evidence-index.csv",
  "templates/gap-request.md",
];

/** Every source file of kit-de/: the German texts. The case files come from kit/. */
export const KIT_FILES_DE = ["START-HIER.md", "projektanweisungen.md", "LOESUNGEN.md", "vorlagen/nachweis-index.csv"];

/** The files the demo bundles (kit.ts): the English kit without its start file, plus the German texts. */
export const DEMO_FILES = KIT_FILES.filter((file) => file !== "START-HERE.md");
export const DEMO_FILES_DE = KIT_FILES_DE.filter((file) => file !== "START-HIER.md");

/** A start file with the install text of the site in place of its one marker line. */
export function fillInstallText(text, locale = "en") {
  const marker = `<!-- claude-ui:${locale} -->`;
  if (text.split(marker).length !== 2) throw new Error(`the start file needs the marker ${marker} exactly once`);
  const other = `<!-- claude-ui:${locale === "en" ? "de" : "en"} -->`;
  if (text.includes(other)) throw new Error(`the ${locale} start file must not hold ${other}`);
  return text.replace(marker, claudeUiMarkdown(locale, SKILL_NAME).trimEnd());
}

const INSPECTION = { label: ZIP_NAME, allowSafeUnixMetadata: true };

function dosDateTime(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

export function buildArchive(entries, isoDate = KIT_RELEASE_DATE, prefix = KIT_PREFIX, label = ZIP_NAME) {
  const { time, date } = dosDateTime(isoDate);
  const sorted = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [file, content] of sorted) {
    if (!/^[A-Za-z0-9._\-/]+$/.test(file) || file.split("/").includes("..")) throw new Error(`Not a plain relative path: ${file}`);
    const name = Buffer.from(`${prefix}${file}`, "utf8");
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(0x314, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x800, 8);
    head.writeUInt16LE(time, 12);
    head.writeUInt16LE(date, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(content.length, 20);
    head.writeUInt32LE(content.length, 24);
    head.writeUInt16LE(name.length, 28);
    head.writeUInt32LE((0o100644 * 65536) >>> 0, 38);
    head.writeUInt32LE(offset, 42);
    locals.push(local, name, content);
    central.push(head, name);
    offset += local.length + name.length + content.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const archive = Buffer.concat([...locals, directory, end]);
  inspectZipArchive(archive, { ...INSPECTION, label });
  return archive;
}

function sourceFiles(dir = SOURCE_DIR, base = "") {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    return statSync(full).isDirectory() ? sourceFiles(full, rel) : [rel];
  });
}

function assertSourceList(dir, expected) {
  const present = sourceFiles(dir).filter((name) => !name.endsWith(".DS_Store")).sort();
  const sorted = [...expected].sort();
  if (JSON.stringify(present) !== JSON.stringify(sorted)) {
    throw new Error(`Kit source ${path.relative(REPO_ROOT, dir)} differs from its list.\nsource:   ${present.join(", ")}\nexpected: ${sorted.join(", ")}`);
  }
}

const read = (dir, file) => readFileSync(path.join(dir, file));

/** Path inside the English kit to its bytes, as the zip holds them. */
export function kitEntries() {
  assertSourceList(SOURCE_DIR, KIT_FILES);
  const entries = KIT_FILES.map((file) => {
    const raw = read(SOURCE_DIR, file);
    return [file, file === "START-HERE.md" ? Buffer.from(fillInstallText(raw.toString("utf8"), "en"), "utf8") : raw];
  });
  return [...entries, [SKILL_KIT_PATH, readFileSync(SKILL_SOURCE)]];
}

/** Path inside the German kit to its bytes: German texts, the English case files under ordner/, the skill. */
export function kitEntriesDe() {
  assertSourceList(SOURCE_DIR_DE, KIT_FILES_DE);
  const texts = KIT_FILES_DE.map((file) => {
    const raw = read(SOURCE_DIR_DE, file);
    return [file, file === "START-HIER.md" ? Buffer.from(fillInstallText(raw.toString("utf8"), "de"), "utf8") : raw];
  });
  const caseFiles = [
    ["request_tannwald.md", read(SOURCE_DIR, "request_tannwald.md")],
    ["draft-reply.md", read(SOURCE_DIR, "draft-reply.md")],
    ...FOLDER_FILES.map((file) => [`ordner/${file}`, read(SOURCE_DIR, `folder/${file}`)]),
  ];
  return [...texts, ...caseFiles, ["vorlagen/luecken-anfrage.md", readFileSync(GAP_TEMPLATE_DE)], [SKILL_KIT_PATH, readFileSync(SKILL_SOURCE)]];
}

export function buildKit() {
  return buildArchive(kitEntries());
}

export function buildKitDe() {
  return buildArchive(kitEntriesDe(), KIT_RELEASE_DATE, `${KIT_NAME_DE}/`, ZIP_NAME_DE);
}

/** kit.ts: the demo's copy of the kit texts, generated, never edited by hand. */
export function kitModule() {
  const body = [
    ...DEMO_FILES.map((file) => `  ${JSON.stringify(file)}: ${JSON.stringify(readFileSync(path.join(SOURCE_DIR, file), "utf8"))},`),
    ...DEMO_FILES_DE.map((file) => `  ${JSON.stringify(`de/${file}`)}: ${JSON.stringify(readFileSync(path.join(SOURCE_DIR_DE, file), "utf8"))},`),
  ].join("\n");
  return [
    "// GENERATED by scripts/workshop05/build-kit.mjs from scripts/workshop05/kit. Do not edit; run the script.",
    "// The demo shows these texts; kit.test.ts asserts they equal the kit source byte for byte.",
    "",
    `export const KIT_ZIP_NAME = ${JSON.stringify(ZIP_NAME)};`,
    `export const KIT_ZIP_NAME_DE = ${JSON.stringify(ZIP_NAME_DE)};`,
    "",
    `export const FOLDER_FILES = ${JSON.stringify(FOLDER_FILES, null, 2)} as const;`,
    "",
    "export type FolderFile = (typeof FOLDER_FILES)[number];",
    "",
    "export const KIT_TEXT: Readonly<Record<string, string>> = {",
    body,
    "};",
    "",
    "/** The text of one kit file; throws for a path the kit does not hold. */",
    "export function kitText(file: string): string {",
    "  const text = KIT_TEXT[file];",
    "  if (text === undefined) throw new Error(`not in the kit: ${file}`);",
    "  return text;",
    "}",
    "",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputs = [
    [ZIP_PATH, buildKit()],
    [ZIP_PATH_DE, buildKitDe()],
    [KIT_TS_PATH, Buffer.from(kitModule(), "utf8")],
  ];
  if (process.argv.includes("--check")) {
    let stale = 0;
    for (const [file, bytes] of outputs) {
      const same = existsSync(file) && readFileSync(file).equals(bytes);
      if (!same) stale += 1;
      console.log(`${path.relative(REPO_ROOT, file)} ${same ? "is up to date" : "differs from a fresh build"}.`);
    }
    process.exit(stale === 0 ? 0 : 1);
  }
  for (const [file, bytes] of outputs) {
    writeFileSync(file, bytes);
    console.log(`Wrote ${path.relative(REPO_ROOT, file)} (${bytes.length} bytes).`);
  }
}
