/**
 * The one zip writer of the site: STORE method (no compression), CRC-32, a
 * fixed 1980-01-01 00:00 DOS timestamp and the UTF-8 name flag, so the same
 * entries always give the same bytes. It runs in the browser and on the
 * server (Uint8Array and TextEncoder only, no Node Buffer, no dependency).
 *
 * Used by the /skills/<name>.zip route and by every demo that hands the
 * visitor a zip built in the browser. A client-built skill zip may add only
 * `<name>/references/*.md` next to the unchanged `<name>/SKILL.md`.
 */

export interface ZipStoreEntry {
  /** Forward-slash path inside the archive, never absolute, never "..". */
  readonly path: string;
  readonly data: Uint8Array | string;
}

/** DOS date for 1980-01-01: (year - 1980) << 9 | month << 5 | day. */
export const ZIP_DOS_DATE = (0 << 9) | (1 << 5) | 1;
export const ZIP_DOS_TIME = 0;
const UTF8_FLAG = 0x0800;
const VERSION = 20;

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** True for a safe relative archive path: no leading slash, no backslash, no "." or ".." segment. */
export function isSafeZipPath(path: string): boolean {
  if (path === "" || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  return path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function u16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function u32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

/** Builds a STORE zip. Throws on an unsafe or duplicate path. */
export function zipStore(entries: readonly ZipStoreEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const seen = new Set<string>();
  const prepared = entries.map((entry) => {
    if (!isSafeZipPath(entry.path)) throw new Error(`zip: unsafe path ${JSON.stringify(entry.path)}`);
    if (seen.has(entry.path)) throw new Error(`zip: duplicate path ${entry.path}`);
    seen.add(entry.path);
    const name = encoder.encode(entry.path);
    const data = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    return { name, data, crc: crc32(data) };
  });

  const localSize = prepared.reduce((sum, item) => sum + 30 + item.name.length + item.data.length, 0);
  const centralSize = prepared.reduce((sum, item) => sum + 46 + item.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  const offsets: number[] = [];
  let at = 0;

  for (const item of prepared) {
    offsets.push(at);
    u32(view, at, 0x04034b50);
    u16(view, at + 4, VERSION);
    u16(view, at + 6, UTF8_FLAG);
    u16(view, at + 8, 0);
    u16(view, at + 10, ZIP_DOS_TIME);
    u16(view, at + 12, ZIP_DOS_DATE);
    u32(view, at + 14, item.crc);
    u32(view, at + 18, item.data.length);
    u32(view, at + 22, item.data.length);
    u16(view, at + 26, item.name.length);
    u16(view, at + 28, 0);
    out.set(item.name, at + 30);
    out.set(item.data, at + 30 + item.name.length);
    at += 30 + item.name.length + item.data.length;
  }

  const centralStart = at;
  prepared.forEach((item, index) => {
    u32(view, at, 0x02014b50);
    u16(view, at + 4, VERSION);
    u16(view, at + 6, VERSION);
    u16(view, at + 8, UTF8_FLAG);
    u16(view, at + 10, 0);
    u16(view, at + 12, ZIP_DOS_TIME);
    u16(view, at + 14, ZIP_DOS_DATE);
    u32(view, at + 16, item.crc);
    u32(view, at + 20, item.data.length);
    u32(view, at + 24, item.data.length);
    u16(view, at + 28, item.name.length);
    // extra, comment, disk start, internal and external attributes stay 0
    u32(view, at + 42, offsets[index] as number);
    out.set(item.name, at + 46);
    at += 46 + item.name.length;
  });

  u32(view, at, 0x06054b50);
  u16(view, at + 8, prepared.length);
  u16(view, at + 10, prepared.length);
  u32(view, at + 12, at - centralStart);
  u32(view, at + 16, centralStart);
  return out;
}
