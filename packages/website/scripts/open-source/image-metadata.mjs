// Metadata gate for loose JPEG, PNG and WebP files in the public tree.
//
// Camera and editor metadata can carry GPS coordinates, device identifiers and
// author names, and a public repo plus CDN keep them forever. Pixel-dimension
// only EXIF (what many exporters write) is tolerated; anything personal fails.
// Returns a human-readable reason, or null when the file is clean. Never throws
// on malformed input: an unparsable container is itself a finding.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_METADATA_CHUNKS = new Set(["tEXt", "iTXt", "zTXt", "eXIf"]);
const WEBP_METADATA_CHUNKS = new Set(["EXIF", "XMP "]);

// IFD0 tags that identify a device, a person or a place.
const EXIF_PERSONAL_TAGS = new Map([
  [0x010e, "ImageDescription"],
  [0x010f, "Make"],
  [0x0110, "Model"],
  [0x013b, "Artist"],
  [0x013c, "HostComputer"],
  [0x8298, "Copyright"],
  [0x8825, "GPS IFD"],
]);
// Exif sub-IFD tags with the same property.
const EXIF_SUB_PERSONAL_TAGS = new Map([
  [0x9286, "UserComment"],
  [0xa430, "CameraOwnerName"],
  [0xa431, "BodySerialNumber"],
  [0xa435, "LensSerialNumber"],
  [0xa420, "ImageUniqueID"],
]);
const EXIF_SUB_IFD_POINTER = 0x8769;
const MAX_IFD_ENTRIES = 512;

function exifIssue(tiff) {
  if (tiff.byteLength < 8) return "EXIF block is truncated";
  const order = tiff.subarray(0, 2).toString("latin1");
  if (order !== "II" && order !== "MM") return "EXIF block has no byte order";
  const little = order === "II";
  const u16 = (offset) => (little ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset));
  const u32 = (offset) => (little ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset));

  const scan = (ifdOffset, personal, depth) => {
    if (ifdOffset + 2 > tiff.byteLength) return "EXIF IFD offset is out of range";
    const count = u16(ifdOffset);
    if (count > MAX_IFD_ENTRIES || ifdOffset + 2 + count * 12 > tiff.byteLength) {
      return "EXIF IFD is malformed";
    }
    for (let index = 0; index < count; index += 1) {
      const entry = ifdOffset + 2 + index * 12;
      const tag = u16(entry);
      const name = personal.get(tag);
      if (name) return `EXIF ${name} tag`;
      if (tag === EXIF_SUB_IFD_POINTER && depth === 0) {
        const nested = scan(u32(entry + 8), EXIF_SUB_PERSONAL_TAGS, depth + 1);
        if (nested) return nested;
      }
    }
    return null;
  };
  return scan(u32(4), EXIF_PERSONAL_TAGS, 0);
}

function jpegIssue(bytes) {
  let cursor = 2;
  while (cursor + 4 <= bytes.byteLength) {
    if (bytes[cursor] !== 0xff) return "JPEG segment marker is malformed";
    const marker = bytes[cursor + 1];
    if (marker === 0xff) {
      cursor += 1;
      continue;
    }
    // Start of scan: metadata segments only precede it.
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      cursor += 2;
      continue;
    }
    const length = bytes.readUInt16BE(cursor + 2);
    const start = cursor + 4;
    const end = cursor + 2 + length;
    if (length < 2 || end > bytes.byteLength) return "JPEG segment is truncated";
    const payload = bytes.subarray(start, end);
    if (marker === 0xe1) {
      if (payload.subarray(0, 6).toString("latin1") === "Exif\0\0") {
        const issue = exifIssue(payload.subarray(6));
        if (issue) return issue;
      } else if (payload.subarray(0, 28).toString("latin1").startsWith("http://ns.adobe.com/xap/")) {
        return "XMP packet";
      }
    } else if (marker === 0xed) {
      return "Photoshop/IPTC (APP13) block";
    } else if (marker === 0xfe) {
      return "JPEG comment (COM) segment";
    }
    cursor = end;
  }
  return null;
}

function pngIssue(bytes) {
  let cursor = 8;
  while (cursor + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(cursor);
    const type = bytes.subarray(cursor + 4, cursor + 8).toString("latin1");
    if (PNG_METADATA_CHUNKS.has(type)) return `PNG ${type} chunk`;
    if (type === "IEND") return null;
    cursor += 12 + length;
  }
  return "PNG chunk walk did not reach IEND";
}

function webpIssue(bytes) {
  let cursor = 12;
  while (cursor + 8 <= bytes.byteLength) {
    const type = bytes.subarray(cursor, cursor + 4).toString("latin1");
    const length = bytes.readUInt32LE(cursor + 4);
    if (WEBP_METADATA_CHUNKS.has(type)) return `WebP ${type.trim()} chunk`;
    cursor += 8 + length + (length % 2);
  }
  return null;
}

/**
 * @param {string} extension lowercase extension without the dot
 * @param {Buffer} bytes complete file contents
 * @returns {string | null} reason the file must not be published, or null
 */
export function findImageMetadataIssue(extension, bytes) {
  try {
    if (extension === "jpg" || extension === "jpeg") return jpegIssue(bytes);
    if (extension === "png") {
      return bytes.subarray(0, 8).equals(PNG_SIGNATURE) ? pngIssue(bytes) : null;
    }
    if (extension === "webp") return webpIssue(bytes);
  } catch {
    return "image metadata could not be parsed";
  }
  return null;
}

export const IMAGE_METADATA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
