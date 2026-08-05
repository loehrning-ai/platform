#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import {
  extname,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";
import {
  BINARY_ASSET_EXTENSIONS,
  EXPORT_PROFILES,
  GENERIC_BASE64_RE,
  LOCKFILE_BASENAMES,
  PRICING_RULES,
  PRIVATE_CONTENT_RULES,
  SECRET_VALUE_RULES,
  hasBase64SecretShape,
  isPrivateExportPath,
  matchedPrivateRules,
} from "./export-denylist.mjs";
import {
  MAX_ZIP_ARCHIVE_BYTES,
  inspectZipArchive,
} from "./zip-inspection.mjs";

// Build output and VCS internals are normally not publication candidates.
// Platform scans still descend into any generated directory containing a
// Git-tracked or non-ignored untracked candidate so force-added credentials
// cannot hide behind a generated basename.
const GENERATED_DIRS = new Set([
  ".bun-cache",
  ".cache",
  ".git",
  ".lighthouseci",
  ".mypy_cache",
  ".next",
  ".pytest_cache",
  ".ruff_cache",
  ".output",
  ".swc",
  ".turbo",
  ".vercel",
  ".venv",
  "__pycache__",
  "blob-report",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
  "venv",
]);

// Secret-like filenames (whole basename). The export copy relies on the
// scan-before-copy gate to block these, so this stays scanner-local rather than
// living in the shared copy denylist.
const SECRET_FILE_RE =
  /(^|\/)(\.env(\..*)?|\.dockercfg|\.git-credentials|\.netrc|\.npmrc|\.pypirc|credentials\.json|kubeconfig|id_(?:rsa|dsa|ecdsa|ed25519)|.*\.pem|.*\.p12|.*\.pfx|.*\.key|service-account.*\.json)$/i;
const ENV_EXAMPLE_RE = /(^|\/)[^/]*\.env[^/]*\.example$/i;
const ASSET_MANIFEST_BASENAME = "ASSET_MANIFEST.json";
const ASSET_MANIFEST_VERSION = 1;
const ASSET_METADATA_FIELDS = ["owner", "source", "license", "redistribution"];
const MANIFEST_TEXT_ASSET_EXTENSIONS = new Set([
  "html",
  "md",
  "svg",
  "txt",
  "vtt",
]);
const SENSITIVE_ENV_NAME_RE =
  /(?:^|_)(?:API_?KEY|KEY|TOKEN|SECRET|PASSWORD|PASS|PRIVATE_KEY|SERVICE_ROLE_KEY)(?:_|$)|^(?:DATABASE|DIRECT)_URL$|^DIGIFYDE_API_URL$|^ALLOW_UNVERIFIED_SCAN_TOKEN$/i;
const KNOWN_TEXT_EXTENSIONS = new Set([
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
  "xml",
  "yaml",
  "yml",
]);

const LARGE_FILE_BYTES = 1024 * 1024;
/** Text is scanned completely, but never allocated beyond this hard ceiling. */
export const MAX_BUFFERED_FILE_BYTES = 16 * 1024 * 1024;
/** No export candidate file may exceed the artifact publication ceiling. */
export const MAX_SCANNED_FILE_BYTES = 100 * 1024 * 1024;
/** The manifest is parsed in memory and needs a substantially tighter bound. */
export const MAX_ASSET_MANIFEST_BYTES = 2 * 1024 * 1024;
const DESCRIPTOR_READ_CHUNK_BYTES = 64 * 1024;
const BINARY_SAMPLE_BYTES = 4 * 1024;
const FAIL_CLOSED_PLATFORM_ARCHIVE_EXTENSIONS = new Set(["7z", "gz", "tar"]);
const FAIL_CLOSED_PLATFORM_CONTAINER_EXTENSIONS = new Set([
  "docx",
  "pdf",
  "pptx",
  "xlsx",
]);
const MAX_GIT_CANDIDATE_OUTPUT_BYTES = 64 * 1024 * 1024;

// Severity model:
//   FAIL  blocks the export and sets a non-zero exit code.
//   WARN  is surfaced for manual sign-off; it does not block.
//   ASSET is recorded for the license/asset audit; it does not block.
const FAIL = "FAIL";
const WARN = "WARN";
const ASSET = "ASSET";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
const source = isDirectRun ? argValue("--source") : null;
const dest = isDirectRun ? argValue("--dest") : null;
const profile = isDirectRun
  ? (argValue("--profile") ?? "interactive-courses")
  : "interactive-courses";
if (isDirectRun && ((source && dest) || (!source && !dest))) {
  console.error(
    "Usage: scan-export.mjs (--source <dir> | --dest <dir>) [--profile interactive-courses|platform]",
  );
  process.exit(2);
}
if (isDirectRun && !EXPORT_PROFILES.includes(profile)) {
  console.error(
    `scan-export: unsupported profile ${JSON.stringify(profile)}; expected ${EXPORT_PROFILES.join(" or ")}`,
  );
  process.exit(2);
}
const mode = dest ? "dest" : "source";
let root = dest ?? source;

const findings = [];
let filesChecked = 0;
const assetManifestEntries = new Map();
const manifestPathsDeclared = new Set();
const assetPathsSeen = new Set();
const scannedFileStates = new Map();
let gitCandidatePaths = null;
let gitCandidateDirectories = null;
let initialGitCandidateSnapshot = null;
let loadedAssetManifestState = null;

function addFinding(path, line, severity, label) {
  findings.push({ path, line, severity, label });
}

function toPosixPath(path) {
  return path.replace(/\\/g, "/");
}

function isContainedPath(rootDirectory, candidatePath) {
  const candidateRelativePath = relative(rootDirectory, candidatePath);
  return (
    candidateRelativePath !== ".." &&
    !candidateRelativePath.startsWith(`..${sep}`) &&
    !isAbsolute(candidateRelativePath)
  );
}

function gitCommand(rootDirectory, args) {
  return spawnSync("git", ["-C", rootDirectory, ...args], {
    encoding: null,
    maxBuffer: MAX_GIT_CANDIDATE_OUTPUT_BYTES,
    timeout: 10_000,
    windowsHide: true,
  });
}

