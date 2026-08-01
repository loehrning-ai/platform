#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { endianness, release as platformRelease } from "node:os";
import path, { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  APPLICATION_PROVIDER_ENVIRONMENT_KEYS,
  configuredApplicationEnvironment,
  minimalVerificationEnvironment,
} from "../../../scripts/environment-policy.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "../../..");
export const WEBSITE_ROOT = join(REPOSITORY_ROOT, "packages", "website");
export const RECEIPT_PATH = join(
  WEBSITE_ROOT,
  ".next",
  "loehrning-build-receipt.json",
);
const BUILD_ID_PATH = join(WEBSITE_ROOT, ".next", "BUILD_ID");
const RECEIPT_VERSION = 2;
const MAX_RECEIPT_BYTES = 32 * 1024;
const RECEIPT_FILE_NAME = "loehrning-build-receipt.json";
const RECEIPT_TEMPORARY_FILE_PREFIX = ".loehrning-build-receipt-";
const MUTABLE_ARTIFACT_ROOT_ENTRIES = new Set(["cache", "trace"]);

export const BUILD_INPUT_SCOPES = Object.freeze([
  "bun.lock",
  "bunfig.toml",
  "package.json",
  "LICENSE_POLICY.md",
  "scripts/deny-dotenv-loading.cjs",
  "scripts/environment-policy.mjs",
  "packages/website/content",
  "packages/website/public",
  "packages/website/src",
  "packages/website/package.json",
  "packages/website/next-env.d.ts",
  "packages/website/next.config.ts",
  "packages/website/postcss.config.mjs",
  "packages/website/sentry.edge.config.ts",
  "packages/website/sentry.server.config.ts",
  "packages/website/tailwind.config.ts",
  "packages/website/tsconfig.json",
  "packages/website/tsconfig.typecheck.json",
  "packages/website/vercel.json",
  "packages/website/scripts/build-freshness.mjs",
  "packages/website/scripts/export-registry.mjs",
  "packages/website/scripts/run-provider-free.mjs",
  "packages/website/scripts/validate-env.mjs",
]);

const TEST_ONLY_BUILD_IRRELEVANT_PREFIX = "SIMPLIFIED_SUPABASE_";
const BUILD_EXECUTION_ENVIRONMENT_KEYS = Object.freeze([
  "BUN_OPTIONS",
  "CI",
  "GITHUB_ACTIONS",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "NEXT_TELEMETRY_DISABLED",
  "NODE_OPTIONS",
  "TZ",
]);
const BUILD_ENVIRONMENT_KEYS = Object.freeze(
  [
    ...APPLICATION_PROVIDER_ENVIRONMENT_KEYS.filter(
      (key) => !key.startsWith(TEST_ONLY_BUILD_IRRELEVANT_PREFIX),
    ),
    "ANALYZE",
    ...BUILD_EXECUTION_ENVIRONMENT_KEYS,
  ].sort(),
);
const PRESENCE_ONLY_ENVIRONMENT_KEYS = new Set([
  "ANTHROPIC_API_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SENTRY_AUTH_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const LIVE_BUILD_PUBLIC_ENVIRONMENT_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
]);
export const CANONICAL_BUILD_EXECUTION_ENVIRONMENT = Object.freeze({
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  LC_CTYPE: "C.UTF-8",
  NEXT_TELEMETRY_DISABLED: "1",
});

function updateFramed(hash, label, value) {
  const labelBytes = Buffer.from(label, "utf8");
  const valueBytes = Buffer.isBuffer(value)
    ? value
    : Buffer.from(value, "utf8");
  hash.update(`${labelBytes.length}:`);
  hash.update(labelBytes);
  hash.update(`${valueBytes.length}:`);
  hash.update(valueBytes);
}

