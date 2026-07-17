#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  type OpenSourceArtifact,
  type OpenSourceMediaFile,
  type VideoArtifact,
} from "../packages/simplified-website/src/lib/open-source/artifacts";

const defaultRepositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const PUBLIC_DIRECTORY = "packages/simplified-website/public";

export type ArtifactManifestEntry = {
  path: string;
  sha256: string;
  sizeBytes?: number;
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

async function readVerifiedFile({
  repositoryRoot,
  repositoryPath,
  label,
  expectedSha256,
  expectedSizeBytes,
  manifestByPath,
}: {
  repositoryRoot: string;
  repositoryPath: string;
  label: string;
  expectedSha256: string;
  expectedSizeBytes: number;
  manifestByPath: ReadonlyMap<string, ArtifactManifestEntry>;
}): Promise<Buffer> {
  const manifestEntry = manifestByPath.get(repositoryPath);
  if (!manifestEntry) {
    fail(`${label} is absent from ASSET_MANIFEST.json (${repositoryPath})`);
  }
  if (manifestEntry.sha256 !== expectedSha256) {
    fail(`${label} SHA-256 differs from ASSET_MANIFEST.json`);
  }
  if (manifestEntry.sizeBytes !== expectedSizeBytes) {
    fail(
      `${label} sizeBytes differs from ASSET_MANIFEST.json: ` +
        `registry=${expectedSizeBytes}, manifest=${String(manifestEntry.sizeBytes)}`,
    );
  }

  const root = await realpath(path.resolve(repositoryRoot)).catch(() => null);
  if (!root) fail("repository root does not exist");
  const absolutePath = path.resolve(root, repositoryPath);
  const relativePath = path.relative(root, absolutePath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    fail(`${label} path escapes the repository`);
  }

  const info = await lstat(absolutePath).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) {
    fail(`${label} must resolve to a regular non-symlink file`);
  }
  const resolvedPath = await realpath(absolutePath).catch(() => null);
  const resolvedRelativePath = resolvedPath
    ? path.relative(root, resolvedPath)
    : "..";
  if (
    !resolvedPath ||
    resolvedRelativePath === ".." ||
    resolvedRelativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(resolvedRelativePath)
  ) {
    fail(`${label} must resolve inside the repository`);
  }
  if (info.size !== expectedSizeBytes) {
    fail(
      `${label} sizeBytes differs: ` +
        `registry=${expectedSizeBytes}, file=${info.size}`,
    );
  }

  const bytes = await readFile(absolutePath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256) {
    fail(`${label} SHA-256 differs from the stored file`);
  }
  return bytes;
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
}: {
  repositoryRoot: string;
  artifacts: readonly VideoArtifact[];
  manifestByPath: ReadonlyMap<string, ArtifactManifestEntry>;
}): Promise<number> {
  let checked = 0;
  for (const artifact of artifacts) {
    for (const [role, file] of Object.entries(artifact.mediaFiles) as Array<
      [string, OpenSourceMediaFile]
    >) {
      await readVerifiedFile({
        repositoryRoot,
        repositoryPath: file.path,
        label: `${artifact.id} ${role}`,
        expectedSha256: file.sha256,
        expectedSizeBytes: file.sizeBytes,
        manifestByPath,
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
}: {
  repositoryRoot: string;
  artifacts: readonly VideoArtifact[];
  manifest: ArtifactManifest;
}): Promise<number> {
  return verifyVideoMediaFiles({
    repositoryRoot,
    artifacts,
    manifestByPath: indexManifest(manifest),
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
}: {
  repositoryRoot: string;
  artifacts: readonly OpenSourceArtifact[];
  manifest: ArtifactManifest;
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
    await readVerifiedFile({
      repositoryRoot,
      repositoryPath: licensePath,
      label: `${artifact.id} license`,
      expectedSha256: artifact.license.sha256,
      expectedSizeBytes: artifact.license.sizeBytes,
      manifestByPath,
    });
    summary.licenses += 1;

    if (artifact.kind === "tool" || artifact.kind === "project") {
      const screenshot = artifact.guide.screenshot;
      const screenshotPath = publicHrefToRepositoryPath(
        screenshot.src,
        `${artifact.id} guide.screenshot.src`,
      );
      const bytes = await readVerifiedFile({
        repositoryRoot,
        repositoryPath: screenshotPath,
        label: `${artifact.id} screenshot`,
        expectedSha256: screenshot.sha256,
        expectedSizeBytes: screenshot.sizeBytes,
        manifestByPath,
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
  });
  return summary;
}

async function main(): Promise<void> {
  const manifest = parseArtifactManifest(
    await readFile(
      path.join(defaultRepositoryRoot, "ASSET_MANIFEST.json"),
      "utf8",
    ),
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