async function readGitCandidateSnapshot(rootDirectory) {
  const topLevelResult = gitCommand(rootDirectory, [
    "rev-parse",
    "--show-toplevel",
  ]);
  if (topLevelResult.error || topLevelResult.status !== 0) return null;

  let topLevel;
  try {
    topLevel = new TextDecoder("utf-8", { fatal: true })
      .decode(topLevelResult.stdout)
      .trim();
  } catch {
    throw fileReadError("Git publication inventory", "root is not valid UTF-8");
  }
  let canonicalTopLevel;
  try {
    canonicalTopLevel = await realpath(topLevel);
  } catch (error) {
    throw fileReadError(
      "Git publication inventory",
      `root cannot be resolved (${error?.code ?? "realpath error"})`,
      error?.code,
    );
  }
  if (canonicalTopLevel !== rootDirectory) {
    return null;
  }

  const filesResult = gitCommand(rootDirectory, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--deduplicate",
    "-z",
    "--",
    ".",
  ]);
  if (filesResult.error || filesResult.status !== 0) {
    throw fileReadError(
      "Git publication inventory",
      `cannot enumerate candidates (${filesResult.error?.code ?? `exit ${filesResult.status}`})`,
      filesResult.error?.code,
    );
  }

  const paths = new Set();
  const directories = new Set();
  const rawPaths = filesResult.stdout.subarray(
    0,
    filesResult.stdout.byteLength > 0
      ? filesResult.stdout.byteLength - 1
      : 0,
  );
  if (rawPaths.byteLength > 0) {
    for (const rawPath of rawPaths.toString("binary").split("\0")) {
      let path;
      try {
        path = new TextDecoder("utf-8", { fatal: true }).decode(
          Buffer.from(rawPath, "binary"),
        );
      } catch {
        throw fileReadError(
          "Git publication inventory",
          "contains a non-UTF-8 path",
        );
      }
      if (
        path.length === 0 ||
        path.startsWith("/") ||
        path.startsWith("./") ||
        path.includes("\\") ||
        posix.normalize(path) !== path ||
        path.split("/").includes("..")
      ) {
        throw fileReadError(
          "Git publication inventory",
          "contains an unsafe or non-normalized path",
        );
      }
      paths.add(path);
      const segments = path.split("/");
      segments.pop();
      let directory = "";
      for (const segment of segments) {
        directory = directory ? `${directory}/${segment}` : segment;
        directories.add(directory);
      }
    }
  }

  return {
    directories,
    paths,
    serialized: [...paths].sort().join("\0"),
  };
}

