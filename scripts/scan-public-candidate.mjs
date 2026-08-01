#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readSync,
  realpathSync,
  rmSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_ROOT = realpathSync(
  fileURLToPath(new URL("../", import.meta.url)),
);
const SCANNER = path.join(
  SCRIPT_ROOT,
  "packages/website/scripts/open-source/scan-export.mjs",
);
const MAX_GIT_OUTPUT_BYTES = 64 * 1024 * 1024;
const MAX_CANDIDATE_FILE_BYTES = 100 * 1024 * 1024;
const MAX_CANDIDATE_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const COPY_CHUNK_BYTES = 256 * 1024;
const WINDOWS_RESERVED_BASENAME_RE =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const INVISIBLE_OR_DIRECTIONAL_FORMAT_RE =
  /[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u;

function fail(message) {
  throw new Error(`scan-public-candidate: ${message}`);
}

function parseArguments(argv) {
  if (argv.length === 0) return SCRIPT_ROOT;
  if (argv.length === 2 && argv[0] === "--root") {
    return realpathSync(path.resolve(argv[1]));
  }
  fail("usage: node scripts/scan-public-candidate.mjs [--root <git-root>]");
}

function runGit(root, arguments_) {
  const result = spawnSync("git", ["-C", root, ...arguments_], {
    encoding: null,
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    timeout: 15_000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    fail(
      `Git inventory failed (${result.error?.code ?? `exit ${result.status}`}).`,
    );
  }
  return result.stdout;
}

function decodeUtf8(buffer, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    fail(`${label} is not valid UTF-8.`);
  }
}

export function parseCandidatePaths(output) {
  const bytes =
    output.byteLength > 0 && output[output.byteLength - 1] === 0
      ? output.subarray(0, output.byteLength - 1)
      : output;
  if (bytes.byteLength === 0) return [];
  const decoded = decodeUtf8(bytes, "Git candidate inventory");
  const candidates = decoded.split("\0");
  const unique = new Set();
  const portable = new Set();
  for (const candidate of candidates) {
    const segments = candidate.split("/");
    if (
      candidate.length === 0 ||
      candidate.length > 1_024 ||
      candidate.normalize("NFC") !== candidate ||
      candidate.startsWith("/") ||
      candidate.startsWith("./") ||
      candidate.includes("\\") ||
      path.posix.normalize(candidate) !== candidate ||
      segments.length > 64 ||
      segments.some(
        (segment) =>
          segment.length === 0 ||
          segment.length > 255 ||
          segment === "." ||
          segment === ".." ||
          segment.trim() !== segment ||
          segment.endsWith(".") ||
          /[\u0000-\u001f\u007f<>:"|?*]/u.test(segment) ||
          INVISIBLE_OR_DIRECTIONAL_FORMAT_RE.test(segment) ||
          WINDOWS_RESERVED_BASENAME_RE.test(segment),
      ) ||
      unique.has(candidate)
    ) {
      fail("Git candidate inventory contains an unsafe or duplicate path.");
    }
    const portablePath = candidate.toLocaleLowerCase("en-US");
    if (portable.has(portablePath)) {
      fail(
        "Git candidate inventory contains paths that collide on a portable filesystem.",
      );
    }
    portable.add(portablePath);
    unique.add(candidate);
  }
  return [...unique].sort();
}

function readCandidateInventory(root) {
  const topLevel = decodeUtf8(
    runGit(root, ["rev-parse", "--show-toplevel"]),
    "Git top-level path",
  ).trim();
  if (realpathSync(topLevel) !== root) {
    fail("--root must be the exact Git worktree root.");
  }
  const output = runGit(root, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--deduplicate",
    "-z",
    "--",
    ".",
  ]);
  const deleted = new Set(
    parseCandidatePaths(
      runGit(root, ["ls-files", "--deleted", "-z", "--", "."]),
    ),
  );
  const paths = parseCandidatePaths(output).filter(
    (candidate) => !deleted.has(candidate),
  );
  return { paths, serialized: paths.join("\0") };
}

function sameStableState(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
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

function assertRealPathComponents(root, relativePath) {
  let current = root;
  const components = relativePath.split("/");
  for (let index = 0; index < components.length - 1; index += 1) {
    current = path.join(current, components[index]);
    const metadata = lstatSync(current);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      fail(`${relativePath} traverses a non-directory or symbolic link.`);
    }
  }
}

function copyStableCandidate(root, destinationRoot, relativePath) {
  assertRealPathComponents(root, relativePath);
  const source = path.join(root, ...relativePath.split("/"));
  const canonicalSource = realpathSync(source);
  const rootPrefix = `${root}${path.sep}`;
  if (!canonicalSource.startsWith(rootPrefix)) {
    fail(`${relativePath} escapes the Git worktree.`);
  }
  const pathMetadata = lstatSync(source, { bigint: true });
  if (!pathMetadata.isFile() || pathMetadata.isSymbolicLink()) {
    fail(`${relativePath} is not a stable regular file.`);
  }
  if (pathMetadata.nlink !== 1n) {
    fail(`${relativePath} has multiple hard links.`);
  }
  if (pathMetadata.size > BigInt(MAX_CANDIDATE_FILE_BYTES)) {
    fail(`${relativePath} exceeds the publication file-size ceiling.`);
  }

  const destination = path.join(
    destinationRoot,
    ...relativePath.split("/"),
  );
  mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const sourceDescriptor = openSync(
    source,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  let destinationDescriptor;
  try {
    const openedMetadata = fstatSync(sourceDescriptor, { bigint: true });
    if (
      !openedMetadata.isFile() ||
      !sameStableState(pathMetadata, openedMetadata)
    ) {
      fail(`${relativePath} changed before it could be copied.`);
    }
    destinationDescriptor = openSync(
      destination,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    const buffer = Buffer.allocUnsafe(COPY_CHUNK_BYTES);
    let copied = 0n;
    while (true) {
      const bytesRead = readSync(
        sourceDescriptor,
        buffer,
        0,
        buffer.byteLength,
        null,
      );
      if (bytesRead === 0) break;
      let offset = 0;
      while (offset < bytesRead) {
        const bytesWritten = writeSync(
          destinationDescriptor,
          buffer,
          offset,
          bytesRead - offset,
        );
        if (bytesWritten <= 0) {
          fail(`${relativePath} could not be copied completely.`);
        }
        offset += bytesWritten;
      }
      copied += BigInt(bytesRead);
    }
    const finalOpenedMetadata = fstatSync(sourceDescriptor, { bigint: true });
    const finalPathMetadata = lstatSync(source, { bigint: true });
    if (
      copied !== pathMetadata.size ||
      !sameStableState(pathMetadata, finalOpenedMetadata) ||
      !sameStableState(pathMetadata, finalPathMetadata)
    ) {
      fail(`${relativePath} changed while it was copied.`);
    }
  } finally {
    if (destinationDescriptor !== undefined) {
      closeSync(destinationDescriptor);
    }
    closeSync(sourceDescriptor);
  }
  return pathMetadata;
}

function revalidateSources(root, sourceStates) {
  for (const [relativePath, expected] of sourceStates) {
    assertRealPathComponents(root, relativePath);
    const source = path.join(root, ...relativePath.split("/"));
    const actual = lstatSync(source, { bigint: true });
    if (
      !actual.isFile() ||
      actual.isSymbolicLink() ||
      !sameStableState(expected, actual)
    ) {
      fail(`${relativePath} changed after candidate materialization.`);
    }
  }
}

function scanCandidate(candidateRoot) {
  const result = spawnSync(
    process.execPath,
    [SCANNER, "--dest", candidateRoot, "--profile", "platform"],
    {
      cwd: SCRIPT_ROOT,
      env: {
        PATH: process.env.PATH ?? "",
        LANG: process.env.LANG ?? "C.UTF-8",
        LC_ALL: process.env.LC_ALL ?? "",
        NODE_OPTIONS: "",
      },
      stdio: "inherit",
      timeout: 10 * 60 * 1_000,
      windowsHide: true,
    },
  );
  if (result.error) {
    fail(`scanner process failed (${result.error.code ?? "spawn error"}).`);
  }
  return result.status ?? 1;
}

export function main(argv = process.argv.slice(2)) {
  const root = parseArguments(argv);
  const initialInventory = readCandidateInventory(root);
  if (initialInventory.paths.length === 0) {
    fail("Git publication candidate inventory is empty.");
  }

  const candidateRoot = mkdtempSync(
    path.join(tmpdir(), "loehrning-public-candidate-"),
  );
  chmodSync(candidateRoot, 0o700);
  const sourceStates = new Map();
  let totalBytes = 0n;
  let scanStatus = 1;
  try {
    for (const relativePath of initialInventory.paths) {
      const state = copyStableCandidate(
        root,
        candidateRoot,
        relativePath,
      );
      totalBytes += state.size;
      if (totalBytes > BigInt(MAX_CANDIDATE_TOTAL_BYTES)) {
        fail("candidate exceeds the total publication-size ceiling.");
      }
      sourceStates.set(relativePath, state);
    }
    scanStatus = scanCandidate(candidateRoot);
    const finalInventory = readCandidateInventory(root);
    if (finalInventory.serialized !== initialInventory.serialized) {
      fail("Git publication candidate inventory changed during the scan.");
    }
    revalidateSources(root, sourceStates);
  } finally {
    rmSync(candidateRoot, { recursive: true, force: true });
  }
  if (scanStatus !== 0) {
    fail(`publication scanner rejected the Git-visible candidate.`);
  }
  console.log(
    `scan-public-candidate passed: ${initialInventory.paths.length} Git-visible files materialized and verified.`,
  );
}

const directRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (directRun) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