function safeRelativePath(value) {
  const segments = typeof value === "string" ? value.split("/") : [];
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1_024 &&
    !path.isAbsolute(value) &&
    !value.includes("\\") &&
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function fileType(metadata) {
  if (metadata.isFile()) return "file";
  if (metadata.isDirectory()) return "directory";
  if (metadata.isSymbolicLink()) return "symlink";
  return "other";
}

function metadataFingerprint(metadata) {
  return [
    fileType(metadata),
    metadata.dev,
    metadata.ino,
    metadata.mode,
    metadata.nlink,
    metadata.size,
    metadata.mtimeNs,
    metadata.ctimeNs,
    metadata.birthtimeNs,
  ]
    .map(String)
    .join(":");
}

function sameFileIdentity(left, right) {
  return (
    left.dev === right.dev && left.ino === right.ino && left.mode === right.mode
  );
}

function samePathComponentIdentity(left, right) {
  return (
    left.absolutePath === right.absolutePath &&
    sameFileIdentity(left.metadata, right.metadata)
  );
}

function relativePathInside(rootDirectory, candidatePath) {
  const relativePath = path.relative(rootDirectory, candidatePath);
  return {
    relativePath,
    contained:
      relativePath !== "" &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath),
  };
}

function capturePathState({
  canonicalPath,
  canonicalRoot,
  message,
  preserveMissing = false,
}) {
  try {
    const relative = relativePathInside(canonicalRoot, canonicalPath);
    if (!relative.contained) throw new Error(message);

    const state = [];
    const rootMetadata = lstatSync(canonicalRoot, { bigint: true });
    if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
      throw new Error(message);
    }
    state.push({ absolutePath: canonicalRoot, metadata: rootMetadata });

    const components = relative.relativePath.split(path.sep);
    let currentPath = canonicalRoot;
    for (let index = 0; index < components.length; index += 1) {
      currentPath = join(currentPath, components[index]);
      const metadata = lstatSync(currentPath, { bigint: true });
      const finalComponent = index === components.length - 1;
      if (
        metadata.isSymbolicLink() ||
        (!finalComponent && !metadata.isDirectory()) ||
        (finalComponent && !metadata.isFile())
      ) {
        throw new Error(message);
      }
      state.push({ absolutePath: currentPath, metadata });
    }

    const resolvedPath = realpathSync(canonicalPath);
    if (!relativePathInside(canonicalRoot, resolvedPath).contained) {
      throw new Error(message);
    }
    const finalMetadata = state.at(-1)?.metadata;
    const confirmedMetadata = lstatSync(canonicalPath, { bigint: true });
    if (
      !finalMetadata ||
      confirmedMetadata.isSymbolicLink() ||
      !confirmedMetadata.isFile() ||
      metadataFingerprint(finalMetadata) !==
        metadataFingerprint(confirmedMetadata)
    ) {
      throw new Error(message);
    }
    return state;
  } catch (error) {
    if (
      preserveMissing &&
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw error;
    }
    if (error instanceof Error && error.message === message) throw error;
    throw new Error(message, { cause: error });
  }
}

function resolveStableReadPath(rootDirectory, absolutePath, invalidMessage) {
  const requestedRoot = resolve(rootDirectory);
  const requestedPath = resolve(absolutePath);
  const requested = relativePathInside(requestedRoot, requestedPath);
  if (!requested.contained) throw new Error(invalidMessage);

  let rootMetadata;
  let canonicalRoot;
  try {
    rootMetadata = lstatSync(requestedRoot, { bigint: true });
    canonicalRoot = realpathSync(requestedRoot);
  } catch (error) {
    throw new Error(invalidMessage, { cause: error });
  }
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    throw new Error(invalidMessage);
  }

  const canonicalPath = resolve(canonicalRoot, requested.relativePath);
  if (!relativePathInside(canonicalRoot, canonicalPath).contained) {
    throw new Error(invalidMessage);
  }
  const pathState = capturePathState({
    canonicalPath,
    canonicalRoot,
    message: invalidMessage,
    preserveMissing: true,
  });
  if (!sameFileIdentity(rootMetadata, pathState[0].metadata)) {
    throw new Error(invalidMessage);
  }
  return { canonicalPath, canonicalRoot, pathState };
}

function assertOpenedPathIdentity({
  canonicalPath,
  canonicalRoot,
  expectedPathState,
  openedMetadata,
  changedMessage,
}) {
  const currentPathState = capturePathState({
    canonicalPath,
    canonicalRoot,
    message: changedMessage,
  });
  if (
    currentPathState.length !== expectedPathState.length ||
    expectedPathState.some(
      (component, index) =>
        !samePathComponentIdentity(component, currentPathState[index]),
    )
  ) {
    throw new Error(changedMessage);
  }
  const finalMetadata = currentPathState.at(-1)?.metadata;
  if (
    !finalMetadata ||
    metadataFingerprint(openedMetadata) !== metadataFingerprint(finalMetadata)
  ) {
    throw new Error(changedMessage);
  }
}

