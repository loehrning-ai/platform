#!/usr/bin/env node

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const METADATA_FLAGS = ["owner", "source", "license", "redistribution"];
const MAX_ASSET_SIZE_BYTES = 100 * 1024 * 1024;
const READ_CHUNK_SIZE_BYTES = 64 * 1024;
// O_RDONLY never creates a file, so this mode is unused by the kernel. Keeping
// an explicit owner-only mode also prevents creation if the flags are ever
// changed incorrectly and lets static analysis distinguish this read from an
// insecure temporary-file creation.
const SECURE_UNUSED_CREATE_MODE = 0o600;

const FORBIDDEN_DIRECTORIES = new Set([
  ".auth",
  ".bun-cache",
  ".cache",
  ".git",
  ".lighthouseci",
  ".next",
  ".output",
  ".swc",
  ".turbo",
  ".vercel",
  "blob-report",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

const FORBIDDEN_FILENAMES = new Set([
  ".dev-ports.json",
  ".ds_store",
  ".netrc",
  ".npmrc",
  "credentials.json",
  "id_ed25519",
  "id_rsa",
  "service-account.json",
]);

const FORBIDDEN_SECRET_SUFFIXES = [".jks", ".key", ".keystore", ".p12", ".pfx"];

function fail(message) {
  throw new Error(`Asset record rejected: ${message}`);
}

function assertMetadataValue(flag, value) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`--${flag} must have an explicit non-empty value`);
  }
  if (value !== value.trim()) {
    fail(`--${flag} must not contain surrounding whitespace`);
  }
  if (/\p{Cc}/u.test(value)) {
    fail(`--${flag} must not contain control characters`);
  }
}

function assertSafeRelativePath(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    fail("file path must be a non-empty repository-relative path");
  }
  if (filePath !== filePath.trim()) {
    fail("file path must not contain surrounding whitespace");
  }
  if (path.isAbsolute(filePath) || path.posix.isAbsolute(filePath)) {
    fail("file path must be repository-relative");
  }
  if (filePath.includes("\\")) {
    fail("file path must use forward slashes");
  }

  const segments = filePath.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    fail("file path contains an unsafe segment");
  }
  if (path.posix.normalize(filePath) !== filePath) {
    fail("file path must be a normalized POSIX path");
  }

  const lowerSegments = segments.map((segment) => segment.toLowerCase());
  const fileName = lowerSegments.at(-1);
  if (lowerSegments.some((segment) => FORBIDDEN_DIRECTORIES.has(segment))) {
    fail(
      "generated, cache, test-output, provider-state, and VCS paths are not assets",
    );
  }
  if (lowerSegments.includes("supabase") && lowerSegments.includes(".temp")) {
    fail("provider temporary state is not an asset");
  }
  if (
    FORBIDDEN_FILENAMES.has(fileName) ||
    fileName === ".env" ||
    fileName.startsWith(".env.") ||
    fileName.endsWith(".tsbuildinfo") ||
    fileName.endsWith(".log") ||
    FORBIDDEN_SECRET_SUFFIXES.some((suffix) => fileName.endsWith(suffix))
  ) {
    fail("secret-bearing, generated, or local-state files are not assets");
  }
}

function isContainedPath(root, candidatePath) {
  const relativePath = path.relative(root, candidatePath);
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
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

function samePathComponentIdentity(left, right) {
  return (
    sameFileIdentity(left.info, right.info) &&
    left.info.mode === right.info.mode &&
    left.absolutePath === right.absolutePath
  );
}

async function capturePathState({ root, absolutePath, openedInfo = null }) {
  const relativePath = path.relative(root, absolutePath);
  if (relativePath === "" || !isContainedPath(root, absolutePath)) {
    fail("file path escapes the repository");
  }

  const pathState = [];
  const rootInfo = await lstat(root, { bigint: true }).catch((error) => {
    fail(
      `repository root changed while the file was being inspected (${error.code ?? "read error"})`,
    );
  });
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    fail("repository root must remain a non-symlink directory");
  }
  pathState.push({ absolutePath: root, info: rootInfo });

  const components = relativePath.split(path.sep);
  let currentPath = root;
  let finalPathInfo = null;
  for (let index = 0; index < components.length; index += 1) {
    currentPath = path.join(currentPath, components[index]);
    const componentInfo = await lstat(currentPath, { bigint: true }).catch(
      (error) => {
        fail(
          `file path changed while its record was being computed (${error.code ?? "read error"})`,
        );
      },
    );
    const isFinalComponent = index === components.length - 1;
    if (componentInfo.isSymbolicLink()) {
      fail("file path must not contain a symbolic link");
    }
    if (
      (!isFinalComponent && !componentInfo.isDirectory()) ||
      (isFinalComponent && !componentInfo.isFile())
    ) {
      if (isFinalComponent) {
        fail("path must identify an existing regular file");
      }
      fail("file path changed while its record was being computed");
    }
    pathState.push({ absolutePath: currentPath, info: componentInfo });
    if (isFinalComponent) finalPathInfo = componentInfo;
  }

  if (
    !finalPathInfo ||
    (openedInfo && !sameFileIdentity(openedInfo, finalPathInfo))
  ) {
    fail("file pathname no longer identifies the opened file");
  }

  const resolvedPath = await realpath(absolutePath).catch((error) => {
    fail(
      `file path changed while its record was being computed (${error.code ?? "read error"})`,
    );
  });
  if (!isContainedPath(root, resolvedPath)) {
    fail("resolved file path escapes the repository");
  }

  const confirmedInfo = await lstat(absolutePath, { bigint: true }).catch(
    (error) => {
      fail(
        `file path changed while its record was being computed (${error.code ?? "read error"})`,
      );
    },
  );
  if (
    confirmedInfo.isSymbolicLink() ||
    !confirmedInfo.isFile() ||
    !sameFileIdentity(openedInfo ?? finalPathInfo, confirmedInfo)
  ) {
    fail("file pathname changed identity while its record was being computed");
  }

  return pathState;
}

