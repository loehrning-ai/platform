#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { constants, type BigIntStats } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES,
  OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES,
  OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES,
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  type OpenSourceArtifact,
  type OpenSourceMediaFile,
  type VideoArtifact,
} from "../packages/website/src/lib/open-source/artifacts";

const defaultRepositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const PUBLIC_DIRECTORY = "packages/website/public";

export type ArtifactManifestEntry = {
  path: string;
  sha256: string;
  sizeBytes?: number;
  source?: string;
  redistribution?: string;
  redistributionLicenseHref?: string;
};

export type ArtifactManifest = {
  version: number;
  assets: ArtifactManifestEntry[];
};

export type ArtifactVerificationSummary = {
  licenses: number;
  screenshots: number;
  mediaFiles: number;
};

type FileVerificationHookContext = {
  absolutePath: string;
  label: string;
};

export type ArtifactAssetVerificationHooks = {
  afterOpen?: (context: FileVerificationHookContext) => Promise<void> | void;
  afterRead?: (
    context: FileVerificationHookContext & { bytes: Buffer },
  ) => Promise<void> | void;
};

function fail(message: string): never {
  throw new Error(`Artifact asset verification failed: ${message}`);
}

export function parseArtifactManifest(raw: string): ArtifactManifest {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("ASSET_MANIFEST.json is not valid JSON");
  }
  if (
    !value ||
    typeof value !== "object" ||
    (value as { version?: unknown }).version !== 1 ||
    !Array.isArray((value as { assets?: unknown }).assets)
  ) {
    fail("ASSET_MANIFEST.json must use version 1 and contain an assets array");
  }
  return value as ArtifactManifest;
}

function indexManifest(
  manifest: ArtifactManifest,
): Map<string, ArtifactManifestEntry> {
  const manifestByPath = new Map<string, ArtifactManifestEntry>();
  for (const entry of manifest.assets) {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string") {
      fail("ASSET_MANIFEST.json contains an invalid asset entry");
    }
    if (manifestByPath.has(entry.path)) {
      fail(`duplicate manifest entry for ${entry.path}`);
    }
    manifestByPath.set(entry.path, entry);
  }
  return manifestByPath;
}

function publicHrefToRepositoryPath(href: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(href, "https://artifact.invalid");
  } catch {
    fail(`${label} is not a valid public file path`);
  }
  if (
    parsed.origin !== "https://artifact.invalid" ||
    parsed.search ||
    parsed.hash
  ) {
    fail(`${label} must be a plain repository-local public file path`);
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    fail(`${label} contains invalid URL encoding`);
  }
  const segments = pathname.split("/").slice(1);
  if (
    !pathname.startsWith("/") ||
    pathname.includes("\\") ||
    pathname.includes("\0") ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    fail(`${label} must be a safe repository-local public file path`);
  }
  return `${PUBLIC_DIRECTORY}${pathname}`;
}

function requireManifestEntry(
  manifestByPath: ReadonlyMap<string, ArtifactManifestEntry>,
  repositoryPath: string,
  label: string,
): ArtifactManifestEntry {
  const manifestEntry = manifestByPath.get(repositoryPath);
  if (!manifestEntry) {
    fail(`${label} is absent from ASSET_MANIFEST.json (${repositoryPath})`);
  }
  return manifestEntry;
}

function normalizedRepositoryName(value: string): string {
  return value.replace(/\.git$/i, "").toLocaleLowerCase("en");
}

function artifactRepositoryCoordinates(artifact: OpenSourceArtifact): {
  owner: string;
  repository: string;
  revision: string;
} {
  let source: URL;
  try {
    source = new URL(artifact.source.href);
  } catch {
    fail(`${artifact.id} source.href is not a valid URL`);
  }
  const segments = source.pathname.split("/").filter(Boolean);
  if (
    source.origin !== "https://github.com" ||
    source.username ||
    source.password ||
    source.search ||
    source.hash ||
    segments[0] !== "loehrning-ai" ||
    typeof segments[1] !== "string" ||
    normalizedRepositoryName(segments[1]).length === 0 ||
    !/^[a-f0-9]{40}$/.test(artifact.source.revision)
  ) {
    fail(
      `${artifact.id} source must identify a pinned loehrning-ai repository`,
    );
  }
  return {
    owner: segments[0],
    repository: normalizedRepositoryName(segments[1]),
    revision: artifact.source.revision,
  };
}