export function readStableRegularFile(
  absolutePath,
  relativePath,
  kind,
  options = {},
) {
  const invalidMessage =
    options.invalidMessage ??
    `${kind} must be a regular non-symlink file: ${relativePath}`;
  const changedMessage =
    options.changedMessage ??
    `${kind} changed while it was being hashed: ${relativePath}`;
  const { canonicalPath, canonicalRoot, pathState } = resolveStableReadPath(
    options.rootDirectory ?? dirname(absolutePath),
    absolutePath,
    invalidMessage,
  );
  let descriptor;
  try {
    descriptor = openSync(
      canonicalPath,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ELOOP"
    ) {
      throw new Error(invalidMessage, { cause: error });
    }
    throw error;
  }

  try {
    const before = fstatSync(descriptor, { bigint: true });
    const minimumBytes =
      options.minimumBytes === undefined
        ? undefined
        : BigInt(options.minimumBytes);
    const maximumBytes =
      options.maximumBytes === undefined
        ? undefined
        : BigInt(options.maximumBytes);
    if (
      !before.isFile() ||
      (minimumBytes !== undefined && before.size < minimumBytes) ||
      (maximumBytes !== undefined && before.size > maximumBytes)
    ) {
      throw new Error(invalidMessage);
    }

    options.afterOpen?.({ absolutePath: canonicalPath, metadata: before });
    assertOpenedPathIdentity({
      canonicalPath,
      canonicalRoot,
      expectedPathState: pathState,
      openedMetadata: before,
      changedMessage,
    });
    const contents = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    if (
      BigInt(contents.byteLength) !== before.size ||
      metadataFingerprint(before) !== metadataFingerprint(after)
    ) {
      throw new Error(changedMessage);
    }
    assertOpenedPathIdentity({
      canonicalPath,
      canonicalRoot,
      expectedPathState: pathState,
      openedMetadata: after,
      changedMessage,
    });
    return contents;
  } finally {
    closeSync(descriptor);
  }
}

function walkFiles(repositoryRoot, relativePath, files) {
  const absolutePath = join(repositoryRoot, relativePath);
  let stat;
  try {
    stat = lstatSync(absolutePath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      files.add(relativePath);
      return;
    }
    throw error;
  }
  if (stat.isSymbolicLink()) {
    throw new Error(
      `Build freshness refused symbolic-link input: ${relativePath}`,
    );
  }
  if (stat.isFile()) {
    files.add(relativePath);
    return;
  }
  if (!stat.isDirectory()) {
    throw new Error(`Unsupported build input type: ${relativePath}`);
  }
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    walkFiles(repositoryRoot, `${relativePath}/${entry.name}`, files);
  }
}

function fallbackBuildInputPaths(repositoryRoot) {
  const files = new Set();
  for (const scope of BUILD_INPUT_SCOPES) {
    walkFiles(repositoryRoot, scope, files);
  }
  return [...files].sort();
}

function collectBuildInputObservation(
  repositoryRoot,
  relativePath,
  observations,
) {
  if (!safeRelativePath(relativePath)) {
    throw new Error(
      `Unsafe path in build input observation: ${JSON.stringify(relativePath)}`,
    );
  }
  if (observations.has(relativePath)) return;
  const absolutePath = join(repositoryRoot, relativePath);
  let metadata;
  try {
    metadata = lstatSync(absolutePath, { bigint: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      observations.set(relativePath, "missing");
      return;
    }
    throw error;
  }
  if (metadata.isSymbolicLink()) {
    throw new Error(
      `Build freshness refused symbolic-link input: ${relativePath}`,
    );
  }
  if (!metadata.isFile() && !metadata.isDirectory()) {
    throw new Error(`Unsupported build input type: ${relativePath}`);
  }
  observations.set(relativePath, metadataFingerprint(metadata));
  if (!metadata.isDirectory()) return;
  const entries = readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.name !== ".DS_Store")
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    collectBuildInputObservation(
      repositoryRoot,
      `${relativePath}/${entry.name}`,
      observations,
    );
  }
}