function fileReadError(label, message, code = "ESECURITY") {
  const error = new Error(`${label} ${message}`);
  error.code = code;
  return error;
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameStableFileState(left, right) {
  return (
    sameFileIdentity(left, right) &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.uid === right.uid &&
    left.gid === right.gid &&
    left.rdev === right.rdev &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

async function assertOpenedPathIdentity({
  canonicalRoot,
  absolutePath,
  openedInfo,
  label,
}) {
  const relativePath = relative(canonicalRoot, absolutePath);
  if (!isContainedPath(canonicalRoot, absolutePath) || relativePath === "") {
    throw fileReadError(label, "path escapes the scan root");
  }

  const components = relativePath.split(sep);
  let currentPath = canonicalRoot;
  let finalPathInfo = null;
  for (let index = 0; index < components.length; index += 1) {
    currentPath = join(currentPath, components[index]);
    let componentInfo;
    try {
      componentInfo = await lstat(currentPath, { bigint: true });
    } catch (error) {
      throw fileReadError(
        label,
        `path changed while it was being scanned (${error?.code ?? "lstat error"})`,
        error?.code,
      );
    }
    const isFinalComponent = index === components.length - 1;
    if (componentInfo.isSymbolicLink()) {
      throw fileReadError(label, "must not use a symbolic-link path component");
    }
    if (
      (!isFinalComponent && !componentInfo.isDirectory()) ||
      (isFinalComponent && !componentInfo.isFile())
    ) {
      throw fileReadError(label, "path changed while it was being scanned");
    }
    if (isFinalComponent) finalPathInfo = componentInfo;
  }

  if (!finalPathInfo || !sameFileIdentity(openedInfo, finalPathInfo)) {
    throw fileReadError(label, "pathname no longer identifies the opened file");
  }

  let resolvedPath;
  try {
    resolvedPath = await realpath(absolutePath);
  } catch (error) {
    throw fileReadError(
      label,
      `path changed while it was being scanned (${error?.code ?? "realpath error"})`,
      error?.code,
    );
  }
  if (!isContainedPath(canonicalRoot, resolvedPath)) {
    throw fileReadError(label, "must resolve inside the scan root");
  }

  let confirmedInfo;
  try {
    confirmedInfo = await lstat(absolutePath, { bigint: true });
  } catch (error) {
    throw fileReadError(
      label,
      `path changed while it was being scanned (${error?.code ?? "lstat error"})`,
      error?.code,
    );
  }
  if (
    confirmedInfo.isSymbolicLink() ||
    !confirmedInfo.isFile() ||
    !sameFileIdentity(openedInfo, confirmedInfo)
  ) {
    throw fileReadError(
      label,
      "pathname changed identity while it was being scanned",
    );
  }
}

async function readDescriptorBytes({
  fileHandle,
  expectedSizeBytes,
  absolutePath,
  label,
  hooks,
}) {
  const bytes = Buffer.alloc(expectedSizeBytes);
  let offset = 0;
  while (offset < expectedSizeBytes) {
    const length = Math.min(
      DESCRIPTOR_READ_CHUNK_BYTES,
      expectedSizeBytes - offset,
    );
    const { bytesRead } = await fileHandle.read(
      bytes,
      offset,
      length,
      offset,
    );
    if (bytesRead === 0) break;
    offset += bytesRead;
    await hooks?.afterChunk?.({
      absolutePath,
      bytesRead,
      label,
      totalBytesRead: offset,
    });
  }
  return offset === expectedSizeBytes ? bytes : bytes.subarray(0, offset);
}

async function readDescriptorRange(fileHandle, offset, length) {
  const bytes = Buffer.alloc(length);
  let bytesReadTotal = 0;
  while (bytesReadTotal < length) {
    const { bytesRead } = await fileHandle.read(
      bytes,
      bytesReadTotal,
      length - bytesReadTotal,
      offset + bytesReadTotal,
    );
    if (bytesRead === 0) break;
    bytesReadTotal += bytesRead;
  }
  return bytesReadTotal === length
    ? bytes
    : bytes.subarray(0, bytesReadTotal);
}

async function sampleDescriptorBytes(fileHandle, expectedSizeBytes) {
  const prefixLength = Math.min(BINARY_SAMPLE_BYTES, expectedSizeBytes);
  const suffixLength = Math.min(BINARY_SAMPLE_BYTES, expectedSizeBytes);
  const prefixBytes = await readDescriptorRange(fileHandle, 0, prefixLength);
  const suffixBytes =
    expectedSizeBytes <= BINARY_SAMPLE_BYTES
      ? prefixBytes
      : await readDescriptorRange(
          fileHandle,
          expectedSizeBytes - suffixLength,
          suffixLength,
        );
  return { prefixBytes, suffixBytes };
}

async function hashDescriptorBytes({
  fileHandle,
  expectedSizeBytes,
  absolutePath,
  label,
  hooks,
}) {
  const hash = createHash("sha256");
  const chunk = Buffer.alloc(
    Math.min(DESCRIPTOR_READ_CHUNK_BYTES, expectedSizeBytes),
  );
  let offset = 0;
  while (offset < expectedSizeBytes) {
    const length = Math.min(chunk.byteLength, expectedSizeBytes - offset);
    const { bytesRead } = await fileHandle.read(chunk, 0, length, offset);
    if (bytesRead === 0) break;
    hash.update(chunk.subarray(0, bytesRead));
    offset += bytesRead;
    await hooks?.afterChunk?.({
      absolutePath,
      bytesRead,
      label,
      totalBytesRead: offset,
    });
  }
  return {
    bytesRead: offset,
    sha256: hash.digest("hex"),
  };
}

/**
 * Opens and optionally reads or hashes one regular file without returning to
 * its pathname for data. Buffering is stat-bounded before allocation; hashes
 * are streamed through a fixed-size buffer. Optional hooks exist only to make
 * filesystem race regressions deterministic in the scanner test.
 */
export async function readStableRegularFile({
  rootDirectory,
  filePath,
  readContents = true,
  hashContents = false,
  sampleContents = false,
  maxBytes = readContents
    ? MAX_BUFFERED_FILE_BYTES
    : MAX_SCANNED_FILE_BYTES,
  hooks,
}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("maxBytes must be a positive safe integer");
  }
  const requestedRoot = resolve(rootDirectory);
  let canonicalRoot;
  try {
    canonicalRoot = await realpath(requestedRoot);
  } catch (error) {
    throw fileReadError(
      "scan root",
      `does not exist (${error?.code ?? "realpath error"})`,
      error?.code,
    );
  }
  const requestedPath = isAbsolute(filePath)
    ? resolve(filePath)
    : resolve(requestedRoot, filePath);
  const requestedRelativePath = relative(requestedRoot, requestedPath);
  if (
    requestedRelativePath === "" ||
    !isContainedPath(requestedRoot, requestedPath)
  ) {
    throw fileReadError(
      toPosixPath(requestedRelativePath) || ".",
      "path escapes the scan root",
    );
  }
  const absolutePath = resolve(canonicalRoot, requestedRelativePath);
  const label = toPosixPath(relative(canonicalRoot, absolutePath)) || ".";
  if (!isContainedPath(canonicalRoot, absolutePath) || label === ".") {
    throw fileReadError(label, "path escapes the scan root");
  }

  let fileHandle;
  try {
    fileHandle = await open(
      absolutePath,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
  } catch (error) {
    throw fileReadError(
      label,
      `cannot be opened as a regular non-symlink file (${error?.code ?? "open error"})`,
      error?.code,
    );
  }

  try {
    const before = await fileHandle.stat({ bigint: true });
    if (!before.isFile()) {
      throw fileReadError(label, "must be a regular file");
    }
    if (
      before.size > BigInt(Number.MAX_SAFE_INTEGER) ||
      before.size > BigInt(maxBytes)
    ) {
      throw fileReadError(
        label,
        `exceeds the ${String(maxBytes)} byte size limit`,
        "EFBIG",
      );
    }
    const expectedSizeBytes = Number(before.size);
    await hooks?.afterOpen?.({ absolutePath, label });
    await assertOpenedPathIdentity({
      canonicalRoot,
      absolutePath,
      openedInfo: before,
      label,
    });

    const bytes = readContents
      ? await readDescriptorBytes({
          fileHandle,
          expectedSizeBytes,
          absolutePath,
          label,
          hooks,
        })
      : null;
    const sampled = sampleContents
      ? bytes
        ? {
            prefixBytes: bytes.subarray(
              0,
              Math.min(BINARY_SAMPLE_BYTES, bytes.byteLength),
            ),
            suffixBytes: bytes.subarray(
              Math.max(0, bytes.byteLength - BINARY_SAMPLE_BYTES),
            ),
          }
        : await sampleDescriptorBytes(fileHandle, expectedSizeBytes)
      : { prefixBytes: null, suffixBytes: null };
    const hashed = hashContents
      ? readContents
        ? {
            bytesRead: bytes.byteLength,
            sha256: createHash("sha256").update(bytes).digest("hex"),
          }
        : await hashDescriptorBytes({
            fileHandle,
            expectedSizeBytes,
            absolutePath,
            label,
            hooks,
          })
      : null;
    const bytesRead = bytes?.byteLength ?? hashed?.bytesRead ?? 0;
    await hooks?.afterRead?.({
      absolutePath,
      bytes,
      label,
      sha256: hashed?.sha256 ?? null,
    });

    const after = await fileHandle.stat({ bigint: true });
    if (!sameStableFileState(before, after)) {
      throw fileReadError(label, "changed while it was being scanned");
    }
    if ((readContents || hashContents) && BigInt(bytesRead) !== before.size) {
      throw fileReadError(label, "changed length while it was being scanned");
    }
    await assertOpenedPathIdentity({
      canonicalRoot,
      absolutePath,
      openedInfo: after,
      label,
    });
    return {
      bytes,
      prefixBytes: sampled.prefixBytes,
      sha256: hashed?.sha256 ?? null,
      sizeBytes: expectedSizeBytes,
      stableState: after,
      suffixBytes: sampled.suffixBytes,
    };
  } finally {
    await fileHandle.close();
  }
}

function isEnvExample(rel) {
  return ENV_EXAMPLE_RE.test(rel);
}

function normalizedExampleValue(rawValue) {
  let value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
    value = value.slice(1, value.lastIndexOf(quote)).trim();
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }
  return value;
}

const CANONICAL_PLACEHOLDER_WORDS = new Set([
  "api",
  "access",
  "cloudflare",
  "credential",
  "dev",
  "development",
  "dsn",
  "dummy",
  "e2e",
  "email",
  "example",
  "fake",
  "fixture",
  "key",
  "local",
  "mock",
  "non",
  "password",
  "placeholder",
  "production",
  "project",
  "publishable",
  "ref",
  "refresh",
  "secret",
  "site",
  "supabase",
  "test",
  "token",
  "turnstile",
  "url",
  "user",
  "username",
  "value",
  "your",
]);

function isCanonicalAnglePlaceholder(value) {
  if (!/^<[A-Za-z][A-Za-z0-9_-]{0,80}>$/.test(value)) return false;
  const words = value
    .slice(1, -1)
    .toLowerCase()
    .split(/[-_]/)
    .filter(Boolean);
  return (
    words.length > 0 &&
    words.length <= 8 &&
    words.every((word) => CANONICAL_PLACEHOLDER_WORDS.has(word))
  );
}

function isCanonicalBarePlaceholder(value) {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(value)) return false;
  const words = value.toLowerCase().split(/[-_]/).filter(Boolean);
  const hasPlaceholderMarker = words.some((word) =>
    [
      "dev",
      "development",
      "dummy",
      "e2e",
      "example",
      "fake",
      "fixture",
      "local",
      "mock",
      "placeholder",
      "test",
      "your",
    ].includes(word),
  );
  return (
    hasPlaceholderMarker &&
    words.length <= 8 &&
    words.every((word) => CANONICAL_PLACEHOLDER_WORDS.has(word))
  );
}

function replaceCanonicalAnglePlaceholders(value) {
  let valid = true;
  let count = 0;
  const replaced = value.replace(/<[^<>\r\n]*>/g, (placeholder) => {
    if (!isCanonicalAnglePlaceholder(placeholder)) valid = false;
    count += 1;
    return "placeholder";
  });
  return valid ? { count, replaced } : null;
}

function isSafeExampleUrl(value) {
  const replacement = replaceCanonicalAnglePlaceholders(value);
  if (!replacement) return false;

  let url;
  try {
    url = new URL(replacement.replaced);
  } catch {
    return false;
  }
  if (
    !["http:", "https:", "postgres:", "postgresql:"].includes(
      url.protocol.toLowerCase(),
    ) ||
    url.hash ||
    url.search
  ) {
    return false;
  }
  const safeCredential = (credential) =>
    credential === "" ||
    credential === "test" ||
    credential === "example" ||
    credential === "placeholder";
  if (!safeCredential(url.username) || !safeCredential(url.password)) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "example.com" ||
    hostname === "example.org" ||
    hostname === "example.invalid" ||
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".example.org") ||
    hostname.endsWith(".example.invalid") ||
    (replacement.count > 0 && hostname === "placeholder.supabase.co")
  );
}

