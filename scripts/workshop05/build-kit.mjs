#!/usr/bin/env node
/**
 * Builds the participant kit of Workshop 05 ("Audit Preparation with AI: Organize Evidence and Find Gaps")
 * from scripts/workshop05/kit/ into
 * packages/website/public/workshops/audit-vorbereitung-mit-ki/vardar-audit-kit.zip, and writes the kit
 * texts the demo shows into packages/website/src/lib/demo-cases/audit-vorbereitung-mit-ki/kit.ts, so the
 * demo and the zip carry the same bytes.
 *
 * START-HERE.md holds two marker lines, <!-- claude-ui:en --> and <!-- claude-ui:de -->. The build replaces
 * each with claudeUiMarkdown(locale, "audit-nachweise") from packages/website/src/lib/claude-ui.ts, the one
 * install text of the site.
 *
 * The ZIP is deterministic: stored entries, UTF-8 names, 0644 file modes, no extra fields, one
 * fixed modification time. Every archive passes the repository's ZIP inspection before it is written.
 *
 * Usage (from the repository root):
 *   node scripts/workshop05/build-kit.mjs           writes the ZIP and kit.ts
 *   node scripts/workshop05/build-kit.mjs --check   writes nothing and exits 1 when either differs
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
export const SKILL_NAME = "audit-nachweise";
export const KIT_RELEASE_DATE = "2026-10-25";
export const SOURCE_DIR = path.join(HERE, "kit");
export const ZIP_PATH = path.join(REPO_ROOT, "packages/website/public/workshops", SLUG, ZIP_NAME);
export const KIT_TS_PATH = path.join(REPO_ROOT, "packages/website/src/lib/demo-cases", SLUG, "kit.ts");

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

/** Every file the kit holds, and nothing else. */
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

/** The files the demo bundles (kit.ts): everything except START-HERE.md. */
export const DEMO_FILES = KIT_FILES.filter((file) => file !== "START-HERE.md");

/** START-HERE.md with the install text of the site in place of its marker lines. */
export function fillInstallText(text) {
  let out = text;
  for (const locale of ["en", "de"]) {
    const marker = `<!-- claude-ui:${locale} -->`;
    if (out.split(marker).length !== 2) throw new Error(`START-HERE.md needs the marker ${marker} exactly once`);
    out = out.replace(marker, claudeUiMarkdown(locale, SKILL_NAME).trimEnd());
  }
  return out;
}

const INSPECTION = { label: ZIP_NAME, allowSafeUnixMetadata: true };

function dosDateTime(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

export function buildArchive(entries, isoDate = KIT_RELEASE_DATE) {
  const { time, date } = dosDateTime(isoDate);
  const sorted = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [file, content] of sorted) {
    if (!/^[A-Za-z0-9._\-/]+$/.test(file) || file.split("/").includes("..")) throw new Error(`Not a plain relative path: ${file}`);
    const name = Buffer.from(`${KIT_PREFIX}${file}`, "utf8");
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
  inspectZipArchive(archive, INSPECTION);
  return archive;
}

function sourceFiles(dir = SOURCE_DIR, base = "") {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    return statSync(full).isDirectory() ? sourceFiles(full, rel) : [rel];
  });
}

/** Path inside the kit to its bytes, as the zip holds them. */
export function kitEntries() {
  const present = sourceFiles().sort();
  const expected = [...KIT_FILES].sort();
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    throw new Error(`Kit source differs from KIT_FILES.\nsource:   ${present.join(", ")}\nexpected: ${expected.join(", ")}`);
  }
  return KIT_FILES.map((file) => {
    const raw = readFileSync(path.join(SOURCE_DIR, file));
    return [file, file === "START-HERE.md" ? Buffer.from(fillInstallText(raw.toString("utf8")), "utf8") : raw];
  });
}

export function buildKit() {
  return buildArchive(kitEntries());
}

/** kit.ts: the demo's copy of the kit texts, generated, never edited by hand. */
export function kitModule() {
  const body = DEMO_FILES.map((file) => `  ${JSON.stringify(file)}: ${JSON.stringify(readFileSync(path.join(SOURCE_DIR, file), "utf8"))},`).join("\n");
  return [
    "// GENERATED by scripts/workshop05/build-kit.mjs from scripts/workshop05/kit. Do not edit; run the script.",
    "// The demo shows these texts; kit.test.ts asserts they equal the kit source byte for byte.",
    "",
    `export const KIT_ZIP_NAME = ${JSON.stringify(ZIP_NAME)};`,
    "",
    `export const FOLDER_FILES = ${JSON.stringify(FOLDER_FILES, null, 2).replace(/\n/g, "\n")} as const;`,
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
  const archive = buildKit();
  const module = kitModule();
  if (process.argv.includes("--check")) {
    const sameZip = existsSync(ZIP_PATH) && readFileSync(ZIP_PATH).equals(archive);
    const sameTs = existsSync(KIT_TS_PATH) && readFileSync(KIT_TS_PATH, "utf8") === module;
    console.log(sameZip ? `${ZIP_NAME} is up to date (${archive.length} bytes).` : `${ZIP_NAME} differs from a fresh build.`);
    console.log(sameTs ? "kit.ts is up to date." : "kit.ts differs from a fresh build.");
    process.exit(sameZip && sameTs ? 0 : 1);
  }
  writeFileSync(ZIP_PATH, archive);
  writeFileSync(KIT_TS_PATH, module);
  console.log(`Wrote ${path.relative(REPO_ROOT, ZIP_PATH)} (${archive.length} bytes) and ${path.relative(REPO_ROOT, KIT_TS_PATH)}.`);
}
