#!/usr/bin/env node
/**
 * Deterministic ZIP for the Workshop 04 ESG kit (kellbrunn-esg-kit.zip).
 *
 * Same approach as scripts/course03/kit-archive.mjs: stored entries (no
 * compression, so the bytes never depend on the zlib build), UTF-8 names,
 * 0644 file modes, no extra fields, no platform metadata, entries sorted by
 * path and one fixed modification time for every entry (the kit release date
 * from data/w04-data.json, meta.builtOn, at 00:00). Every archive is checked
 * with the repository's ZIP inspection rules before it is returned.
 *
 * Source: packages/website/public/workshops/esg-berichte-mit-ki/kit/, written
 * by scripts/workshop04/build_dataset.py. Inside the zip every file sits
 * under esg-kit/ (SPEC section 7).
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/kit-archive.mjs          write the zip
 *   node scripts/workshop04/kit-archive.mjs --check  exit 1 if the zip is missing or stale
 */
import { lstatSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { crc32 } from "../course03/kit-archive.mjs";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const WORKSHOP_DIR = path.join(REPO_ROOT, "packages/website/public/workshops/esg-berichte-mit-ki");
export const KIT_DIR = path.join(WORKSHOP_DIR, "kit");
export const DATA_JSON = path.join(WORKSHOP_DIR, "data/w04-data.json");
export const ZIP_NAME = "kellbrunn-esg-kit.zip";
export const ZIP_PATH = path.join(WORKSHOP_DIR, ZIP_NAME);
export const KIT_PREFIX = "esg-kit/";

/** Only plain text goes into the kit (SPEC section 7: CSV, MD, TXT). */
const KIT_EXTENSIONS = new Set([".csv", ".md", ".txt"]);

/** Every regular file below `dir`, as sorted POSIX paths relative to it. Symlinks are refused. */
export function listKitFiles(dir = KIT_DIR) {
  const out = [];
  const walk = (current, rel) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const stat = lstatSync(abs);
      if (stat.isSymbolicLink()) throw new Error(`Kit file is a symbolic link: ${relPath}`);
      if (stat.isDirectory()) walk(abs, relPath);
      else if (stat.isFile()) out.push(relPath);
      else throw new Error(`Kit entry is not a regular file: ${relPath}`);
    }
  };
  walk(dir, "");
  // Plain code-point order, independent of the locale.
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** DOS time and date fields for an ISO date (YYYY-MM-DD) at 00:00:00. */
export function dosDateTime(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Not an ISO date: ${isoDate}`);
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1980 || year > 2107) throw new Error(`Year outside the DOS range: ${isoDate}`);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

/** The release date the kit carries as its fixed modification time. */
export function kitReleaseDate(dataPath = DATA_JSON) {
  return JSON.parse(readFileSync(dataPath, "utf8")).meta.builtOn;
}

/**
 * Build the stored ZIP from [pathInsideKit, Buffer] pairs. The caller's order is
 * kept; buildKitArchiveFromDir() sorts.
 */
export function buildKitArchive(entries, { isoDate }) {
  const { time, date } = dosDateTime(isoDate);
  const locals = [];
  const central = [];
  let offset = 0;
  const seen = new Set();
  for (const [file, content] of entries) {
    if (!Buffer.isBuffer(content)) throw new Error(`Kit archive entry is not a buffer: ${file}`);
    if (!KIT_EXTENSIONS.has(path.posix.extname(file).toLowerCase())) throw new Error(`Kit entry is not CSV, Markdown or plain text: ${file}`);
    if (!/^[A-Za-z0-9._\-/]+$/.test(file)) throw new Error(`Kit entry name is not plain ASCII: ${file}`);
    if (seen.has(file)) throw new Error(`Duplicate kit entry: ${file}`);
    seen.add(file);
    const name = Buffer.from(`${KIT_PREFIX}${file}`, "utf8");
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // no extra field
    locals.push(local, name, content);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(0x314, 4); // made by: Unix, spec 2.0
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x800, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(content.length, 20);
    header.writeUInt32LE(content.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE((0o100644 * 65536) >>> 0, 38); // regular file, 0644
    header.writeUInt32LE(offset, 42);
    central.push(header, name);
    offset += local.length + name.length + content.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const archive = Buffer.concat([...locals, directory, end]);
  inspectZipArchive(archive, { label: ZIP_NAME });
  return archive;
}

/** Build the archive from the kit folder on disk. */
export function buildKitArchiveFromDir(dir = KIT_DIR, { isoDate = kitReleaseDate() } = {}) {
  const entries = listKitFiles(dir).map((file) => [file, readFileSync(path.join(dir, ...file.split("/")))]);
  return buildKitArchive(entries, { isoDate });
}

function main() {
  const check = process.argv.includes("--check");
  const archive = buildKitArchiveFromDir();
  const relative = path.relative(REPO_ROOT, ZIP_PATH);
  if (check) {
    if (!existsSync(ZIP_PATH) || !readFileSync(ZIP_PATH).equals(archive)) {
      process.stderr.write(`${relative} is missing or stale. Run: node scripts/workshop04/kit-archive.mjs\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${relative} is up to date (${archive.length} bytes, ${listKitFiles().length} entries).\n`);
    return;
  }
  writeFileSync(ZIP_PATH, archive);
  process.stdout.write(`Wrote ${relative} (${archive.length} bytes, ${listKitFiles().length} entries).\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
