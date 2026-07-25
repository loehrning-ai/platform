import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  assertOpenSourceArtifacts,
  type OpenSourceArtifactSource,
} from "../artifacts";
import { PENDING_CV_ENGINE_ARTIFACT, composeForValidation } from "./cv-engine";

/**
 * The only 40 character hex string in this subtree, and a repository URL named
 * so it can never be mistaken for a published location. The CV Engine repository
 * has not been pushed; this fixture exists purely to drive the validator.
 */
const FIXTURE_SOURCE: OpenSourceArtifactSource = {
  href: "https://github.com/loehrning-ai/fixture-unpublished-repository",
  revision: "a".repeat(40),
  revisionHref: `https://github.com/loehrning-ai/fixture-unpublished-repository/commit/${"a".repeat(40)}`,
};

const REPO_ROOT = resolve(process.cwd(), "..", "..");
const PUBLIC_PREFIX = "packages/website/public";

interface ManifestAsset {
  readonly path: string;
  readonly sizeBytes: number;
  readonly sha256: string;
}

function readManifestAssets(): readonly ManifestAsset[] {
  const manifest = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "ASSET_MANIFEST.json"), "utf8"),
  ) as { readonly assets?: readonly ManifestAsset[] };
  return manifest.assets ?? [];
}

/**
 * Reads the canvas size straight out of the simple lossy VP8 bitstream rather
 * than trusting an image library or the record under test. Layout: "RIFF",
 * file size, "WEBP", "VP8 ", chunk size, a three byte frame tag, the
 * 9d 01 2a start code, then 14 bit width and height.
 */
function decodeWebpDimensions(bytes: Buffer): {
  readonly width: number;
  readonly height: number;
} {
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("VP8 ");
  expect(bytes.readUInt32LE(4) + 8).toBe(bytes.length);
  expect([...bytes.subarray(23, 26)]).toEqual([0x9d, 0x01, 0x2a]);

  return {
    width: bytes.readUInt16LE(26) & 0x3fff,
    height: bytes.readUInt16LE(28) & 0x3fff,
  };
}

describe("pending CV Engine artifact record", () => {
  it("passes the real registry validator once a provenance pin is supplied", () => {
    expect(() =>
      assertOpenSourceArtifacts([composeForValidation(FIXTURE_SOURCE)]),
    ).not.toThrow();
  });

  it("has no source field in which an unverified pin could be written", () => {
    expect(Object.hasOwn(PENDING_CV_ENGINE_ARTIFACT, "source")).toBe(false);
  });

  it("stays out of every candidate lane until the repository is published", () => {
    expect(
      OPEN_SOURCE_ARTIFACT_CANDIDATES.some(
        (artifact) => artifact.id === PENDING_CV_ENGINE_ARTIFACT.id,
      ),
    ).toBe(false);
  });

  it("derives its identity and route from the single slug constant", () => {
    expect(PENDING_CV_ENGINE_ARTIFACT.id).toBe("tool:cv-engine");
    expect(PENDING_CV_ENGINE_ARTIFACT.href).toBe("/open-source/tools/cv-engine");
    expect(PENDING_CV_ENGINE_ARTIFACT.slug).toBe("cv-engine");
  });

  it("matches the bytes and dimensions of both stored assets and their manifest rows", () => {
    const assets = readManifestAssets();

    const licensePath = PENDING_CV_ENGINE_ARTIFACT.license.href;
    const licenseBytes = readFileSync(
      resolve(process.cwd(), `public${licensePath}`),
    );
    expect(createHash("sha256").update(licenseBytes).digest("hex")).toBe(
      PENDING_CV_ENGINE_ARTIFACT.license.sha256,
    );
    expect(licenseBytes.length).toBe(PENDING_CV_ENGINE_ARTIFACT.license.sizeBytes);

    const screenshot = PENDING_CV_ENGINE_ARTIFACT.guide.screenshot;
    const screenshotBytes = readFileSync(
      resolve(process.cwd(), `public${screenshot.src}`),
    );
    expect(createHash("sha256").update(screenshotBytes).digest("hex")).toBe(
      screenshot.sha256,
    );
    expect(screenshotBytes.length).toBe(screenshot.sizeBytes);
    expect(decodeWebpDimensions(screenshotBytes)).toEqual({
      width: screenshot.width,
      height: screenshot.height,
    });

    for (const stored of [
      {
        path: `${PUBLIC_PREFIX}${licensePath}`,
        sha256: PENDING_CV_ENGINE_ARTIFACT.license.sha256,
        sizeBytes: PENDING_CV_ENGINE_ARTIFACT.license.sizeBytes,
      },
      {
        path: `${PUBLIC_PREFIX}${screenshot.src}`,
        sha256: screenshot.sha256,
        sizeBytes: screenshot.sizeBytes,
      },
    ]) {
      const row = assets.find((asset) => asset.path === stored.path);
      expect(row, `missing ASSET_MANIFEST.json row for ${stored.path}`).toBeDefined();
      expect(row?.sha256).toBe(stored.sha256);
      expect(row?.sizeBytes).toBe(stored.sizeBytes);
    }
  });
});