function computeBuildInputObservation(options = {}) {
  const repositoryRoot = options.repositoryRoot ?? REPOSITORY_ROOT;
  const observations = new Map();
  const scopes = options.files ?? BUILD_INPUT_SCOPES;
  for (const scope of [...new Set(scopes)].sort()) {
    collectBuildInputObservation(repositoryRoot, scope, observations);
  }
  const hash = createHash("sha256");
  for (const [relativePath, fingerprint] of [...observations].sort(
    ([left], [right]) => left.localeCompare(right, "en"),
  )) {
    updateFramed(hash, relativePath, fingerprint);
  }
  return {
    observedPathCount: observations.size,
    metadataDigest: hash.digest("hex"),
  };
}

export function listBuildInputPaths(repositoryRoot = REPOSITORY_ROOT) {
  // Git contributes tracked-but-currently-missing paths. The filesystem walk
  // contributes ignored files inside explicit build scopes, because Next can
  // still consume them and freshness must not silently omit them.
  const files = new Set(fallbackBuildInputPaths(repositoryRoot));
  const result = spawnSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
      "--",
      ...BUILD_INPUT_SCOPES,
    ],
    {
      cwd: repositoryRoot,
      encoding: "buffer",
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    return [...files].sort();
  }
  const gitFiles = result.stdout.toString("utf8").split("\0").filter(Boolean);
  for (const file of gitFiles) {
    if (!safeRelativePath(file)) {
      throw new Error(
        `Unsafe path in build input set: ${JSON.stringify(file)}`,
      );
    }
    files.add(file);
  }
  return [...files].sort();
}

function normalizedEnvironmentValue(key, value) {
  const normalized = typeof value === "string" ? value : "";
  if (PRESENCE_ONLY_ENVIRONMENT_KEYS.has(key)) {
    return normalized.trim() ? "<present>" : "";
  }
  return normalized;
}

function environmentForMode(environment, mode) {
  if (mode !== "live-auth") return environment;
  const minimalEnvironment = minimalVerificationEnvironment(environment);
  return Object.fromEntries(
    BUILD_ENVIRONMENT_KEYS.map((key) => {
      if (LIVE_BUILD_PUBLIC_ENVIRONMENT_KEYS.has(key)) {
        return [key, environment[key] ?? ""];
      }
      if (key === "E2E_AUTH_LIVE") return [key, "1"];
      if (key === "LOEHRNING_VALIDATION_PROFILE") {
        return [key, "live-auth-e2e"];
      }
      if (key === "NEXT_TELEMETRY_DISABLED") return [key, "1"];
      if (BUILD_EXECUTION_ENVIRONMENT_KEYS.includes(key)) {
        return [key, minimalEnvironment[key] ?? environment[key] ?? ""];
      }
      return [key, ""];
    }),
  );
}

export function computeBuildState(options = {}) {
  const repositoryRoot = options.repositoryRoot ?? REPOSITORY_ROOT;
  const environment = environmentForMode(
    options.environment ?? process.env,
    options.mode ?? "current",
  );
  const files = options.files ?? listBuildInputPaths(repositoryRoot);
  const inputHash = createHash("sha256");

  for (const relativePath of files) {
    if (!safeRelativePath(relativePath)) {
      throw new Error(
        `Unsafe path in build input set: ${JSON.stringify(relativePath)}`,
      );
    }
    const absolutePath = join(repositoryRoot, relativePath);
    let contents;
    try {
      contents = readStableRegularFile(
        absolutePath,
        relativePath,
        "Build input",
        { rootDirectory: repositoryRoot },
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        updateFramed(inputHash, `missing:${relativePath}`, "");
        continue;
      }
      throw error;
    }
    updateFramed(inputHash, `file:${relativePath}`, contents);
  }

  const environmentHash = createHash("sha256");
  for (const key of BUILD_ENVIRONMENT_KEYS) {
    updateFramed(
      environmentHash,
      key,
      normalizedEnvironmentValue(key, environment[key]),
    );
  }

  return {
    fileCount: files.length,
    inputDigest: inputHash.digest("hex"),
    environmentDigest: environmentHash.digest("hex"),
  };
}

