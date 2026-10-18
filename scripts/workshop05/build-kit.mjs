#!/usr/bin/env node
/**
 * Builds the participant kit of Workshop 05 ("Where Your Data Goes: Using Claude at Work") from scripts/workshop05/kit/
 * into packages/website/public/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip.
 *
 * The ZIP is deterministic: stored entries, UTF-8 names, 0644 file modes, no extra fields, one
 * fixed modification time. Every archive passes the repository's ZIP inspection before it is written.
 *
 * Usage (from the repository root):
 *   node scripts/workshop05/build-kit.mjs           writes the ZIP
 *   node scripts/workshop05/build-kit.mjs --check   writes nothing and exits 1 when the published ZIP differs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "../course03/kit-archive.mjs";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
export const SLUG = "ki-im-unternehmen-sicher-nutzen";
export const KIT_NAME = "ai-at-work-kit";
export const KIT_PREFIX = `${KIT_NAME}/`;
export const ZIP_NAME = `${KIT_NAME}.zip`;
export const KIT_RELEASE_DATE = "2026-11-13";
export const SOURCE_DIR = path.join(HERE, "kit");
export const ZIP_PATH = path.join(REPO_ROOT, "packages/website/public/workshops", SLUG, ZIP_NAME);

/** Every file the kit holds, and nothing else. */
export const KIT_FILES = [
  "START-HERE.md",
  "ANSWERS.md",
  "project-instructions.md",
  "customer-email.md",
  "company-notes.md",
  "scenes.md",
  "facts.md",
];

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

export function buildKit() {
  const present = sourceFiles().sort();
  const expected = [...KIT_FILES].sort();
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    throw new Error(`Kit source differs from KIT_FILES.\nsource:   ${present.join(", ")}\nexpected: ${expected.join(", ")}`);
  }
  return buildArchive(KIT_FILES.map((file) => [file, readFileSync(path.join(SOURCE_DIR, file))]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const archive = buildKit();
  if (process.argv.includes("--check")) {
    const same = existsSync(ZIP_PATH) && readFileSync(ZIP_PATH).equals(archive);
    console.log(same ? `${ZIP_NAME} is up to date (${archive.length} bytes).` : `${ZIP_NAME} differs from a fresh build.`);
    process.exit(same ? 0 : 1);
  }
  writeFileSync(ZIP_PATH, archive);
  console.log(`Wrote ${path.relative(REPO_ROOT, ZIP_PATH)} (${archive.length} bytes).`);
}