function isSafeExamplePlaceholder(rawValue) {
  const value = normalizedExampleValue(rawValue);
  if (value === "") return true;
  if (isCanonicalAnglePlaceholder(value)) return true;
  if (/^\$\{[A-Z][A-Z0-9_]*\}$/.test(value)) return true;
  if (/^x{4,}$/i.test(value)) return true;
  if (isCanonicalBarePlaceholder(value)) return true;
  if (/^(?:example|test|user)@example\.(?:com|org|invalid)$/i.test(value)) {
    return true;
  }
  return isSafeExampleUrl(value);
}

function isSecretLikePath(rel) {
  const lower = rel.toLowerCase();
  return (
    SECRET_FILE_RE.test(rel) ||
    /(?:^|\/)\.docker\/config\.json$/.test(lower) ||
    /(?:^|\/)\.aws\/(?:config|credentials)$/.test(lower) ||
    /(?:^|\/)\.kube\/config$/.test(lower) ||
    /(?:^|\/)\.ssh\/config$/.test(lower)
  );
}

function scanSensitiveLiteralAssignment(rel, line, lineNo) {
  const match = line.match(
    /(?:^|[,{;\s])["']?(password|passwd|client_secret|access_token|refresh_token|secret_key|api_key)["']?\s*[:=]\s*(["'`])([^"'`\r\n]+)\2/i,
  );
  if (!match || isSafeExamplePlaceholder(match[3])) return;
  addFinding(
    rel,
    lineNo,
    FAIL,
    `literal ${match[1]} assignment (possible secret)`,
  );
}

function scanEnvExampleAssignment(rel, line, lineNo) {
  const match = line.match(
    /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/,
  );
  if (!match || !SENSITIVE_ENV_NAME_RE.test(match[1])) return;
  if (!isSafeExamplePlaceholder(match[2])) {
    addFinding(
      rel,
      lineNo,
      FAIL,
      `sensitive environment example ${match[1]} must be empty or use a canonical placeholder`,
    );
  }
}

function isNormalizedManifestPath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.startsWith("./") &&
    !path.includes("\\") &&
    posix.normalize(path) === path &&
    !path.split("/").includes("..")
  );
}

function isManifestAssetExtension(extension) {
  return (
    BINARY_ASSET_EXTENSIONS.has(extension) ||
    MANIFEST_TEXT_ASSET_EXTENSIONS.has(extension)
  );
}

function decodeStrictUtf8(bytes, label) {
  if (bytes.includes(0)) {
    throw fileReadError(label, "text contains NUL bytes");
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw fileReadError(label, "text is not valid UTF-8");
  }
  if (!Buffer.from(text, "utf8").equals(bytes)) {
    throw fileReadError(label, "text is not canonical UTF-8");
  }
  return text;
}

function beginsWith(bytes, expected) {
  return (
    Buffer.isBuffer(bytes) &&
    bytes.byteLength >= expected.byteLength &&
    bytes.subarray(0, expected.byteLength).equals(expected)
  );
}

function endsWith(bytes, expected) {
  return (
    Buffer.isBuffer(bytes) &&
    bytes.byteLength >= expected.byteLength &&
    bytes
      .subarray(bytes.byteLength - expected.byteLength)
      .equals(expected)
  );
}

function hasIsoBaseMediaBrand(prefixBytes, allowedBrands) {
  if (
    !Buffer.isBuffer(prefixBytes) ||
    prefixBytes.byteLength < 12 ||
    prefixBytes.subarray(4, 8).toString("ascii") !== "ftyp"
  ) {
    return false;
  }
  const boxSize = prefixBytes.readUInt32BE(0);
  if (boxSize < 16 || boxSize > prefixBytes.byteLength || boxSize % 4 !== 0) {
    return false;
  }
  for (let offset = 8; offset + 4 <= boxSize; offset += 4) {
    if (allowedBrands.has(prefixBytes.subarray(offset, offset + 4).toString("ascii"))) {
      return true;
    }
  }
  return false;
}

function validateIcoStructure(prefixBytes, sizeBytes) {
  if (
    prefixBytes.byteLength < 6 ||
    !prefixBytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))
  ) {
    return false;
  }
  const count = prefixBytes.readUInt16LE(4);
  const directoryEnd = 6 + count * 16;
  if (count < 1 || directoryEnd > prefixBytes.byteLength) return false;
  let maximumEnd = directoryEnd;
  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    const imageSize = prefixBytes.readUInt32LE(offset + 8);
    const imageOffset = prefixBytes.readUInt32LE(offset + 12);
    if (
      imageSize < 1 ||
      imageOffset < directoryEnd ||
      imageOffset > sizeBytes ||
      imageSize > sizeBytes - imageOffset
    ) {
      return false;
    }
    maximumEnd = Math.max(maximumEnd, imageOffset + imageSize);
  }
  return maximumEnd === sizeBytes;
}