function validateToolchain(toolchain) {
  const fields = [
    "nodeVersion",
    "nodeModuleAbi",
    "v8Version",
    "icuVersion",
    "timezoneDataVersion",
    "bunRevision",
    "platform",
    "platformRelease",
    "architecture",
    "endianness",
  ];
  return (
    toolchain &&
    typeof toolchain === "object" &&
    !Array.isArray(toolchain) &&
    Object.keys(toolchain).length === fields.length &&
    fields.every(
      (field) =>
        typeof toolchain[field] === "string" &&
        toolchain[field].length <= 256 &&
        !/[\u0000-\u001f\u007f]/.test(toolchain[field]),
    )
  );
}

function captureToolchain(options = {}) {
  if (options.toolchain !== undefined) {
    if (!validateToolchain(options.toolchain)) {
      throw new Error("Build toolchain override has an invalid schema.");
    }
    return { ...options.toolchain };
  }
  const result = spawnSync("bun", ["--revision"], {
    encoding: "utf8",
    env: options.environment ?? process.env,
    maxBuffer: 4 * 1024,
  });
  if (result.error) throw result.error;
  const bunRevision = result.stdout?.trim() ?? "";
  if (result.status !== 0 || !/^[0-9A-Za-z.+_-]{1,128}$/.test(bunRevision)) {
    throw new Error("Unable to identify the Bun toolchain revision.");
  }
  return {
    nodeVersion: process.versions.node,
    nodeModuleAbi: process.versions.modules ?? "",
    v8Version: process.versions.v8 ?? "",
    icuVersion: process.versions.icu ?? "",
    timezoneDataVersion: process.versions.tz ?? "",
    bunRevision,
    platform: process.platform,
    platformRelease: platformRelease(),
    architecture: process.arch,
    endianness: endianness(),
  };
}

function sameToolchain(left, right) {
  return (
    validateToolchain(left) &&
    validateToolchain(right) &&
    Object.keys(left).every((key) => left[key] === right[key])
  );
}

function excludedArtifactPath(relativePath) {
  const [rootEntry] = relativePath.split("/");
  return (
    MUTABLE_ARTIFACT_ROOT_ENTRIES.has(rootEntry) ||
    relativePath === RECEIPT_FILE_NAME ||
    (relativePath.startsWith(RECEIPT_TEMPORARY_FILE_PREFIX) &&
      relativePath.endsWith(".tmp"))
  );
}

function collectArtifactFiles(nextDirectory, relativePath, files) {
  if (relativePath && excludedArtifactPath(relativePath)) return;
  const absolutePath = relativePath
    ? join(nextDirectory, ...relativePath.split("/"))
    : nextDirectory;
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(
      `Build artifact refused symbolic-link output: ${relativePath || ".next"}`,
    );
  }
  if (metadata.isFile()) {
    files.push(relativePath);
    return;
  }
  if (!metadata.isDirectory()) {
    throw new Error(
      `Unsupported build artifact type: ${relativePath || ".next"}`,
    );
  }
  const entries = readdirSync(absolutePath, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, "en"),
  );
  for (const entry of entries) {
    const childPath = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name;
    collectArtifactFiles(nextDirectory, childPath, files);
  }
}

function computeArtifactState(options = {}) {
  const websiteRoot = options.websiteRoot ?? WEBSITE_ROOT;
  const nextDirectory = join(websiteRoot, ".next");
  assertNextDirectory(nextDirectory);
  const files = [];
  collectArtifactFiles(nextDirectory, "", files);
  const hash = createHash("sha256");
  for (const relativePath of files.sort()) {
    updateFramed(
      hash,
      `artifact:${relativePath}`,
      readStableRegularFile(
        join(nextDirectory, ...relativePath.split("/")),
        `.next/${relativePath}`,
        "Build artifact",
        { rootDirectory: websiteRoot },
      ),
    );
  }
  return {
    artifactFileCount: files.length,
    artifactDigest: hash.digest("hex"),
  };
}

function readBuildId(
  buildIdPath = BUILD_ID_PATH,
  rootDirectory = WEBSITE_ROOT,
) {
  const buildId = readStableRegularFile(
    buildIdPath,
    ".next/BUILD_ID",
    "Next BUILD_ID",
    {
      rootDirectory,
      maximumBytes: 512,
      invalidMessage: "Next BUILD_ID must be a bounded regular file.",
      changedMessage: "Next BUILD_ID changed while it was being read.",
    },
  )
    .toString("utf8")
    .trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(buildId)) {
    throw new Error("Next BUILD_ID has an invalid format.");
  }
  return buildId;
}

