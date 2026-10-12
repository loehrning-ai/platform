/**
 * Deterministic, stored ZIP for the Workshop 04 participant kit (valea-sturzilor-esg-kit.zip).
 *
 * Same approach as scripts/course03/kit-archive.mjs: stored entries (no compression, so the
 * bytes never depend on the zlib build), UTF-8 names, 0644 file modes, no extra fields, no
 * platform metadata and one fixed modification time for every entry. Every archive is checked
 * with the repository's ZIP inspection rules before it is returned: text entries, plus PNG
 * photos (the invented invoice) that pass the inspector's chunk-by-chunk PNG check.
 */
import path from "node:path";
import { crc32 } from "../course03/kit-archive.mjs";
import { inspectZipArchive } from "../../packages/website/scripts/open-source/zip-inspection.mjs";

export const KIT_NAME = "valea-sturzilor-esg-kit";
export const KIT_PREFIX = `${KIT_NAME}/`;
export const ZIP_NAME = `${KIT_NAME}.zip`;
/** The kit's release date, written as every entry's modification time. */
export const KIT_RELEASE_DATE = "2026-10-12";

/** Plain text and one kind of image go into the kit. */
const KIT_EXTENSIONS = new Set([".csv", ".md", ".txt", ".png"]);
const INSPECTION = { label: ZIP_NAME, allowPngEntries: true };

/** DOS time and date fields for an ISO date (YYYY-MM-DD) at 00:00:00. */
export function dosDateTime(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Not an ISO date: ${isoDate}`);
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1980 || year > 2107) throw new Error(`Year outside the DOS range: ${isoDate}`);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

function localHeader(name, content, crc, { time, date }) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0x800, 6); // UTF-8 names
  header.writeUInt16LE(0, 8); // stored
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(content.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(name.length, 26);
  return header;
}

function centralHeader(name, content, crc, offset, { time, date }) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(0x314, 4); // made by: Unix, spec 2.0
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x800, 8);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(date, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(content.length, 20);
  header.writeUInt32LE(content.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE((0o100644 * 65536) >>> 0, 38); // regular file, 0644
  header.writeUInt32LE(offset, 42);
  return header;
}

/**
 * Build the stored ZIP from [pathInsideKit, Buffer] pairs, sorted by path. Every entry is
 * stored under valea-sturzilor-esg-kit/ and the archive is inspected before it is returned.
 */
export function buildKitArchive(entries, { isoDate = KIT_RELEASE_DATE } = {}) {
  const stamp = dosDateTime(isoDate);
  const sorted = [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const locals = [];
  const central = [];
  const seen = new Set();
  let offset = 0;
  for (const [file, content] of sorted) {
    if (!Buffer.isBuffer(content)) throw new Error(`Kit archive entry is not a buffer: ${file}`);
    if (!KIT_EXTENSIONS.has(path.posix.extname(file).toLowerCase())) throw new Error(`Kit entry is not CSV, Markdown, text or PNG: ${file}`);
    if (!/^[A-Za-z0-9._\-/]+$/.test(file) || file.split("/").includes("..")) throw new Error(`Kit entry name is not a plain relative path: ${file}`);
    if (seen.has(file)) throw new Error(`Duplicate kit entry: ${file}`);
    seen.add(file);
    const name = Buffer.from(`${KIT_PREFIX}${file}`, "utf8");
    const crc = crc32(content);
    const local = localHeader(name, content, crc, stamp);
    locals.push(local, name, content);
    central.push(centralHeader(name, content, crc, offset, stamp), name);
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

/** The archive's files as [pathInsideKit, Buffer] pairs, after the repository's ZIP inspection. */
export function readKitArchive(archive) {
  return inspectZipArchive(archive, INSPECTION)
    .filter((entry) => entry.kind === "file")
    .map((entry) => {
      if (!entry.path.startsWith(KIT_PREFIX)) throw new Error(`Kit entry outside ${KIT_PREFIX}: ${entry.path}`);
      return [entry.path.slice(KIT_PREFIX.length), entry.bytes];
    });
}