function validateBinaryAssetMagic(extension, openedFile) {
  const prefix = openedFile.prefixBytes ?? openedFile.bytes;
  const suffix = openedFile.suffixBytes ?? openedFile.bytes;
  const size = openedFile.sizeBytes;
  if (!prefix || !suffix) return "binary type sample is unavailable";

  const signatures = {
    "7z": beginsWith(
      prefix,
      Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
    ),
    bmp:
      beginsWith(prefix, Buffer.from("BM", "ascii")) &&
      prefix.byteLength >= 6 &&
      prefix.readUInt32LE(2) === size,
    gif:
      (beginsWith(prefix, Buffer.from("GIF87a", "ascii")) ||
        beginsWith(prefix, Buffer.from("GIF89a", "ascii"))) &&
      endsWith(suffix, Buffer.from([0x3b])),
    gz: beginsWith(prefix, Buffer.from([0x1f, 0x8b, 0x08])),
    ico: validateIcoStructure(prefix, size),
    jpeg:
      beginsWith(prefix, Buffer.from([0xff, 0xd8, 0xff])) &&
      endsWith(suffix, Buffer.from([0xff, 0xd9])),
    jpg:
      beginsWith(prefix, Buffer.from([0xff, 0xd8, 0xff])) &&
      endsWith(suffix, Buffer.from([0xff, 0xd9])),
    mp3:
      beginsWith(prefix, Buffer.from("ID3", "ascii")) ||
      (prefix.byteLength >= 2 &&
        prefix[0] === 0xff &&
        (prefix[1] & 0xe0) === 0xe0),
    ogg: beginsWith(prefix, Buffer.from("OggS", "ascii")),
    otf:
      beginsWith(prefix, Buffer.from("OTTO", "ascii")) &&
      size >= 12,
    pdf:
      beginsWith(prefix, Buffer.from("%PDF-", "ascii")) &&
      suffix.includes(Buffer.from("%%EOF", "ascii")),
    png:
      beginsWith(
        prefix,
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ) &&
      endsWith(
        suffix,
        Buffer.from([
          0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
          0x82,
        ]),
      ),
    tar:
      prefix.byteLength >= 262 &&
      prefix.subarray(257, 262).toString("ascii") === "ustar",
    tif:
      beginsWith(prefix, Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
      beginsWith(prefix, Buffer.from([0x4d, 0x4d, 0x00, 0x2a])),
    tiff:
      beginsWith(prefix, Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
      beginsWith(prefix, Buffer.from([0x4d, 0x4d, 0x00, 0x2a])),
    ttf:
      (beginsWith(prefix, Buffer.from([0x00, 0x01, 0x00, 0x00])) ||
        beginsWith(prefix, Buffer.from("true", "ascii")) ||
        beginsWith(prefix, Buffer.from("typ1", "ascii"))) &&
      size >= 12,
    wasm: beginsWith(prefix, Buffer.from([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0])),
    wav:
      beginsWith(prefix, Buffer.from("RIFF", "ascii")) &&
      prefix.byteLength >= 12 &&
      prefix.subarray(8, 12).toString("ascii") === "WAVE" &&
      prefix.readUInt32LE(4) + 8 === size,
    webm: beginsWith(prefix, Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
    webp:
      beginsWith(prefix, Buffer.from("RIFF", "ascii")) &&
      prefix.byteLength >= 12 &&
      prefix.subarray(8, 12).toString("ascii") === "WEBP" &&
      prefix.readUInt32LE(4) + 8 === size,
    woff:
      beginsWith(prefix, Buffer.from("wOFF", "ascii")) &&
      prefix.byteLength >= 12 &&
      prefix.readUInt32BE(8) === size,
    woff2:
      beginsWith(prefix, Buffer.from("wOF2", "ascii")) &&
      prefix.byteLength >= 12 &&
      prefix.readUInt32BE(8) === size,
    zip:
      beginsWith(prefix, Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
      beginsWith(prefix, Buffer.from([0x50, 0x4b, 0x05, 0x06])),
  };

  const isoBrands = {
    avif: new Set(["avif", "avis"]),
    m4v: new Set(["M4V ", "M4VH", "mp41", "mp42"]),
    mov: new Set(["qt  "]),
    mp4: new Set(["avc1", "dash", "iso2", "isom", "mp41", "mp42"]),
  };
  if (Object.hasOwn(isoBrands, extension)) {
    return hasIsoBaseMediaBrand(prefix, isoBrands[extension])
      ? null
      : `file signature does not match .${extension}`;
  }
  if (["docx", "pptx", "xlsx"].includes(extension)) {
    return signatures.zip ? null : `file signature does not match .${extension}`;
  }
  if (!Object.hasOwn(signatures, extension)) {
    return `recognized binary extension .${extension} has no fail-closed type validator`;
  }
  return signatures[extension]
    ? null
    : `file signature or terminal structure does not match .${extension}`;
}

async function loadAssetManifest() {
  if (profile !== "platform") return;

  let raw;
  try {
    const result = await readStableRegularFile({
      rootDirectory: root,
      filePath: join(root, ASSET_MANIFEST_BASENAME),
      maxBytes: MAX_ASSET_MANIFEST_BYTES,
    });
    loadedAssetManifestState = result.stableState;
    raw = decodeStrictUtf8(result.bytes, ASSET_MANIFEST_BASENAME);
  } catch (error) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      `required asset manifest is missing or unreadable (${error?.code ?? "read error"}); ${error?.message ?? "manual review"}`,
    );
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest is not valid JSON",
    );
    return;
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest must be a JSON object",
    );
    return;
  }
  if (manifest.version !== ASSET_MANIFEST_VERSION) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      `asset manifest version must be ${ASSET_MANIFEST_VERSION}`,
    );
  }
  if (!Array.isArray(manifest.assets)) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest assets must be an array",
    );
    return;
  }

  manifest.assets.forEach((asset, index) => {
    const location = `${ASSET_MANIFEST_BASENAME}#assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      addFinding(location, null, FAIL, "asset entry must be an object");
      return;
    }
    let valid = true;
    if (!isNormalizedManifestPath(asset.path)) {
      addFinding(
        location,
        null,
        FAIL,
        "asset path must be a normalized repo-relative POSIX path",
      );
      valid = false;
    }
    if (
      typeof asset.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    ) {
      addFinding(
        location,
        null,
        FAIL,
        "asset sha256 must be 64 lowercase hexadecimal characters",
      );
      valid = false;
    }
    if (!Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes <= 0) {
      addFinding(
        location,
        null,
        FAIL,
        "asset sizeBytes must be a positive safe integer",
      );
      valid = false;
    }
    for (const field of ASSET_METADATA_FIELDS) {
      if (typeof asset[field] !== "string" || asset[field].trim() === "") {
        addFinding(
          location,
          null,
          FAIL,
          `asset ${field} must be a non-empty string`,
        );
        valid = false;
      }
    }
    if (typeof asset.path === "string") {
      if (manifestPathsDeclared.has(asset.path)) {
        addFinding(location, null, FAIL, `duplicate asset path ${asset.path}`);
        valid = false;
      }
      manifestPathsDeclared.add(asset.path);
    }
    if (
      typeof asset.path === "string" &&
      !isManifestAssetExtension(extname(asset.path).slice(1).toLowerCase())
    ) {
      addFinding(
        location,
        null,
        FAIL,
        "asset path does not use a recognized asset extension",
      );
      valid = false;
    }
    if (valid) assetManifestEntries.set(asset.path, asset);
  });
}

function isPublicUrlPathTokenSpan(line, start, end) {
  const matcher = /https?:\/\/[^\s"'<>]+/g;
  for (const match of line.matchAll(matcher)) {
    const rawUrl = match[0];
    const urlStart = match.index;
    const urlEnd = urlStart + rawUrl.length;
    if (start < urlStart || end > urlEnd) continue;
    try {
      new URL(rawUrl);
    } catch {
      continue;
    }
    const publicLocationStart = rawUrl.indexOf("://") + 3;
    const queryStart = rawUrl.search(/[?#]/);
    const publicPathEnd = queryStart === -1 ? rawUrl.length : queryStart;
    const relativeStart = start - urlStart;
    const relativeEnd = end - urlStart;
    if (
      publicLocationStart >= 3 &&
      relativeStart >= publicLocationStart &&
      relativeEnd <= publicPathEnd
    ) {
      return true;
    }
  }
  return false;
}

function isPublicBase64Token(line, basename, match) {
  const token = match[0];
  const start = match.index;
  const end = start + token.length;
  const before = line.slice(0, start);
  if (before.endsWith(";base64,")) return true;
  if (
    /^sha(?:256|384|512)-[A-Za-z0-9+/_-]{20,}={0,2}$/i.test(token)
  ) {
    return true;
  }
  if (
    LOCKFILE_BASENAMES.has(basename) &&
    /(?:^|[,{]\s*)["']?integrity["']?\s*[:=]\s*["']?$/i.test(before)
  ) {
    return true;
  }
  return isPublicUrlPathTokenSpan(line, start, end);
}

function concatenatedLiteralValues(line) {
  const literals = [
    ...line.matchAll(/(["'`])([A-Za-z0-9+/_=-]{1,512})\1/g),
  ];
  const joined = [];
  let current = null;
  for (const literal of literals) {
    const start = literal.index;
    const end = start + literal[0].length;
    if (
      current &&
      /^\s*\+\s*$/.test(line.slice(current.end, start))
    ) {
      current.value += literal[2];
      current.end = end;
      current.count += 1;
      continue;
    }
    if (current?.count > 1) joined.push(current.value);
    current = { count: 1, end, value: literal[2] };
  }
  if (current?.count > 1) joined.push(current.value);
  return joined;
}