function assertPinnedManifestSource({
  artifact,
  entry,
  label,
  expectedSourcePath,
}: {
  artifact: OpenSourceArtifact;
  entry: ArtifactManifestEntry;
  label: string;
  expectedSourcePath: string;
}): void {
  if (typeof entry.source !== "string" || entry.source.trim().length === 0) {
    fail(`${label} manifest source must be a pinned source URL`);
  }
  let source: URL;
  try {
    source = new URL(entry.source);
  } catch {
    fail(`${label} manifest source must be a pinned source URL`);
  }
  if (
    source.protocol !== "https:" ||
    source.username ||
    source.password ||
    source.search ||
    source.hash
  ) {
    fail(`${label} manifest source must be a clean HTTPS URL`);
  }

  const expected = artifactRepositoryCoordinates(artifact);
  const segments = source.pathname.split("/").slice(1);
  if (segments.some((segment) => segment.length === 0)) {
    fail(`${label} manifest source must use a normalized source path`);
  }
  let owner: string | undefined;
  let repository: string | undefined;
  let revision: string | undefined;
  let sourcePathSegments: string[] = [];

  if (source.origin === "https://github.com") {
    owner = segments[0];
    repository = segments[1];
    if (segments[2] !== "blob" && segments[2] !== "raw") {
      fail(
        `${label} manifest source must use a GitHub /blob/<revision>/ or /raw/<revision>/ URL`,
      );
    }
    revision = segments[3];
    sourcePathSegments = segments.slice(4);
  } else if (source.origin === "https://raw.githubusercontent.com") {
    owner = segments[0];
    repository = segments[1];
    revision = segments[2];
    sourcePathSegments = segments.slice(3);
  } else {
    fail(
      `${label} manifest source must use github.com or raw.githubusercontent.com`,
    );
  }

  if (
    owner !== expected.owner ||
    typeof repository !== "string" ||
    normalizedRepositoryName(repository) !== expected.repository ||
    revision !== expected.revision ||
    sourcePathSegments.length === 0
  ) {
    fail(
      `${label} manifest source must use the artifact repository and pinned SHA`,
    );
  }

  let decodedSourcePathSegments: string[];
  try {
    decodedSourcePathSegments = sourcePathSegments.map((segment) =>
      decodeURIComponent(segment),
    );
  } catch {
    fail(`${label} manifest source contains invalid URL encoding`);
  }
  if (
    decodedSourcePathSegments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        segment.includes("\0"),
    )
  ) {
    fail(`${label} manifest source must use a normalized source path`);
  }
  const decodedSourcePath = decodedSourcePathSegments.join("/");
  if (decodedSourcePath !== expectedSourcePath) {
    fail(`${label} manifest source must resolve to ${expectedSourcePath}`);
  }
}

function assertArtifactRedistribution(
  artifact: OpenSourceArtifact,
  entry: ArtifactManifestEntry,
  role: string,
): void {
  if (entry.redistributionLicenseHref !== artifact.license.href) {
    fail(
      `${artifact.id} ${role} redistributionLicenseHref must exactly equal ${artifact.license.href}`,
    );
  }
}