function assertNextDirectory(nextDirectory) {
  const stat = lstatSync(nextDirectory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(".next must be a real build directory.");
  }
}

export function buildReceiptEnvironment(source = process.env) {
  return {
    ...configuredApplicationEnvironment(source),
    // Bun normalizes locale variables when it enters a package script. A build
    // and its later `:built` gate can therefore observe different ambient
    // locales even when launched from the same shell. Force the values that
    // actually reach Next so build identity is independent of that launcher
    // topology without dropping CI, timezone, or application inputs.
    ...CANONICAL_BUILD_EXECUTION_ENVIRONMENT,
    // Preserve the one build-only control that is intentionally outside the
    // generic application environment. An explicit blank also prevents dotenv
    // files from enabling the analyzer behind the receipt boundary.
    ANALYZE: source.ANALYZE === "true" ? "true" : "",
  };
}

function withReceiptEnvironment(options) {
  const websiteRoot = options.websiteRoot ?? WEBSITE_ROOT;
  if (options.environment !== undefined && websiteRoot !== WEBSITE_ROOT) {
    return options;
  }
  return {
    ...options,
    // Next loads runtime dotenv files inside its child process. Receipt-bearing
    // builds must instead use one explicit, allowlisted environment so the
    // environment digest describes the values that actually reached Next.
    environment: buildReceiptEnvironment(options.environment ?? process.env),
  };
}

export function recordBuildReceipt(options = {}) {
  const receiptOptions = withReceiptEnvironment(options);
  const websiteRoot = receiptOptions.websiteRoot ?? WEBSITE_ROOT;
  const receiptPath =
    receiptOptions.receiptPath ??
    join(websiteRoot, ".next", "loehrning-build-receipt.json");
  const buildIdPath =
    receiptOptions.buildIdPath ?? join(websiteRoot, ".next", "BUILD_ID");
  const nextDirectory = dirname(receiptPath);
  assertNextDirectory(nextDirectory);
  const state = receiptOptions.state ?? computeBuildState(receiptOptions);
  const toolchain = captureToolchain(receiptOptions);
  const artifact =
    receiptOptions.artifact ?? computeArtifactState(receiptOptions);
  const receipt = {
    version: RECEIPT_VERSION,
    algorithm: "sha256",
    buildId: readBuildId(buildIdPath, websiteRoot),
    ...state,
    ...artifact,
    toolchain,
  };
  const temporaryPath = join(
    nextDirectory,
    `.loehrning-build-receipt-${process.pid}-${randomUUID()}.tmp`,
  );
  let descriptor;
  try {
    descriptor = openSync(temporaryPath, "wx", 0o644);
    writeFileSync(descriptor, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporaryPath, receiptPath);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporaryPath, { force: true });
  }
  return receipt;
}

function sameBuildState(left, right) {
  return (
    left.fileCount === right.fileCount &&
    left.inputDigest === right.inputDigest &&
    left.environmentDigest === right.environmentDigest
  );
}