function scanConcatenatedLiteralSecrets(rel, line, lineNo) {
  for (const value of concatenatedLiteralValues(line)) {
    for (const rule of SECRET_VALUE_RULES) {
      if (rule.kind === "assignment-name") continue;
      if (rule.re.test(value)) {
        addFinding(rel, lineNo, FAIL, `${rule.label} assembled across literals`);
      }
    }
    const runs = value.match(GENERIC_BASE64_RE) ?? [];
    if (runs.some((token) => hasBase64SecretShape(token))) {
      addFinding(
        rel,
        lineNo,
        FAIL,
        "high-entropy base64 run assembled across literals (possible secret)",
      );
    }
  }
}

function scanText(rel, basename, text) {
  const envExample = isEnvExample(rel);
  const privatePolicyDeclaration = basename === ".gitignore";
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;
    for (const rule of SECRET_VALUE_RULES) {
      if (envExample && rule.kind === "assignment-name") continue;
      if (rule.re.test(line)) addFinding(rel, lineNo, FAIL, rule.label);
    }
    scanSensitiveLiteralAssignment(rel, line, lineNo);
    scanConcatenatedLiteralSecrets(rel, line, lineNo);
    for (const rule of PRIVATE_CONTENT_RULES) {
      if (privatePolicyDeclaration) continue;
      const matches = rule.matches ? rule.matches(line) : rule.re.test(line);
      if (matches) addFinding(rel, lineNo, FAIL, rule.label);
    }
    const base64Matches = [...line.matchAll(GENERIC_BASE64_RE)];
    if (
      base64Matches.some(
        (match) =>
          hasBase64SecretShape(match[0]) &&
          !isPublicBase64Token(line, basename, match),
      )
    ) {
      addFinding(
        rel,
        lineNo,
        FAIL,
        "high-entropy base64 run (possible secret)",
      );
    }
    if (profile !== "platform") {
      for (const rule of PRICING_RULES) {
        if (rule.re.test(line)) addFinding(rel, lineNo, WARN, rule.label);
      }
    }
    if (profile === "platform" && envExample) {
      scanEnvExampleAssignment(rel, line, lineNo);
    }
  }
}

async function collectVisibleInventory(
  dir,
  { candidateOnly = false, inventory = new Set() } = {},
) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = toPosixPath(relative(root, full));
    const exactGitCandidate = gitCandidatePaths?.has(rel) ?? false;
    const containsGitCandidate = gitCandidateDirectories?.has(rel) ?? false;
    if (
      candidateOnly &&
      ((entry.isDirectory() && !containsGitCandidate) ||
        (!entry.isDirectory() && !exactGitCandidate))
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      if (entry.name === ".auth") {
        const isPublicationCandidate =
          gitCandidatePaths === null || containsGitCandidate;
        if (!isPublicationCandidate) continue;
        inventory.add(`d:${rel}`);
        if (gitCandidatePaths !== null) {
          await collectVisibleInventory(full, {
            candidateOnly: true,
            inventory,
          });
        }
        continue;
      }
      if (GENERATED_DIRS.has(entry.name)) {
        if (profile !== "platform") continue;
        const isPublicationCandidate =
          gitCandidatePaths === null || containsGitCandidate;
        if (!isPublicationCandidate) continue;
        inventory.add(`d:${rel}`);
        if (gitCandidatePaths !== null) {
          await collectVisibleInventory(full, {
            candidateOnly: true,
            inventory,
          });
        }
        continue;
      }
      inventory.add(`d:${rel}`);
      if (!isPrivateExportPath(rel, profile)) {
        await collectVisibleInventory(full, { candidateOnly, inventory });
      }
      continue;
    }

    inventory.add(
      `${entry.isFile() ? "f" : entry.isSymbolicLink() ? "l" : "o"}:${rel}`,
    );
  }
  return inventory;
}

function serializeInventory(inventory) {
  return [...inventory].sort().join("\0");
}

async function revalidateFileState(rel, stableState) {
  const absolutePath = resolve(root, rel);
  await assertOpenedPathIdentity({
    canonicalRoot: root,
    absolutePath,
    openedInfo: stableState,
    label: rel,
  });
  const current = await lstat(absolutePath, { bigint: true });
  if (!sameStableFileState(stableState, current)) {
    throw fileReadError(rel, "changed after it was scanned");
  }
}

