import { inflateRawSync } from "node:zlib";
import { extname, posix } from "node:path";

export const MAX_ZIP_ARCHIVE_BYTES = 32 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 512;
export const MAX_ZIP_CENTRAL_DIRECTORY_BYTES = 2 * 1024 * 1024;
export const MAX_ZIP_ENTRY_COMPRESSED_BYTES = 8 * 1024 * 1024;
export const MAX_ZIP_ENTRY_UNCOMPRESSED_BYTES = 16 * 1024 * 1024;
export const MAX_ZIP_TOTAL_COMPRESSED_BYTES = 32 * 1024 * 1024;
export const MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
export const MAX_ZIP_COMPRESSION_RATIO = 100;
const MAX_ZIP_PATH_BYTES = 512;
const MAX_ZIP_PATH_DEPTH = 24;

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const ZIP64_EXTRA_FIELD_ID = 0x0001;
const UTF8_FLAG = 0x0800;
const ALLOWED_FLAGS = UTF8_FLAG;
const STORED = 0;
const DEFLATED = 8;
const SAFE_UNIX_DIRECTORY_MODE = 0o040755;
const SAFE_UNIX_FILE_MODE = 0o100644;
const UNSAFE_DOS_ATTRIBUTE_MASK = 0x0f;
const WINDOWS_RESERVED_BASENAME_RE =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const WINDOWS_FORBIDDEN_PATH_CHARACTER_RE = /[<>:"|?*]/u;
const INVISIBLE_OR_DIRECTIONAL_FORMAT_RE = /\p{Cf}/u;

const PRIVATE_ARCHIVE_DIRECTORY_SEGMENTS = new Set([
  ".agents",
  ".auth",
  ".aws",
  ".cline",
  ".codex",
  ".continue",
  ".cursor",
  ".docker",
  ".gemini",
  ".git",
  ".github",
  ".kube",
  ".roo",
  ".ssh",
  ".windsurf",
  "plans",
]);

// The published analyst kit deliberately carries a repository-owned
// `.claude/skills` teaching bundle. Root instruction basenames remain blocked
// below, while other private agent-state directories stay forbidden above.
const PRIVATE_ARCHIVE_BASENAMES = new Set([
  ".claude.json",
  ".cursorrules",
  ".roorules",
  ".windsurfrules",
  "agents.md",
  "claude.md",
  "copilot-instructions.md",
  "launch-evidence-ledger.md",
  "notes.md",
  ["run", "book.md"].join(""),
  ["to", "do.md"].join(""),
  ["todo", "s.md"].join(""),
]);

const SECRET_ARCHIVE_BASENAME_RE =
  /^(?:\.dockercfg|\.env(?:\..*)?|\.git-credentials|\.netrc|\.npmrc|\.pypirc|credentials\.json|kubeconfig|service-account.*\.json|id_(?:rsa|dsa|ecdsa|ed25519)|.*\.(?:key|p12|pem|pfx))$/i;

const ACTIVE_CODE_EXTENSIONS = new Set([
  "cjs",
  "html",
  "js",
  "jsx",
  "mjs",
  "mts",
  "py",
  "sh",
  "svg",
  "ts",
  "tsx",
]);

const UNSAFE_ACTIVE_CODE_PATTERNS = [
  {
    label: "dynamic code execution",
    re: /\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(|insertAdjacentHTML|(?:inner|outer)HTML\s*=/i,
  },
  {
    label: "browser network access",
    re: /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(/i,
  },
  {
    label: "browser credential or navigation access",
    re: /\bdocument\.cookie\b|\b(?:local|session)Storage\b|\bnavigator\.credentials\b|\bwindow\.open\s*\(|\b(?:window\.)?location\s*=/i,
  },
  {
    label: "Node network or process execution",
    re: /(?:from\s*|require\s*\(\s*)["']node:(?:child_process|dgram|http|https|net|tls)["']|\bBun\.spawn\s*\(|\bnew\s+Deno\.Command\b/i,
  },
  {
    label: "Python network or process execution",
    re: /\b(?:import|from)\s+(?:http\.client|requests|socket|subprocess|urllib)\b|\bos\.system\s*\(/i,
  },
  {
    label: "shell network utility",
    re: /(?:^|[;&|]\s*|\$\(\s*)(?:curl|nc|ncat|socat|wget)\b/im,
  },
];

const UNSAFE_MARKUP_PATTERNS = [
  {
    label: "event-handler attribute",
    re: /\s+on[a-z][a-z0-9_-]*\s*=/i,
  },
  {
    label: "javascript URL",
    re: /\b(?:href|src|action|data)\s*=\s*["']?\s*javascript:/i,
  },
  {
    label: "remote active resource",
    re: /<\s*(?:audio|embed|form|iframe|image|img|link|object|script|source|video)\b[^>]*\b(?:action|data|href|src)\s*=\s*["']\s*(?:https?:)?\/\//i,
  },
  {
    label: "remote CSS resource",
    re: /(?:url\s*\(\s*|@import\s+)["']?\s*(?:https?:)?\/\//i,
  },
  {
    label: "meta refresh",
    re: /<\s*meta\b[^>]*\bhttp-equiv\s*=\s*["']?\s*refresh\b/i,
  },
];

const UNSAFE_SVG_ELEMENT_RE =
  /<\s*(?:foreignObject|iframe|object|embed|script)\b/i;

const ARCHIVE_TEXT_EXTENSIONS = new Set([
  "cjs",
  "css",
  "csv",
  "graphql",
  "gql",
  "hbs",
  "html",
  "ini",
  "js",
  "json",
  "jsonc",
  "jsx",
  "md",
  "mdx",
  "mjs",
  "mts",
  "py",
  "scss",
  "sh",
  "sql",
  "svg",
  "toml",
  "ts",
  "tsx",
  "txt",
  "vtt",
  "xml",
  "yaml",
  "yml",
]);

const NESTED_ARCHIVE_EXTENSION_RE =
  /\.(?:7z|bz2|gz|rar|tar|tgz|txz|xz|zip|zst)$/i;

export class ZipValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ZipValidationError";
    this.code = "EUNSAFEZIP";
  }
}

function fail(label, message) {
  throw new ZipValidationError(`${label}: ${message}`);
}

function assertBounds(bytes, offset, length, label, purpose) {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset > bytes.byteLength ||
    length > bytes.byteLength - offset
  ) {
    fail(label, `${purpose} exceeds archive bounds`);
  }
}

function readUInt16(bytes, offset, label, purpose) {
  assertBounds(bytes, offset, 2, label, purpose);
  return bytes.readUInt16LE(offset);
}

function readUInt32(bytes, offset, label, purpose) {
  assertBounds(bytes, offset, 4, label, purpose);
  return bytes.readUInt32LE(offset);
}

function decodeUtf8(bytes, label, purpose) {
  let decoded;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(label, `${purpose} is not valid UTF-8`);
  }
  if (!Buffer.from(decoded, "utf8").equals(bytes)) {
    fail(label, `${purpose} is not canonical UTF-8`);
  }
  return decoded;
}

function validatePublicationPath(segments, label) {
  const lowerSegments = segments.map((segment) =>
    segment.toLocaleLowerCase("en-US"),
  );
  const basename = lowerSegments[lowerSegments.length - 1] ?? "";
  const invalidClaudePath = lowerSegments.some(
    (segment, index) =>
      segment === ".claude" &&
      index < lowerSegments.length - 1 &&
      lowerSegments[index + 1] !== "skills",
  );

  if (
    invalidClaudePath ||
    lowerSegments.some(
      (segment) =>
        PRIVATE_ARCHIVE_DIRECTORY_SEGMENTS.has(segment) ||
        segment.startsWith(".aider"),
    ) ||
    lowerSegments.some(
      (segment, index) =>
        segment === "docs" && lowerSegments[index + 1] === "privacy",
    ) ||
    PRIVATE_ARCHIVE_BASENAMES.has(basename)
  ) {
    fail(label, "entry path is private publication material");
  }
  if (SECRET_ARCHIVE_BASENAME_RE.test(basename)) {
    fail(label, "entry path uses a secret-like filename");
  }
}

function validatePath(pathBytes, flags, label) {
  if (pathBytes.byteLength === 0 || pathBytes.byteLength > MAX_ZIP_PATH_BYTES) {
    fail(label, "entry path length is outside the allowed bounds");
  }
  if (pathBytes.includes(0)) fail(label, "entry path contains NUL");
  if (
    pathBytes.some((byte) => byte >= 0x80) &&
    (flags & UTF8_FLAG) === 0
  ) {
    fail(label, "non-ASCII entry paths must set the UTF-8 flag");
  }

  const path = decodeUtf8(pathBytes, label, "entry path");
  if (path.includes("\\")) fail(label, "entry path contains a backslash");
  if (path.normalize("NFC") !== path) {
    fail(label, "entry path is not Unicode NFC-normalized");
  }
  if (
    posix.isAbsolute(path) ||
    /^[A-Za-z]:/.test(path) ||
    path.startsWith("./")
  ) {
    fail(label, "entry path must be relative");
  }

  const isDirectory = path.endsWith("/");
  const segments = path.split("/");
  if (isDirectory) segments.pop();
  if (
    segments.length === 0 ||
    segments.length > MAX_ZIP_PATH_DEPTH ||
    segments.some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        segment.trim() !== segment ||
        segment.endsWith(".") ||
        /[\u0000-\u001f\u007f]/u.test(segment) ||
        INVISIBLE_OR_DIRECTIONAL_FORMAT_RE.test(segment) ||
        WINDOWS_FORBIDDEN_PATH_CHARACTER_RE.test(segment) ||
        WINDOWS_RESERVED_BASENAME_RE.test(segment),
    )
  ) {
    fail(
      label,
      "entry path is not a normalized safe relative path for portable extraction",
    );
  }
  if (posix.normalize(path) !== path) {
    fail(label, "entry path is not POSIX-normalized");
  }
  validatePublicationPath(segments, label);
  return { isDirectory, path };
}

function portableLogicalPath(path) {
  const logicalPath = path.endsWith("/") ? path.slice(0, -1) : path;
  return logicalPath
    .split("/")
    .map((segment) => segment.toLocaleLowerCase("en-US"))
    .join("/");
}

function registerEntryHierarchy({
  entryKindsByPortablePath,
  kind,
  label,
  path,
}) {
  const portablePath = portableLogicalPath(path);
  const existingKind = entryKindsByPortablePath.get(portablePath);
  if (existingKind) {
    fail(label, "file and directory paths collide on a portable filesystem");
  }

  const segments = portablePath.split("/");
  for (let index = 1; index < segments.length; index += 1) {
    const ancestor = segments.slice(0, index).join("/");
    if (entryKindsByPortablePath.get(ancestor) === "file") {
      fail(label, "entry is nested below a path that is already a file");
    }
  }

  if (kind === "file") {
    const descendantPrefix = `${portablePath}/`;
    for (const existingPath of entryKindsByPortablePath.keys()) {
      if (existingPath.startsWith(descendantPrefix)) {
        fail(label, "file path already has child entries");
      }
    }
  }
  entryKindsByPortablePath.set(portablePath, kind);
}

function parseExtraFields(extra, label) {
  let offset = 0;
  while (offset < extra.byteLength) {
    if (extra.byteLength - offset < 4) {
      fail(label, "extra field header is truncated");
    }
    const id = extra.readUInt16LE(offset);
    const size = extra.readUInt16LE(offset + 2);
    offset += 4;
    if (size > extra.byteLength - offset) {
      fail(label, "extra field payload is truncated");
    }
    if (id === ZIP64_EXTRA_FIELD_ID) {
      fail(label, "ZIP64 is not supported");
    }
    offset += size;
  }
}

function classifyEntry({
  externalAttributes,
  madeBySystem,
  pathIsDirectory,
  label,
}) {
  const dosAttributes = externalAttributes & 0xffff;
  const dosDirectory = (externalAttributes & 0x10) !== 0;
  if (
    (dosAttributes & UNSAFE_DOS_ATTRIBUTE_MASK) !== 0 ||
    (dosAttributes & ~0x30) !== 0
  ) {
    fail(label, "hidden, system, volume, or read-only DOS attributes are forbidden");
  }
  if (madeBySystem === 3) {
    const unixMode = (externalAttributes >>> 16) & 0xffff;
    const type = unixMode & 0o170000;
    if (type === 0o120000) fail(label, "symbolic links are forbidden");
    if (type !== 0o040000 && type !== 0o100000) {
      fail(label, "special filesystem entries are forbidden");
    }
    const modeIsDirectory = type === 0o040000;
    if (modeIsDirectory !== pathIsDirectory) {
      fail(label, "entry path and Unix file type disagree");
    }
    if (dosDirectory !== modeIsDirectory) {
      fail(label, "entry DOS and Unix file types disagree");
    }
    const expectedMode = modeIsDirectory
      ? SAFE_UNIX_DIRECTORY_MODE
      : SAFE_UNIX_FILE_MODE;
    if (unixMode !== expectedMode) {
      fail(
        label,
        modeIsDirectory
          ? "directory permissions must be normalized to 0755"
          : "file permissions must be normalized to non-executable mode 0644",
      );
    }
    return modeIsDirectory ? "directory" : "file";
  }

  if (madeBySystem !== 0) {
    fail(label, "unsupported creator filesystem cannot prove entry type");
  }
  if ((externalAttributes & 0xffff0000) !== 0) {
    fail(label, "DOS-created entries must not carry ambiguous Unix attributes");
  }
  if (dosDirectory !== pathIsDirectory) {
    fail(label, "entry path and DOS file type disagree");
  }
  return dosDirectory ? "directory" : "file";
}

function validateActiveContent(path, text, label) {
  const extension = extname(path).slice(1).toLowerCase();
  if (!ACTIVE_CODE_EXTENSIONS.has(extension)) return;

  for (const rule of UNSAFE_ACTIVE_CODE_PATTERNS) {
    if (rule.re.test(text)) {
      fail(label, `active content contains ${rule.label}`);
    }
  }
  if (extension === "html" || extension === "svg") {
    for (const rule of UNSAFE_MARKUP_PATTERNS) {
      if (rule.re.test(text)) {
        fail(label, `active markup contains ${rule.label}`);
      }
    }
  }
  if (extension === "svg" && UNSAFE_SVG_ELEMENT_RE.test(text)) {
    fail(label, "SVG contains a forbidden active element");
  }
}

function hasNestedArchiveMagic(bytes) {
  if (
    bytes.byteLength >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(bytes[2]) &&
    [0x04, 0x06, 0x08].includes(bytes[3])
  ) {
    return true;
  }
  if (bytes.byteLength >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return true;
  }
  if (
    bytes.byteLength >= 6 &&
    bytes.subarray(0, 6).equals(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))
  ) {
    return true;
  }
  if (
    bytes.byteLength >= 6 &&
    (bytes.subarray(0, 6).equals(Buffer.from("Rar!\x1a\x07", "binary")) ||
      bytes.subarray(0, 3).equals(Buffer.from("BZh", "ascii")) ||
      bytes
        .subarray(0, 6)
        .equals(Buffer.from([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])))
  ) {
    return true;
  }
  return (
    bytes.byteLength >= 262 &&
    bytes.subarray(257, 262).toString("ascii") === "ustar"
  );
}

let crcTable;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[n] = value >>> 0;
  }
  return crcTable;
}

export function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEocd(bytes, label) {
  if (bytes.byteLength < 22) fail(label, "archive is shorter than an EOCD");
  const minimumOffset = Math.max(0, bytes.byteLength - 22 - 0xffff);
  const candidates = [];
  for (let offset = bytes.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (bytes.readUInt32LE(offset) !== EOCD_SIGNATURE) continue;
    const commentLength = readUInt16(
      bytes,
      offset + 20,
      label,
      "EOCD comment length",
    );
    if (offset + 22 + commentLength === bytes.byteLength) {
      candidates.push(offset);
    }
  }
  if (candidates.length !== 1) {
    fail(label, "archive must contain exactly one terminal EOCD record");
  }
  return candidates[0];
}

function validateCompressionBounds(entry, label) {
  if (entry.compressedSize > MAX_ZIP_ENTRY_COMPRESSED_BYTES) {
    fail(label, "entry exceeds the compressed-size limit");
  }
  if (entry.uncompressedSize > MAX_ZIP_ENTRY_UNCOMPRESSED_BYTES) {
    fail(label, "entry exceeds the uncompressed-size limit");
  }
  if (
    entry.uncompressedSize > 0 &&
    entry.uncompressedSize / Math.max(entry.compressedSize, 1) >
      MAX_ZIP_COMPRESSION_RATIO
  ) {
    fail(label, "entry exceeds the compression-ratio limit");
  }
}

function inflateEntry(compressed, entry, label) {
  let inflated;
  if (entry.method === STORED) {
    if (entry.compressedSize !== entry.uncompressedSize) {
      fail(label, "stored entry sizes disagree");
    }
    inflated = Buffer.from(compressed);
  } else {
    try {
      inflated = inflateRawSync(compressed, {
        maxOutputLength: entry.uncompressedSize + 1,
      });
    } catch (error) {
      fail(
        label,
        `deflate stream is invalid or exceeds its bound (${error?.code ?? "inflate error"})`,
      );
    }
  }
  if (inflated.byteLength !== entry.uncompressedSize) {
    fail(label, "inflated size differs from the central directory");
  }
  if (crc32(inflated) !== entry.crc) {
    fail(label, "CRC-32 differs from the central directory");
  }
  return inflated;
}

/**
 * Fully validates and inflates a bounded, single-disk, non-ZIP64 ZIP archive.
 * It accepts only regular UTF-8 text files and directories. Returned buffers
 * are bounded by the exported per-entry and aggregate limits.
 */
export function inspectZipArchive(input, { label = "ZIP archive" } = {}) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.byteLength > MAX_ZIP_ARCHIVE_BYTES) {
    fail(label, "archive exceeds the compressed archive-size limit");
  }

  const eocdOffset = findEocd(bytes, label);
  const diskNumber = readUInt16(bytes, eocdOffset + 4, label, "EOCD disk");
  const centralDisk = readUInt16(
    bytes,
    eocdOffset + 6,
    label,
    "EOCD central-directory disk",
  );
  const entriesOnDisk = readUInt16(
    bytes,
    eocdOffset + 8,
    label,
    "EOCD per-disk entry count",
  );
  const entryCount = readUInt16(
    bytes,
    eocdOffset + 10,
    label,
    "EOCD entry count",
  );
  const centralSize = readUInt32(
    bytes,
    eocdOffset + 12,
    label,
    "EOCD central-directory size",
  );
  const centralOffset = readUInt32(
    bytes,
    eocdOffset + 16,
    label,
    "EOCD central-directory offset",
  );
  const commentLength = readUInt16(
    bytes,
    eocdOffset + 20,
    label,
    "EOCD comment length",
  );

  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    fail(label, "multidisk archives are not supported");
  }
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    fail(label, "ZIP64 is not supported");
  }
  if (entryCount === 0 || entryCount > MAX_ZIP_ENTRIES) {
    fail(label, "entry count is outside the allowed bounds");
  }
  if (centralSize > MAX_ZIP_CENTRAL_DIRECTORY_BYTES) {
    fail(label, "central directory exceeds its size limit");
  }
  if (commentLength !== 0) {
    fail(label, "archive comments are forbidden");
  }
  if (centralOffset + centralSize !== eocdOffset) {
    fail(label, "central-directory bounds do not exactly meet the EOCD");
  }
  assertBounds(
    bytes,
    centralOffset,
    centralSize,
    label,
    "central directory",
  );

  const entries = [];
  const exactPaths = new Set();
  const portablePaths = new Set();
  const entryKindsByPortablePath = new Map();
  let centralCursor = centralOffset;
  let totalCompressed = 0;
  let totalUncompressed = 0;

  for (let index = 0; index < entryCount; index += 1) {
    const entryLabel = `${label} entry ${index + 1}`;
    assertBounds(bytes, centralCursor, 46, entryLabel, "central header");
    if (bytes.readUInt32LE(centralCursor) !== CENTRAL_SIGNATURE) {
      fail(entryLabel, "central header signature is invalid");
    }

    const versionMadeBy = bytes.readUInt16LE(centralCursor + 4);
    const versionNeeded = bytes.readUInt16LE(centralCursor + 6);
    const flags = bytes.readUInt16LE(centralCursor + 8);
    const method = bytes.readUInt16LE(centralCursor + 10);
    const modifiedTime = bytes.readUInt16LE(centralCursor + 12);
    const modifiedDate = bytes.readUInt16LE(centralCursor + 14);
    const crc = bytes.readUInt32LE(centralCursor + 16);
    const compressedSize = bytes.readUInt32LE(centralCursor + 20);
    const uncompressedSize = bytes.readUInt32LE(centralCursor + 24);
    const pathLength = bytes.readUInt16LE(centralCursor + 28);
    const extraLength = bytes.readUInt16LE(centralCursor + 30);
    const fileCommentLength = bytes.readUInt16LE(centralCursor + 32);
    const diskStart = bytes.readUInt16LE(centralCursor + 34);
    const externalAttributes = bytes.readUInt32LE(centralCursor + 38);
    const localOffset = bytes.readUInt32LE(centralCursor + 42);
    const variableLength = pathLength + extraLength + fileCommentLength;
    assertBounds(
      bytes,
      centralCursor + 46,
      variableLength,
      entryLabel,
      "central variable fields",
    );

    if (versionNeeded === 0xffff || versionNeeded > 20) {
      fail(entryLabel, "unsupported extraction version or ZIP64 marker");
    }
    if ((flags & ~ALLOWED_FLAGS) !== 0) {
      fail(entryLabel, "encryption, data descriptors, or unsupported flags are forbidden");
    }
    if (method !== STORED && method !== DEFLATED) {
      fail(entryLabel, "unsupported compression method");
    }
    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localOffset === 0xffffffff ||
      diskStart === 0xffff
    ) {
      fail(entryLabel, "ZIP64 is not supported");
    }
    if (diskStart !== 0) fail(entryLabel, "multidisk entries are forbidden");
    if (fileCommentLength !== 0) fail(entryLabel, "file comments are forbidden");

    const pathBytes = bytes.subarray(
      centralCursor + 46,
      centralCursor + 46 + pathLength,
    );
    const centralExtra = bytes.subarray(
      centralCursor + 46 + pathLength,
      centralCursor + 46 + pathLength + extraLength,
    );
    parseExtraFields(centralExtra, entryLabel);
    if (extraLength !== 0) {
      fail(entryLabel, "extra fields are forbidden in publication archives");
    }
    const pathInfo = validatePath(pathBytes, flags, entryLabel);
    const pathLabel = `${label}!/${pathInfo.path}`;
    if (
      exactPaths.has(pathInfo.path) ||
      portablePaths.has(pathInfo.path.normalize("NFC").toLocaleLowerCase("en-US"))
    ) {
      fail(pathLabel, "duplicate or portable-filesystem-colliding entry path");
    }
    exactPaths.add(pathInfo.path);
    portablePaths.add(pathInfo.path.normalize("NFC").toLocaleLowerCase("en-US"));

    const kind = classifyEntry({
      externalAttributes,
      madeBySystem: versionMadeBy >>> 8,
      pathIsDirectory: pathInfo.isDirectory,
      label: pathLabel,
    });
    registerEntryHierarchy({
      entryKindsByPortablePath,
      kind,
      label: pathLabel,
      path: pathInfo.path,
    });
    const entry = {
      compressedSize,
      crc,
      externalAttributes,
      flags,
      kind,
      localOffset,
      method,
      modifiedDate,
      modifiedTime,
      path: pathInfo.path,
      pathBytes: Buffer.from(pathBytes),
      uncompressedSize,
      versionNeeded,
    };
    if (kind === "directory") {
      if (
        method !== STORED ||
        compressedSize !== 0 ||
        uncompressedSize !== 0 ||
        crc !== 0
      ) {
        fail(pathLabel, "directory entries must be empty and stored");
      }
    } else {
      validateCompressionBounds(entry, pathLabel);
      totalCompressed += compressedSize;
      totalUncompressed += uncompressedSize;
      if (totalCompressed > MAX_ZIP_TOTAL_COMPRESSED_BYTES) {
        fail(label, "archive exceeds the aggregate compressed-size limit");
      }
      if (totalUncompressed > MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES) {
        fail(label, "archive exceeds the aggregate uncompressed-size limit");
      }
    }
    entries.push(entry);
    centralCursor += 46 + variableLength;
  }

  if (centralCursor !== eocdOffset) {
    fail(label, "central directory has trailing, missing, or uncounted bytes");
  }
  if (
    totalUncompressed > 0 &&
    totalUncompressed / Math.max(totalCompressed, 1) >
      MAX_ZIP_COMPRESSION_RATIO
  ) {
    fail(label, "archive exceeds the aggregate compression-ratio limit");
  }

  const entriesByLocalOffset = [...entries].sort(
    (left, right) => left.localOffset - right.localOffset,
  );
  let localCursor = 0;
  const inspected = [];

  for (const entry of entriesByLocalOffset) {
    const entryLabel = `${label}!/${entry.path}`;
    if (entry.localOffset !== localCursor) {
      fail(entryLabel, "local records contain a gap, overlap, or duplicate offset");
    }
    assertBounds(bytes, localCursor, 30, entryLabel, "local header");
    if (bytes.readUInt32LE(localCursor) !== LOCAL_SIGNATURE) {
      fail(entryLabel, "local header signature is invalid");
    }

    const localVersionNeeded = bytes.readUInt16LE(localCursor + 4);
    const localFlags = bytes.readUInt16LE(localCursor + 6);
    const localMethod = bytes.readUInt16LE(localCursor + 8);
    const localModifiedTime = bytes.readUInt16LE(localCursor + 10);
    const localModifiedDate = bytes.readUInt16LE(localCursor + 12);
    const localCrc = bytes.readUInt32LE(localCursor + 14);
    const localCompressedSize = bytes.readUInt32LE(localCursor + 18);
    const localUncompressedSize = bytes.readUInt32LE(localCursor + 22);
    const localPathLength = bytes.readUInt16LE(localCursor + 26);
    const localExtraLength = bytes.readUInt16LE(localCursor + 28);
    const localVariableLength = localPathLength + localExtraLength;
    assertBounds(
      bytes,
      localCursor + 30,
      localVariableLength,
      entryLabel,
      "local variable fields",
    );
    const localPathBytes = bytes.subarray(
      localCursor + 30,
      localCursor + 30 + localPathLength,
    );
    const localExtra = bytes.subarray(
      localCursor + 30 + localPathLength,
      localCursor + 30 + localVariableLength,
    );
    parseExtraFields(localExtra, entryLabel);
    if (localExtraLength !== 0) {
      fail(entryLabel, "local extra fields are forbidden in publication archives");
    }
    if (
      localVersionNeeded !== entry.versionNeeded ||
      localFlags !== entry.flags ||
      localMethod !== entry.method ||
      localModifiedTime !== entry.modifiedTime ||
      localModifiedDate !== entry.modifiedDate ||
      localCrc !== entry.crc ||
      localCompressedSize !== entry.compressedSize ||
      localUncompressedSize !== entry.uncompressedSize ||
      !localPathBytes.equals(entry.pathBytes)
    ) {
      fail(entryLabel, "local and central metadata disagree");
    }

    const dataOffset = localCursor + 30 + localVariableLength;
    assertBounds(
      bytes,
      dataOffset,
      entry.compressedSize,
      entryLabel,
      "compressed entry data",
    );
    const dataEnd = dataOffset + entry.compressedSize;
    if (dataEnd > centralOffset) {
      fail(entryLabel, "entry data overlaps the central directory");
    }
    localCursor = dataEnd;

    if (entry.kind === "directory") {
      inspected.push({
        bytes: Buffer.alloc(0),
        kind: "directory",
        path: entry.path,
        text: null,
      });
      continue;
    }

    const inflated = inflateEntry(
      bytes.subarray(dataOffset, dataEnd),
      entry,
      entryLabel,
    );
    if (
      NESTED_ARCHIVE_EXTENSION_RE.test(entry.path) ||
      hasNestedArchiveMagic(inflated)
    ) {
      fail(entryLabel, "nested archives are forbidden");
    }
    const extension = extname(entry.path).slice(1).toLowerCase();
    if (!ARCHIVE_TEXT_EXTENSIONS.has(extension)) {
      fail(entryLabel, "entry is not a recognized text file");
    }
    if (inflated.includes(0)) {
      fail(entryLabel, "text entry contains NUL bytes");
    }
    const text = decodeUtf8(inflated, entryLabel, "text entry");
    validateActiveContent(entry.path, text, entryLabel);
    inspected.push({
      bytes: inflated,
      kind: "file",
      path: entry.path,
      text,
    });
  }

  if (localCursor !== centralOffset) {
    fail(label, "local records do not exactly meet the central directory");
  }
  return inspected;
}