export function runBuildAndRecord(options = {}) {
  const receiptOptions = withReceiptEnvironment(options);
  const websiteRoot = receiptOptions.websiteRoot ?? WEBSITE_ROOT;
  const receiptPath =
    receiptOptions.receiptPath ??
    join(websiteRoot, ".next", "loehrning-build-receipt.json");
  const before = computeBuildState(receiptOptions);
  const beforeObservation = computeBuildInputObservation(receiptOptions);
  const beforeToolchain = captureToolchain(receiptOptions);
  rmSync(receiptPath, { force: true });
  const result = spawnSync(
    receiptOptions.command ?? "bun",
    receiptOptions.commandArguments ?? ["run", "next", "build"],
    {
      cwd: websiteRoot,
      env: receiptOptions.environment,
      stdio: receiptOptions.stdio ?? "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Production build failed with ${
        result.signal ? `signal ${result.signal}` : `exit ${result.status}`
      }.`,
    );
  }
  const after = computeBuildState(receiptOptions);
  const afterObservation = computeBuildInputObservation(receiptOptions);
  const afterToolchain = captureToolchain(receiptOptions);
  if (
    !sameBuildState(before, after) ||
    beforeObservation.observedPathCount !==
      afterObservation.observedPathCount ||
    beforeObservation.metadataDigest !== afterObservation.metadataDigest ||
    !sameToolchain(beforeToolchain, afterToolchain)
  ) {
    rmSync(receiptPath, { force: true });
    throw new Error(
      "Build inputs changed while Next was compiling; discarded freshness receipt.",
    );
  }
  const artifact = computeArtifactState(receiptOptions);
  return recordBuildReceipt({
    ...receiptOptions,
    state: after,
    artifact,
    toolchain: afterToolchain,
  });
}

function readReceipt(receiptPath, rootDirectory) {
  let contents;
  try {
    contents = readStableRegularFile(
      receiptPath,
      RECEIPT_FILE_NAME,
      "Build receipt",
      {
        rootDirectory,
        minimumBytes: 2,
        maximumBytes: MAX_RECEIPT_BYTES,
        invalidMessage: "Build receipt must be a bounded regular file.",
        changedMessage: "Build receipt changed while it was being read.",
      },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        "Build freshness receipt is missing. Run the non-:built command.",
        { cause: error },
      );
    }
    throw error;
  }
  let receipt;
  try {
    receipt = JSON.parse(contents.toString("utf8"));
  } catch {
    throw new Error("Build receipt is not valid JSON.");
  }
  if (
    !receipt ||
    typeof receipt !== "object" ||
    Array.isArray(receipt) ||
    receipt.version !== RECEIPT_VERSION ||
    receipt.algorithm !== "sha256" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(receipt.buildId ?? "") ||
    !/^[0-9a-f]{64}$/.test(receipt.inputDigest ?? "") ||
    !/^[0-9a-f]{64}$/.test(receipt.environmentDigest ?? "") ||
    !/^[0-9a-f]{64}$/.test(receipt.artifactDigest ?? "") ||
    !Number.isSafeInteger(receipt.fileCount) ||
    receipt.fileCount < 1 ||
    !Number.isSafeInteger(receipt.artifactFileCount) ||
    receipt.artifactFileCount < 1 ||
    !validateToolchain(receipt.toolchain)
  ) {
    throw new Error("Build receipt schema is invalid.");
  }
  return receipt;
}

export function verifyBuildReceipt(options = {}) {
  const receiptOptions = withReceiptEnvironment(options);
  const websiteRoot = receiptOptions.websiteRoot ?? WEBSITE_ROOT;
  const receiptPath =
    receiptOptions.receiptPath ??
    join(websiteRoot, ".next", "loehrning-build-receipt.json");
  const buildIdPath =
    receiptOptions.buildIdPath ?? join(websiteRoot, ".next", "BUILD_ID");
  assertNextDirectory(dirname(receiptPath));
  const receipt = readReceipt(receiptPath, websiteRoot);
  const current = computeBuildState(receiptOptions);
  const currentToolchain = captureToolchain(receiptOptions);
  const buildId = readBuildId(buildIdPath, websiteRoot);
  if (
    receipt.buildId !== buildId ||
    receipt.fileCount !== current.fileCount ||
    receipt.inputDigest !== current.inputDigest ||
    receipt.environmentDigest !== current.environmentDigest ||
    !sameToolchain(receipt.toolchain, currentToolchain)
  ) {
    throw new Error(
      "Stale production build: source or build environment no longer matches .next. Run the non-:built command.",
    );
  }
  const artifact = computeArtifactState(receiptOptions);
  if (
    receipt.artifactFileCount !== artifact.artifactFileCount ||
    receipt.artifactDigest !== artifact.artifactDigest
  ) {
    throw new Error(
      "Stale or modified production build artifact: .next no longer matches its receipt. Run the non-:built command.",
    );
  }
  return receipt;
}

function main() {
  const [command, ...unexpected] = process.argv.slice(2);
  if (
    unexpected.length > 0 ||
    !["build", "verify", "verify-live-auth"].includes(command)
  ) {
    console.error(
      "Usage: node scripts/build-freshness.mjs <build|verify|verify-live-auth>",
    );
    process.exit(2);
  }
  try {
    if (command === "build") {
      const receipt = runBuildAndRecord();
      console.log(
        `Recorded build ${receipt.buildId} over ${receipt.fileCount} inputs.`,
      );
      return;
    }
    const receipt = verifyBuildReceipt({
      mode: command === "verify-live-auth" ? "live-auth" : "current",
    });
    console.log(
      `Verified fresh build ${receipt.buildId} over ${receipt.fileCount} inputs.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main();
}