function isContainedPath(root: string, candidatePath: string): boolean {
  const relativePath = path.relative(root, candidatePath);
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function sameFileIdentity(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameStableFileState(left: BigIntStats, right: BigIntStats): boolean {
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
  root,
  absolutePath,
  openedInfo,
  label,
}: {
  root: string;
  absolutePath: string;
  openedInfo: BigIntStats;
  label: string;
}): Promise<void> {
  const relativePath = path.relative(root, absolutePath);
  if (!isContainedPath(root, absolutePath) || relativePath === "") {
    fail(`${label} path escapes the repository`);
  }

  const components = relativePath.split(path.sep);
  let currentPath = root;
  let finalPathInfo: BigIntStats | null = null;
  for (let index = 0; index < components.length; index += 1) {
    currentPath = path.join(currentPath, components[index]);
    const componentInfo = await lstat(currentPath, { bigint: true }).catch(
      () => null,
    );
    const isFinalComponent = index === components.length - 1;
    if (!componentInfo) {
      fail(`${label} path changed while it was being verified`);
    }
    if (componentInfo.isSymbolicLink()) {
      fail(`${label} must not use symbolic-link path components`);
    }
    if (
      (!isFinalComponent && !componentInfo.isDirectory()) ||
      (isFinalComponent && !componentInfo.isFile())
    ) {
      fail(`${label} path changed while it was being verified`);
    }
    if (isFinalComponent) finalPathInfo = componentInfo;
  }

  if (!finalPathInfo || !sameFileIdentity(openedInfo, finalPathInfo)) {
    fail(`${label} pathname no longer identifies the opened file`);
  }

  const resolvedPath = await realpath(absolutePath).catch(() => null);
  if (!resolvedPath || !isContainedPath(root, resolvedPath)) {
    fail(`${label} must resolve inside the repository`);
  }

  const confirmedInfo = await lstat(absolutePath, { bigint: true }).catch(
    () => null,
  );
  if (
    !confirmedInfo ||
    confirmedInfo.isSymbolicLink() ||
    !confirmedInfo.isFile() ||
    !sameFileIdentity(openedInfo, confirmedInfo)
  ) {
    fail(`${label} pathname changed identity while it was being verified`);
  }
}

async function readStableRepositoryFile({
  repositoryRoot,
  repositoryPath,
  label,
  hooks,
  maxSizeBytes,
}: {
  repositoryRoot: string;
  repositoryPath: string;
  label: string;
  hooks?: ArtifactAssetVerificationHooks;
  maxSizeBytes?: number;
}): Promise<Buffer> {
  const root = await realpath(path.resolve(repositoryRoot)).catch(() => null);
  if (!root) fail("repository root does not exist");
  const absolutePath = path.resolve(root, repositoryPath);
  if (!isContainedPath(root, absolutePath) || absolutePath === root) {
    fail(`${label} path escapes the repository`);
  }

  const fileHandle = await open(
    absolutePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  ).catch(() => null);
  if (!fileHandle) {
    fail(`${label} must resolve to a regular non-symlink file`);
  }

  try {
    const before = await fileHandle.stat({ bigint: true });
    if (!before.isFile()) {
      fail(`${label} must resolve to a regular non-symlink file`);
    }
    if (
      maxSizeBytes !== undefined &&
      (maxSizeBytes <= 0 || before.size > BigInt(maxSizeBytes))
    ) {
      fail(`${label} exceeds the ${String(maxSizeBytes)} byte size limit`);
    }
    await hooks?.afterOpen?.({ absolutePath, label });
    await assertOpenedPathIdentity({
      root,
      absolutePath,
      openedInfo: before,
      label,
    });

    let bytes: Buffer;
    if (maxSizeBytes === undefined) {
      bytes = await fileHandle.readFile();
    } else {
      const boundedBytes = Buffer.alloc(maxSizeBytes + 1);
      let bytesReadTotal = 0;
      while (bytesReadTotal < boundedBytes.byteLength) {
        const { bytesRead } = await fileHandle.read(
          boundedBytes,
          bytesReadTotal,
          boundedBytes.byteLength - bytesReadTotal,
          null,
        );
        if (bytesRead === 0) break;
        bytesReadTotal += bytesRead;
      }
      if (bytesReadTotal > maxSizeBytes) {
        fail(`${label} exceeds the ${String(maxSizeBytes)} byte size limit`);
      }
      bytes = boundedBytes.subarray(0, bytesReadTotal);
    }
    await hooks?.afterRead?.({ absolutePath, bytes, label });

    const after = await fileHandle.stat({ bigint: true });
    if (!sameStableFileState(before, after)) {
      fail(`${label} changed while it was being verified`);
    }
    if (BigInt(bytes.byteLength) !== before.size) {
      fail(`${label} changed length while it was being verified`);
    }
    await assertOpenedPathIdentity({
      root,
      absolutePath,
      openedInfo: after,
      label,
    });
    return bytes;
  } finally {
    await fileHandle.close();
  }
}

async function readVerifiedFile({
  repositoryRoot,
  repositoryPath,
  label,
  expectedSha256,
  expectedSizeBytes,
  manifestByPath,
  hooks,
  maxSizeBytes,
}: {
  repositoryRoot: string;
  repositoryPath: string;
  label: string;
  expectedSha256: string;
  expectedSizeBytes: number;
  manifestByPath: ReadonlyMap<string, ArtifactManifestEntry>;
  hooks?: ArtifactAssetVerificationHooks;
  maxSizeBytes?: number;
}): Promise<Buffer> {
  const manifestEntry = requireManifestEntry(
    manifestByPath,
    repositoryPath,
    label,
  );
  if (manifestEntry.sha256 !== expectedSha256) {
    fail(`${label} SHA-256 differs from ASSET_MANIFEST.json`);
  }
  if (manifestEntry.sizeBytes !== expectedSizeBytes) {
    fail(
      `${label} sizeBytes differs from ASSET_MANIFEST.json: ` +
        `registry=${expectedSizeBytes}, manifest=${String(manifestEntry.sizeBytes)}`,
    );
  }
  if (
    maxSizeBytes !== undefined &&
    (!Number.isSafeInteger(expectedSizeBytes) ||
      expectedSizeBytes <= 0 ||
      expectedSizeBytes > maxSizeBytes)
  ) {
    fail(`${label} exceeds the ${String(maxSizeBytes)} byte size limit`);
  }

  const bytes = await readStableRepositoryFile({
    repositoryRoot,
    repositoryPath,
    label,
    hooks,
    maxSizeBytes,
  });
  if (bytes.byteLength !== expectedSizeBytes) {
    fail(
      `${label} sizeBytes differs: ` +
        `registry=${expectedSizeBytes}, file=${bytes.byteLength}`,
    );
  }
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256) {
    fail(`${label} SHA-256 differs from the stored file`);
  }
  return bytes;
}

