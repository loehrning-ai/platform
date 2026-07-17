#!/usr/bin/env node

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const METADATA_FLAGS = ["owner", "source", "license", "redistribution"];

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

const FORBIDDEN_SECRET_SUFFIXES = [
  ".jks",
  ".key",
  ".keystore",
  ".p12",
  ".pfx",
];

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
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail("file path contains an unsafe segment");
  }
  if (path.posix.normalize(filePath) !== filePath) {
    fail("file path must be a normalized POSIX path");
  }

  const lowerSegments = segments.map((segment) => segment.toLowerCase());
  const fileName = lowerSegments.at(-1);
  if (lowerSegments.some((segment) => FORBIDDEN_DIRECTORIES.has(segment))) {
    fail("generated, cache, test-output, provider-state, and VCS paths are not assets");
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

async function assertNoSymlinkComponents(root, relativePath) {
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      fail(`file does not exist or cannot be inspected (${error.code ?? "read error"})`);
    }
    if (info.isSymbolicLink()) {
      fail("file path must not contain a symbolic link");
    }
  }
}

async function hashOpenFile(fileHandle) {
  const hash = createHash("sha256");
  const stream = fileHandle.createReadStream({ autoClose: false });
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}

export function parseAssetArguments(argumentsList) {
  const args = argumentsList[0] === "--" ? argumentsList.slice(1) : [...argumentsList];
  const metadata = Object.create(null);
  let file = null;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token.startsWith("--")) {
      const flag = token.slice(2);
      if (!METADATA_FLAGS.includes(flag)) fail(`unknown option --${flag}`);
      if (Object.hasOwn(metadata, flag)) fail(`--${flag} may be provided only once`);
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
}) {
  assertSafeRelativePath(file);
  for (const [flag, value] of Object.entries({ owner, source, license, redistribution })) {
    assertMetadataValue(flag, value);
  }

  const root = await realpath(repositoryRoot).catch((error) => {
    fail(`repository root cannot be resolved (${error.code ?? "read error"})`);
  });
  const candidate = path.resolve(root, file);
  if (candidate === root || !candidate.startsWith(`${root}${path.sep}`)) {
    fail("file path escapes the repository");
  }

  await assertNoSymlinkComponents(root, file);
  const resolvedCandidate = await realpath(candidate).catch((error) => {
    fail(`file cannot be resolved (${error.code ?? "read error"})`);
  });
  if (!resolvedCandidate.startsWith(`${root}${path.sep}`)) {
    fail("resolved file path escapes the repository");
  }

  let fileHandle;
  try {
    fileHandle = await open(candidate, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    fail(`file cannot be opened safely (${error.code ?? "read error"})`);
  }

  try {
    const before = await fileHandle.stat();
    if (!before.isFile()) fail("path must identify an existing regular file");

    const sha256 = await hashOpenFile(fileHandle);
    const after = await fileHandle.stat();
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
      fail("file changed while its record was being computed");
    }

    return {
      path: file,
      sha256,
      sizeBytes: after.size,
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

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