async function walk(dir, { candidateOnly = false } = {}) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    addFinding(
      toPosixPath(relative(root, dir)) || ".",
      null,
      profile === "platform" ? FAIL : WARN,
      `unreadable directory (${error?.code ?? "read error"}); manual review`,
    );
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    // A normal checkout exposes .git as a directory; a linked worktree exposes
    // it as a pointer file. Both are VCS metadata and outside the public tree.
    if (entry.name === ".git") continue;
    const full = join(dir, entry.name);
    const rel = toPosixPath(relative(root, full));
    const exactGitCandidate = gitCandidatePaths?.has(rel) ?? false;
    const containsGitCandidate = gitCandidateDirectories?.has(rel) ?? false;
    if (
      candidateOnly &&
      ((entry.isDirectory() && !containsGitCandidate) ||
        (!entry.isDirectory() && !exactGitCandidate))
    ) {
      continue;
    }
    if (entry.isSymbolicLink()) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "symbolic link requires explicit review and materialization",
      );
      continue;
    }
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      if (entry.name === ".auth") {
        const isPublicationCandidate =
          gitCandidatePaths === null || containsGitCandidate;
        if (!isPublicationCandidate) continue;
        addFinding(
          rel,
          null,
          FAIL,
          "authenticated storage directory is a forbidden publication candidate",
        );
        if (gitCandidatePaths !== null) {
          await walk(full, { candidateOnly: true });
        }
        continue;
      }
      if (GENERATED_DIRS.has(entry.name)) {
        if (profile !== "platform") continue;
        const isPublicationCandidate =
          gitCandidatePaths === null || containsGitCandidate;
        if (!isPublicationCandidate) continue;
        addFinding(
          rel,
          null,
          FAIL,
          "generated directory is a forbidden publication candidate",
        );
        if (gitCandidatePaths !== null) {
          await walk(full, { candidateOnly: true });
        }
        continue;
      }
      if (isPrivateExportPath(rel, profile)) {
        addFinding(
          rel,
          null,
          FAIL,
          `private path (${matchedPrivateRules(rel, profile).join(", ")})`,
        );
        continue;
      }
      await walk(full, { candidateOnly });
      continue;
    }
    if (!entry.isFile()) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "unsupported filesystem entry requires explicit review",
      );
      continue;
    }
    filesChecked += 1;
    if (isPrivateExportPath(rel, profile)) {
      addFinding(
        rel,
        null,
        FAIL,
        `private path (${matchedPrivateRules(rel, profile).join(", ")})`,
      );
      continue;
    }
    if (isSecretLikePath(rel) && !isEnvExample(rel)) {
      addFinding(rel, null, FAIL, "secret-like filename");
      continue;
    }
    const basename = entry.name.toLowerCase();
    const ext = extname(entry.name).slice(1).toLowerCase();
    const binaryAsset = BINARY_ASSET_EXTENSIONS.has(ext);
    const inspectableZip = profile === "platform" && ext === "zip";
    const opaquePlatformArchive =
      profile === "platform" &&
      FAIL_CLOSED_PLATFORM_ARCHIVE_EXTENSIONS.has(ext);
    const opaquePlatformContainer =
      profile === "platform" &&
      FAIL_CLOSED_PLATFORM_CONTAINER_EXTENSIONS.has(ext);
    const manifestEntry =
      profile === "platform" ? assetManifestEntries.get(rel) : null;
    let openedFile;
    try {
      openedFile = await readStableRegularFile({
        rootDirectory: root,
        filePath: full,
        readContents: !binaryAsset || inspectableZip,
        hashContents: binaryAsset && Boolean(manifestEntry),
        sampleContents: profile === "platform" && binaryAsset,
        maxBytes: inspectableZip
          ? MAX_ZIP_ARCHIVE_BYTES
          : binaryAsset
            ? MAX_SCANNED_FILE_BYTES
            : MAX_BUFFERED_FILE_BYTES,
      });
    } catch (error) {
      addFinding(
        rel,
        null,
        error?.code === "EFBIG" || profile === "platform" ? FAIL : WARN,
        `file cannot be verified (${error?.code ?? "read error"}); ${error?.message ?? "manual review"}`,
      );
      continue;
    }
    scannedFileStates.set(rel, openedFile.stableState);
    const isLarge = openedFile.sizeBytes > LARGE_FILE_BYTES;

    if (binaryAsset) {
      const magicFailure =
        profile === "platform"
          ? validateBinaryAssetMagic(ext, openedFile)
          : null;
      if (profile === "platform") {
        assetPathsSeen.add(rel);
        if (magicFailure) {
          addFinding(rel, null, FAIL, magicFailure);
        }
        if (!manifestEntry) {
          addFinding(
            rel,
            null,
            FAIL,
            "recognized binary is missing from ASSET_MANIFEST.json",
          );
        } else {
          if (openedFile.sizeBytes !== manifestEntry.sizeBytes) {
            addFinding(
              rel,
              null,
              FAIL,
              "binary byte size does not match ASSET_MANIFEST.json",
            );
          }
          if (!openedFile.sha256) {
            addFinding(
              rel,
              null,
              FAIL,
              "binary contents were not hashed; manifest cannot be verified",
            );
          } else if (openedFile.sha256 !== manifestEntry.sha256) {
            addFinding(
              rel,
              null,
              FAIL,
              "binary sha256 does not match ASSET_MANIFEST.json",
            );
          }
        }
      }
      if (opaquePlatformArchive) {
        addFinding(
          rel,
          null,
          FAIL,
          `${ext.toUpperCase()} archives are opaque and forbidden in the platform profile`,
        );
      } else if (opaquePlatformContainer) {
        addFinding(
          rel,
          null,
          FAIL,
          `${ext.toUpperCase()} is an opaque or active container and is forbidden without a format-specific publication validator`,
        );
      } else if (inspectableZip && !magicFailure) {
        if (!openedFile.bytes) {
          addFinding(
            rel,
            null,
            FAIL,
            "ZIP contents were not read; archive cannot be inspected",
          );
        } else {
          try {
            const zipEntries = inspectZipArchive(openedFile.bytes, {
              label: rel,
            });
            for (const zipEntry of zipEntries) {
              if (zipEntry.kind !== "file" || zipEntry.text === null) continue;
              scanText(
                `${rel}!/${zipEntry.path}`,
                posix.basename(zipEntry.path).toLowerCase(),
                zipEntry.text,
              );
            }
          } catch (error) {
            addFinding(
              rel,
              null,
              FAIL,
              `ZIP archive failed closed inspection (${error?.code ?? "archive error"}); ${error?.message ?? "invalid archive"}`,
            );
          }
        }
      }
      // Non-archive binary assets are never decoded as text. Oversized ones
      // remain visible after their platform-manifest hash is verified.
      if (isLarge) {
        addFinding(
          rel,
          null,
          ASSET,
          `large binary asset, ${openedFile.sizeBytes} bytes`,
        );
      }
      continue;
    }

    const buffer = openedFile.bytes;
    if (!buffer) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "file contents were not read; manual review",
      );
      continue;
    }
    if (manifestEntry) {
      assetPathsSeen.add(rel);
      if (openedFile.sizeBytes !== manifestEntry.sizeBytes) {
        addFinding(
          rel,
          null,
          FAIL,
          "asset byte size does not match ASSET_MANIFEST.json",
        );
      }
      const actualSha256 = createHash("sha256").update(buffer).digest("hex");
      if (actualSha256 !== manifestEntry.sha256) {
        addFinding(
          rel,
          null,
          FAIL,
          "asset sha256 does not match ASSET_MANIFEST.json",
        );
      }
    }
    let text;
    if (profile === "platform") {
      try {
        text = decodeStrictUtf8(buffer, rel);
      } catch (error) {
        addFinding(
          rel,
          null,
          FAIL,
          `file is neither strict text nor a recognized binary asset (${error?.message ?? "text validation failed"})`,
        );
        continue;
      }
    } else if (
      buffer.subarray(0, 8192).includes(0) &&
      !KNOWN_TEXT_EXTENSIONS.has(ext)
    ) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "binary file is not a recognized asset type; manual review",
      );
      continue;
    } else {
      text = buffer.toString("utf8");
    }
    if (isLarge) {
      addFinding(
        rel,
        null,
        WARN,
        `large file, ${openedFile.sizeBytes} bytes; manual review required`,
      );
    }
    scanText(rel, basename, text);
  }
}