function assertPathStateUnchanged(before, after) {
  if (
    before.length !== after.length ||
    before.some(
      (component, index) => !samePathComponentIdentity(component, after[index]),
    )
  ) {
    fail(
      "file path components changed identity while its record was being computed",
    );
  }
}

async function hashOpenFile(fileHandle) {
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(READ_CHUNK_SIZE_BYTES);
  let bytesReadTotal = 0;

  while (bytesReadTotal <= MAX_ASSET_SIZE_BYTES) {
    const remainingWithSentinel = MAX_ASSET_SIZE_BYTES - bytesReadTotal + 1;
    const length = Math.min(buffer.byteLength, remainingWithSentinel);
    const { bytesRead } = await fileHandle.read(buffer, 0, length, null);
    if (bytesRead === 0) break;
    bytesReadTotal += bytesRead;
    if (bytesReadTotal > MAX_ASSET_SIZE_BYTES) {
      fail(`file exceeds the ${String(MAX_ASSET_SIZE_BYTES)} byte size limit`);
    }
    hash.update(buffer.subarray(0, bytesRead));
  }

  return { sha256: hash.digest("hex"), sizeBytes: bytesReadTotal };
}

export function parseAssetArguments(argumentsList) {
  const args =
    argumentsList[0] === "--" ? argumentsList.slice(1) : [...argumentsList];
  const metadata = Object.create(null);
  let file = null;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token.startsWith("--")) {
      const flag = token.slice(2);
      if (!METADATA_FLAGS.includes(flag)) fail(`unknown option --${flag}`);
      if (Object.hasOwn(metadata, flag))
        fail(`--${flag} may be provided only once`);
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        fail(`--${flag} requires a value`);
      }
      assertMetadataValue(flag, value);
      metadata[flag] = value;
      index += 1;
      continue;
    }

    if (file !== null) fail("exactly one file path is required");
    file = token;
  }

  if (file === null) fail("exactly one file path is required");
  assertSafeRelativePath(file);
  for (const flag of METADATA_FLAGS) {
    if (!Object.hasOwn(metadata, flag)) fail(`--${flag} is required`);
  }

  return { file, ...metadata };
}

export async function createAssetRecord({
  repositoryRoot = REPOSITORY_ROOT,
  file,
  owner,
  source,
  license,
  redistribution,
  hooks,
}) {
  assertSafeRelativePath(file);
  for (const [flag, value] of Object.entries({
    owner,
    source,
    license,
    redistribution,
  })) {
    assertMetadataValue(flag, value);
  }

  const root = await realpath(path.resolve(repositoryRoot)).catch((error) => {
    fail(`repository root cannot be resolved (${error.code ?? "read error"})`);
  });
  const candidate = path.resolve(root, file);
  if (candidate === root || !isContainedPath(root, candidate)) {
    fail("file path escapes the repository");
  }

  if (typeof constants.O_NOFOLLOW !== "number") {
    fail("runtime does not support no-follow file opens");
  }

  const expectedPathState = await capturePathState({
    root,
    absolutePath: candidate,
  });

  let fileHandle;
  try {
    fileHandle = await open(
      candidate,
      constants.O_RDONLY | constants.O_NOFOLLOW,
      SECURE_UNUSED_CREATE_MODE,
    );
  } catch (error) {
    if (error.code === "ELOOP") {
      fail("file path must not contain a symbolic link");
    }
    fail(`file cannot be opened safely (${error.code ?? "read error"})`);
  }

  try {
    const before = await fileHandle.stat({ bigint: true });
    if (!before.isFile()) fail("path must identify an existing regular file");
    if (before.size > BigInt(MAX_ASSET_SIZE_BYTES)) {
      fail(`file exceeds the ${String(MAX_ASSET_SIZE_BYTES)} byte size limit`);
    }

    await hooks?.afterOpen?.({ absolutePath: candidate });
    const initialPathState = await capturePathState({
      root,
      absolutePath: candidate,
      openedInfo: before,
    });
    assertPathStateUnchanged(expectedPathState, initialPathState);

    const { sha256, sizeBytes } = await hashOpenFile(fileHandle);
    await hooks?.afterRead?.({ absolutePath: candidate });

    const after = await fileHandle.stat({ bigint: true });
    if (
      !sameStableFileState(before, after) ||
      BigInt(sizeBytes) !== before.size
    ) {
      fail("file changed while its record was being computed");
    }
    const finalPathState = await capturePathState({
      root,
      absolutePath: candidate,
      openedInfo: after,
    });
    assertPathStateUnchanged(initialPathState, finalPathState);

    return {
      path: file,
      sha256,
      sizeBytes,
      owner,
      source,
      license,
      redistribution,
    };
  } finally {
    await fileHandle.close();
  }
}

async function main() {
  const values = parseAssetArguments(process.argv.slice(2));
  const record = await createAssetRecord(values);
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