function assertLicenseText(bytes: Buffer, label: string): void {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} must be valid UTF-8 text`);
  }
  if (
    text.trim().length === 0 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)
  ) {
    fail(`${label} must be non-empty text without binary control bytes`);
  }
}

function normalizedRolePath(repositoryPath: string): string {
  return path.posix.normalize(repositoryPath.replaceAll("\\", "/"));
}

function assertDistinctRolePaths(
  artifactId: string,
  rolePaths: ReadonlyArray<readonly [string, string]>,
): void {
  const roleByPath = new Map<string, string>();
  for (const [role, repositoryPath] of rolePaths) {
    const normalizedPath = normalizedRolePath(repositoryPath);
    const existingRole = roleByPath.get(normalizedPath);
    if (existingRole !== undefined) {
      fail(
        `${artifactId} ${role} must not reuse the file path assigned to ${existingRole}`,
      );
    }
    roleByPath.set(normalizedPath, role);
  }
}

function imageDimensions(
  bytes: Buffer,
  label: string,
): {
  width: number;
  height: number;
} {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    bytes.length >= 24 &&
    bytes.subarray(0, pngSignature.length).equals(pngSignature) &&
    bytes.toString("ascii", 12, 16) === "IHDR"
  ) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const startOfFrameMarkers = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
      0xcf,
    ]);
    let offset = 2;
    while (offset < bytes.length) {
      while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) break;
      const marker = bytes[offset];
      offset += 1;
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        continue;
      }
      if (offset + 2 > bytes.length) break;
      const segmentLength = bytes.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
        return {
          width: bytes.readUInt16BE(offset + 5),
          height: bytes.readUInt16BE(offset + 3),
        };
      }
      offset += segmentLength;
    }
  }

  if (
    bytes.length >= 30 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = bytes.toString("ascii", 12, 16);
    if (chunkType === "VP8X") {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunkType === "VP8L" && bytes[20] === 0x2f && bytes.length >= 25) {
      return {
        width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
        height:
          1 +
          ((bytes[22] & 0xc0) >> 6) +
          (bytes[23] << 2) +
          ((bytes[24] & 0x0f) << 10),
      };
    }
    if (
      chunkType === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  fail(`${label} is not a readable PNG, JPEG, or WebP image`);
}

async function verifyVideoMediaFiles({
  repositoryRoot,
  artifacts,
  manifestByPath,
  hooks,
}: {
  repositoryRoot: string;
  artifacts: readonly VideoArtifact[];
  manifestByPath: ReadonlyMap<string, ArtifactManifestEntry>;
  hooks?: ArtifactAssetVerificationHooks;
}): Promise<number> {
  let checked = 0;
  for (const artifact of artifacts) {
    const rolePaths: Array<readonly [string, string]> = [];
    const roleSourcePaths: Array<readonly [string, string]> = [];
    if (artifact.license?.href) {
      rolePaths.push([
        "license",
        publicHrefToRepositoryPath(
          artifact.license.href,
          `${artifact.id} license.href`,
        ),
      ]);
      roleSourcePaths.push(["license", artifact.license.sourcePath]);
    }
    for (const [role, file] of Object.entries(artifact.mediaFiles) as Array<
      [keyof VideoArtifact["mediaFiles"], OpenSourceMediaFile]
    >) {
      rolePaths.push([role, file.path]);
      roleSourcePaths.push([role, file.sourcePath]);
    }
    assertDistinctRolePaths(artifact.id, rolePaths);
    assertDistinctRolePaths(artifact.id, roleSourcePaths);
    for (const [role, file] of Object.entries(artifact.mediaFiles) as Array<
      [string, OpenSourceMediaFile]
    >) {
      const manifestEntry = requireManifestEntry(
        manifestByPath,
        file.path,
        `${artifact.id} ${role}`,
      );
      assertPinnedManifestSource({
        artifact,
        entry: manifestEntry,
        label: `${artifact.id} ${role}`,
        expectedSourcePath: file.sourcePath,
      });
      assertArtifactRedistribution(artifact, manifestEntry, role);
      await readVerifiedFile({
        repositoryRoot,
        repositoryPath: file.path,
        label: `${artifact.id} ${role}`,
        expectedSha256: file.sha256,
        expectedSizeBytes: file.sizeBytes,
        manifestByPath,
        hooks,
        maxSizeBytes: OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES[role],
      });
      checked += 1;
    }
  }
  return checked;
}

/** Backward-compatible verifier for video media files. */
export async function verifyArtifactAssets({
  repositoryRoot,
  artifacts,
  manifest,
  hooks,
}: {
  repositoryRoot: string;
  artifacts: readonly VideoArtifact[];
  manifest: ArtifactManifest;
  hooks?: ArtifactAssetVerificationHooks;
}): Promise<number> {
  return verifyVideoMediaFiles({
    repositoryRoot,
    artifacts,
    manifestByPath: indexManifest(manifest),
    hooks,
  });
}

/**
 * End-to-end candidate gate for every registered license, every future
 * tool/project screenshot, and every video media file. Callers must pass the
 * unfiltered candidate registry so draft and withdrawn records cannot bypass
 * asset integrity checks.
 */
export async function verifyArtifactPublicationAssets({
  repositoryRoot,
  artifacts,
  manifest,
  hooks,
}: {
  repositoryRoot: string;
  artifacts: readonly OpenSourceArtifact[];
  manifest: ArtifactManifest;
  hooks?: ArtifactAssetVerificationHooks;
}): Promise<ArtifactVerificationSummary> {
  const manifestByPath = indexManifest(manifest);
  const summary: ArtifactVerificationSummary = {
    licenses: 0,
    screenshots: 0,
    mediaFiles: 0,
  };

  for (const artifact of artifacts) {
    const licensePath = publicHrefToRepositoryPath(
      artifact.license.href,
      `${artifact.id} license.href`,
    );
    const licenseManifestEntry = requireManifestEntry(
      manifestByPath,
      licensePath,
      `${artifact.id} license`,
    );
    assertPinnedManifestSource({
      artifact,
      entry: licenseManifestEntry,
      label: `${artifact.id} license`,
      expectedSourcePath: artifact.license.sourcePath,
    });
    const licenseBytes = await readVerifiedFile({
      repositoryRoot,
      repositoryPath: licensePath,
      label: `${artifact.id} license`,
      expectedSha256: artifact.license.sha256,
      expectedSizeBytes: artifact.license.sizeBytes,
      manifestByPath,
      hooks,
      maxSizeBytes: OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES,
    });
    assertLicenseText(licenseBytes, `${artifact.id} license`);
    summary.licenses += 1;

    if (artifact.kind === "tool" || artifact.kind === "project") {
      const screenshot = artifact.guide.screenshot;
      const screenshotPath = publicHrefToRepositoryPath(
        screenshot.src,
        `${artifact.id} guide.screenshot.src`,
      );
      assertDistinctRolePaths(artifact.id, [
        ["license", licensePath],
        ["screenshot", screenshotPath],
      ]);
      assertDistinctRolePaths(artifact.id, [
        ["upstream license", artifact.license.sourcePath],
        ["upstream screenshot", screenshot.sourcePath],
      ]);
      const screenshotManifestEntry = requireManifestEntry(
        manifestByPath,
        screenshotPath,
        `${artifact.id} screenshot`,
      );
      assertPinnedManifestSource({
        artifact,
        entry: screenshotManifestEntry,
        label: `${artifact.id} screenshot`,
        expectedSourcePath: screenshot.sourcePath,
      });
      assertArtifactRedistribution(
        artifact,
        screenshotManifestEntry,
        "screenshot",
      );
      const bytes = await readVerifiedFile({
        repositoryRoot,
        repositoryPath: screenshotPath,
        label: `${artifact.id} screenshot`,
        expectedSha256: screenshot.sha256,
        expectedSizeBytes: screenshot.sizeBytes,
        manifestByPath,
        hooks,
        maxSizeBytes: OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES,
      });
      const actualDimensions = imageDimensions(
        bytes,
        `${artifact.id} screenshot`,
      );
      if (
        actualDimensions.width !== screenshot.width ||
        actualDimensions.height !== screenshot.height
      ) {
        fail(
          `${artifact.id} screenshot dimensions differ: ` +
            `registry=${screenshot.width}x${screenshot.height}, ` +
            `file=${actualDimensions.width}x${actualDimensions.height}`,
        );
      }
      summary.screenshots += 1;
    }
  }

  summary.mediaFiles = await verifyVideoMediaFiles({
    repositoryRoot,
    artifacts: artifacts.filter(
      (artifact): artifact is VideoArtifact => artifact.kind === "video",
    ),
    manifestByPath,
    hooks,
  });
  return summary;
}

async function main(): Promise<void> {
  const manifest = parseArtifactManifest(
    (
      await readStableRepositoryFile({
        repositoryRoot: defaultRepositoryRoot,
        repositoryPath: "ASSET_MANIFEST.json",
        label: "ASSET_MANIFEST.json",
      })
    ).toString("utf8"),
  );
  const summary = await verifyArtifactPublicationAssets({
    repositoryRoot: defaultRepositoryRoot,
    artifacts: OPEN_SOURCE_ARTIFACT_CANDIDATES,
    manifest,
  });
  process.stdout.write(
    "Artifact candidate asset verification passed: " +
      `${summary.licenses} licenses, ${summary.screenshots} tool/project screenshots, ` +
      `${summary.mediaFiles} video files.\n`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
