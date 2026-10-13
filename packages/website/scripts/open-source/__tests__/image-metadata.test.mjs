import assert from "node:assert/strict";
import test from "node:test";
import { findImageMetadataIssue } from "../image-metadata.mjs";
import { isPrivateExportPath } from "../export-denylist.mjs";

// Obviously synthetic fixtures: minimal containers, no real image data.

function jpeg(...segments) {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    ...segments,
    Buffer.from([0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]),
  ]);
}

function segment(marker, payload) {
  const header = Buffer.from([0xff, marker, 0, 0]);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
}

/** Big-endian EXIF APP1 with one IFD0 entry per tag (and an optional sub-IFD tag). */
function exif(tags, subTag) {
  const entries = [...tags];
  const ifd0Size = 2 + (entries.length + (subTag ? 1 : 0)) * 12 + 4;
  const subOffset = 8 + ifd0Size;
  const tiff = Buffer.alloc(8 + ifd0Size + (subTag ? 2 + 12 + 4 : 0));
  tiff.write("MM", 0, "latin1");
  tiff.writeUInt16BE(0x2a, 2);
  tiff.writeUInt32BE(8, 4);
  let at = 8;
  const total = entries.length + (subTag ? 1 : 0);
  tiff.writeUInt16BE(total, at);
  at += 2;
  for (const tag of entries) {
    tiff.writeUInt16BE(tag, at);
    tiff.writeUInt16BE(3, at + 2);
    tiff.writeUInt32BE(1, at + 4);
    at += 12;
  }
  if (subTag) {
    tiff.writeUInt16BE(0x8769, at);
    tiff.writeUInt16BE(4, at + 2);
    tiff.writeUInt32BE(1, at + 4);
    tiff.writeUInt32BE(subOffset, at + 8);
    tiff.writeUInt16BE(1, subOffset);
    tiff.writeUInt16BE(subTag, subOffset + 2);
  }
  return segment(0xe1, Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]));
}

test("accepts a JPEG with no metadata and with dimension-only EXIF", () => {
  assert.equal(findImageMetadataIssue("jpg", jpeg()), null);
  assert.equal(findImageMetadataIssue("jpeg", jpeg(exif([0xa002, 0xa003]))), null);
});

test("rejects GPS, device and author EXIF tags in a JPEG", () => {
  assert.match(findImageMetadataIssue("jpg", jpeg(exif([0x8825]))), /GPS/);
  assert.match(findImageMetadataIssue("jpg", jpeg(exif([0x010f]))), /Make/);
  assert.match(findImageMetadataIssue("jpg", jpeg(exif([0x0110]))), /Model/);
  assert.match(findImageMetadataIssue("jpg", jpeg(exif([0x013b]))), /Artist/);
  assert.match(
    findImageMetadataIssue("jpg", jpeg(exif([], 0xa430))),
    /CameraOwnerName/,
  );
});

test("rejects XMP, Photoshop and comment segments in a JPEG", () => {
  const xmp = segment(0xe1, Buffer.from("http://ns.adobe.com/xap/1.0/\0<x/>", "latin1"));
  assert.match(findImageMetadataIssue("jpg", jpeg(xmp)), /XMP/);
  const photoshop = segment(0xed, Buffer.from("Photoshop 3.0\0", "latin1"));
  assert.match(findImageMetadataIssue("jpg", jpeg(photoshop)), /APP13/);
  const comment = segment(0xfe, Buffer.from("made by someone"));
  assert.match(findImageMetadataIssue("jpg", jpeg(comment)), /COM/);
});

test("flags a truncated JPEG segment instead of crashing", () => {
  const broken = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00]),
    Buffer.from("short"),
  ]);
  assert.match(findImageMetadataIssue("jpg", broken), /truncated/);
});

function pngChunk(type, data = Buffer.alloc(0)) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  return Buffer.concat([head, data, Buffer.alloc(4)]);
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("PNG: accepts image chunks, rejects text and EXIF chunks", () => {
  const clean = Buffer.concat([PNG_SIG, pngChunk("IHDR", Buffer.alloc(13)), pngChunk("IDAT"), pngChunk("IEND")]);
  assert.equal(findImageMetadataIssue("png", clean), null);
  for (const type of ["tEXt", "iTXt", "zTXt", "eXIf"]) {
    const dirty = Buffer.concat([PNG_SIG, pngChunk("IHDR", Buffer.alloc(13)), pngChunk(type, Buffer.from("x")), pngChunk("IEND")]);
    assert.match(findImageMetadataIssue("png", dirty), new RegExp(type));
  }
});

function webpChunk(type, data) {
  const head = Buffer.alloc(8);
  head.write(type, 0, "latin1");
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

function webp(...chunks) {
  const body = Buffer.concat([Buffer.from("WEBP", "latin1"), ...chunks]);
  const head = Buffer.alloc(8);
  head.write("RIFF", 0, "latin1");
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}

test("WebP: accepts image chunks, rejects EXIF and XMP chunks", () => {
  assert.equal(
    findImageMetadataIssue("webp", webp(webpChunk("VP8 ", Buffer.alloc(10)))),
    null,
  );
  assert.match(
    findImageMetadataIssue("webp", webp(webpChunk("VP8 ", Buffer.alloc(10)), webpChunk("EXIF", Buffer.from("xyz")))),
    /EXIF/,
  );
  assert.match(
    findImageMetadataIssue("webp", webp(webpChunk("XMP ", Buffer.from("<x/>")))),
    /XMP/,
  );
});

test("the denylist rejects a STATUS file anywhere in the tree", () => {
  const name = ["STAT", "US.md"].join("");
  assert.equal(isPrivateExportPath(name, "platform"), true);
  assert.equal(isPrivateExportPath(`docs/${name}`, "platform"), true);
});
