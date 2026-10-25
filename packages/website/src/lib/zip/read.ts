/**
 * A small zip reader for build time and tests: lists the entries of an
 * archive and returns the bytes of one (STORE or DEFLATE). Node only
 * (node:zlib); the browser never reads zips.
 */

import { inflateRawSync } from "node:zlib";

export interface ZipReadEntry {
  readonly path: string;
  readonly method: number;
  readonly crc: number;
  readonly compressedSize: number;
  readonly size: number;
  readonly localOffset: number;
  readonly dosTime: number;
  readonly dosDate: number;
  readonly flags: number;
}

function endOfCentralDirectory(bytes: Uint8Array, view: DataView): number {
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 22 - 0xffff); at -= 1) {
    if (view.getUint32(at, true) === 0x06054b50) return at;
  }
  throw new Error("zip: no end of central directory");
}

/** Every entry of the archive, directories included (their path ends in "/"). */
export function listZipEntries(bytes: Uint8Array): readonly ZipReadEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = endOfCentralDirectory(bytes, view);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries: ZipReadEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("zip: broken central directory");
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    entries.push({
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      dosTime: view.getUint16(at + 12, true),
      dosDate: view.getUint16(at + 14, true),
      crc: view.getUint32(at + 16, true),
      compressedSize: view.getUint32(at + 20, true),
      size: view.getUint32(at + 24, true),
      localOffset: view.getUint32(at + 42, true),
      path: decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength)),
    });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** The uncompressed bytes of one entry, or null when the archive has no such file. */
export function readZipEntry(bytes: Uint8Array, path: string): Uint8Array | null {
  const entry = listZipEntries(bytes).find((candidate) => candidate.path === path);
  if (!entry) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = entry.localOffset;
  if (view.getUint32(at, true) !== 0x04034b50) throw new Error("zip: broken local header");
  const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
  const raw = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return raw.slice();
  if (entry.method === 8) return new Uint8Array(inflateRawSync(raw));
  throw new Error(`zip: unsupported method ${entry.method} for ${path}`);
}

/** The UTF-8 text of one entry, or null. */
export function readZipText(bytes: Uint8Array, path: string): string | null {
  const data = readZipEntry(bytes, path);
  return data === null ? null : new TextDecoder().decode(data);
}