function format(finding) {
  const location = finding.line
    ? `${finding.path}:${finding.line}`
    : finding.path;
  return `- ${location}  [${finding.label}]`;
}

async function main() {
  let canonicalRoot;
  let rootHandle;
  let rootInfo;
  let initialVisibleInventory = null;
  try {
    canonicalRoot = await realpath(resolve(root));
    rootHandle = await open(
      canonicalRoot,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_DIRECTORY,
    );
    rootInfo = await rootHandle.stat({ bigint: true });
    if (!rootInfo.isDirectory()) throw new Error("not a directory");
  } catch {
    await rootHandle?.close().catch(() => {});
    console.error(`scan-export: not a directory: ${root}`);
    process.exit(2);
  }
  root = canonicalRoot;

  if (profile === "platform") {
    try {
      const snapshot = await readGitCandidateSnapshot(root);
      if (snapshot) {
        gitCandidatePaths = snapshot.paths;
        gitCandidateDirectories = snapshot.directories;
        initialGitCandidateSnapshot = snapshot.serialized;
      }
    } catch (error) {
      addFinding(
        ".",
        null,
        FAIL,
        `Git publication candidate inventory is unavailable (${error?.message ?? "inventory error"})`,
      );
    }
    try {
      initialVisibleInventory = serializeInventory(
        await collectVisibleInventory(root),
      );
    } catch (error) {
      addFinding(
        ".",
        null,
        FAIL,
        `scanner-visible inventory is unavailable (${error?.code ?? "inventory error"})`,
      );
    }
  }

  await loadAssetManifest();
  await walk(root);

  if (profile === "platform") {
    if (initialGitCandidateSnapshot !== null) {
      try {
        const finalSnapshot = await readGitCandidateSnapshot(root);
        if (
          !finalSnapshot ||
          finalSnapshot.serialized !== initialGitCandidateSnapshot
        ) {
          addFinding(
            ".",
            null,
            FAIL,
            "Git publication candidate inventory changed during the scan",
          );
        }
      } catch (error) {
        addFinding(
          ".",
          null,
          FAIL,
          `Git publication candidate inventory could not be revalidated (${error?.message ?? "inventory error"})`,
        );
      }
    }
    if (initialVisibleInventory !== null) {
      try {
        const finalVisibleInventory = serializeInventory(
          await collectVisibleInventory(root),
        );
        if (finalVisibleInventory !== initialVisibleInventory) {
          addFinding(
            ".",
            null,
            FAIL,
            "scanner-visible filesystem inventory changed during the scan",
          );
        }
      } catch (error) {
        addFinding(
          ".",
          null,
          FAIL,
          `scanner-visible inventory could not be revalidated (${error?.code ?? "inventory error"})`,
        );
      }
    }
    if (loadedAssetManifestState) {
      try {
        await revalidateFileState(
          ASSET_MANIFEST_BASENAME,
          loadedAssetManifestState,
        );
      } catch (error) {
        addFinding(
          ASSET_MANIFEST_BASENAME,
          null,
          FAIL,
          `asset manifest changed after it was loaded (${error?.message ?? "identity error"})`,
        );
      }
    }
    for (const [path, stableState] of scannedFileStates) {
      try {
        await revalidateFileState(path, stableState);
      } catch (error) {
        addFinding(
          path,
          null,
          FAIL,
          `file changed after its scan window (${error?.message ?? "identity error"})`,
        );
      }
    }
    for (const path of assetManifestEntries.keys()) {
      if (!assetPathsSeen.has(path)) {
        addFinding(
          path,
          null,
          FAIL,
          "stale ASSET_MANIFEST.json entry has no matching asset file",
        );
      }
    }
  }

  try {
    const [afterHandleInfo, afterPathInfo, afterRealpath] = await Promise.all([
      rootHandle.stat({ bigint: true }),
      lstat(root, { bigint: true }),
      realpath(root),
    ]);
    if (
      !afterHandleInfo.isDirectory() ||
      !afterPathInfo.isDirectory() ||
      afterPathInfo.isSymbolicLink() ||
      !sameFileIdentity(rootInfo, afterHandleInfo) ||
      !sameFileIdentity(rootInfo, afterPathInfo) ||
      afterRealpath !== root
    ) {
      addFinding(
        ".",
        null,
        profile === "platform" ? FAIL : WARN,
        "scan root changed identity while it was being scanned",
      );
    }
  } catch (error) {
    addFinding(
      ".",
      null,
      profile === "platform" ? FAIL : WARN,
      `scan root could not be revalidated (${error?.code ?? "identity error"})`,
    );
  } finally {
    await rootHandle.close();
  }

  const fails = findings.filter((f) => f.severity === FAIL);
  const warns = findings.filter((f) => f.severity === WARN);
  const assets = findings.filter((f) => f.severity === ASSET);

  if (findings.length === 0) {
    console.log(
      `scan-export (${mode}, ${profile}) passed: ${filesChecked} files checked, no findings`,
    );
    process.exit(0);
  }

  const emit = fails.length > 0 ? console.error : console.warn;

  if (fails.length > 0) {
    console.error(
      `scan-export (${mode}, ${profile}) FAILED: ${fails.length} blocking finding(s) over ${filesChecked} files`,
    );
    for (const finding of fails) console.error(format(finding));
  }
  if (warns.length > 0) {
    emit(
      `scan-export (${mode}, ${profile}) WARN: ${warns.length} finding(s) need manual sign-off`,
    );
    for (const finding of warns) emit(format(finding));
  }
  if (assets.length > 0) {
    emit(
      `scan-export (${mode}, ${profile}) ASSET: ${assets.length} large binary asset(s)`,
    );
    for (const finding of assets) emit(format(finding));
  }

  if (fails.length > 0) process.exit(1);

  console.log(
    `scan-export (${mode}, ${profile}) passed with no blocking findings: ${filesChecked} files checked, ${warns.length} warning(s), ${assets.length} asset note(s)`,
  );
  process.exit(0);
}

if (isDirectRun) await main();
