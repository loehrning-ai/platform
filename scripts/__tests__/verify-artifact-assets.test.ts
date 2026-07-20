import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type {
  OpenSourceArtifact,
  ToolArtifact,
  VideoArtifact,
} from "../../packages/website/src/lib/open-source/artifacts";
import {
  type ArtifactManifest,
  verifyArtifactAssets,
  verifyArtifactPublicationAssets,
} from "../verify-artifact-assets";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function fixture() {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "artifact-assets-"));
  roots.push(repositoryRoot);
  const relativePath = "packages/website/public/media/example.mp4";
  const absolutePath = path.join(repositoryRoot, relativePath);
  const content = Buffer.from("example-video-bytes");
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
  const sha256 = createHash("sha256").update(content).digest("hex");
  const file = { path: relativePath, sha256, sizeBytes: content.byteLength };
  const artifact = {
    id: "video:example",
    mediaFiles: { video: file },
  } as unknown as VideoArtifact;
  const manifest: ArtifactManifest = {
    version: 1,
    assets: [{ ...file }],
  };
  return { artifact, content, manifest, repositoryRoot };
}

function pngHeader(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function publicationFixture() {
  const repositoryRoot = await mkdtemp(
    path.join(tmpdir(), "artifact-publication-"),
  );
  roots.push(repositoryRoot);

  const licensePath =
    "packages/website/public/licenses/example-tool-MIT.txt";
  const licenseBytes = Buffer.from("MIT fixture license\n");
  const screenshotPath =
    "packages/website/public/tool-screenshots/example-tool.png";
  const screenshotBytes = pngHeader(640, 360);
  await mkdir(path.join(repositoryRoot, path.dirname(licensePath)), {
    recursive: true,
  });
  await mkdir(path.join(repositoryRoot, path.dirname(screenshotPath)), {
    recursive: true,
  });
  await writeFile(path.join(repositoryRoot, licensePath), licenseBytes);
  await writeFile(path.join(repositoryRoot, screenshotPath), screenshotBytes);

  const licenseSha256 = createHash("sha256").update(licenseBytes).digest("hex");
  const screenshotSha256 = createHash("sha256")
    .update(screenshotBytes)
    .digest("hex");
  const artifact = {
    id: "tool:example-tool",
    kind: "tool",
    publicationLifecycle: "published",
    license: {
      href: "/licenses/example-tool-MIT.txt",
      sha256: licenseSha256,
      sizeBytes: licenseBytes.byteLength,
    },
    guide: {
      screenshot: {
        src: "/tool-screenshots/example-tool.png",
        sha256: screenshotSha256,
        sizeBytes: screenshotBytes.byteLength,
        width: 640,
        height: 360,
      },
    },
  } as unknown as ToolArtifact;
  const manifest: ArtifactManifest = {
    version: 1,
    assets: [
      {
        path: licensePath,
        sha256: licenseSha256,
        sizeBytes: licenseBytes.byteLength,
      },
      {
        path: screenshotPath,
        sha256: screenshotSha256,
        sizeBytes: screenshotBytes.byteLength,
      },
    ],
  };
  return {
    artifact,
    licenseBytes,
    licensePath,
    manifest,
    repositoryRoot,
    screenshotBytes,
    screenshotPath,
  };
}

describe("artifact media integrity", () => {
  it("requires registry, manifest, and stored bytes to agree", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    await expect(
      verifyArtifactAssets({ repositoryRoot, artifacts: [artifact], manifest }),
    ).resolves.toBe(1);
  });

  it("rejects a missing or different manifest sizeBytes value", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const missingSize = {
      ...manifest,
      assets: manifest.assets.map(
        ({ sizeBytes: _sizeBytes, ...entry }) => entry,
      ),
    };
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest: missingSize,
      }),
    ).rejects.toThrow(/sizeBytes differs from ASSET_MANIFEST/);

    const wrongSize = {
      ...manifest,
      assets: manifest.assets.map((entry) => ({ ...entry, sizeBytes: 999 })),
    };
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest: wrongSize,
      }),
    ).rejects.toThrow(/sizeBytes differs from ASSET_MANIFEST/);
  });

  it("rejects a referenced file missing from the asset manifest", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest: { ...manifest, assets: [] },
      }),
    ).rejects.toThrow(/absent from ASSET_MANIFEST/);
  });

  it("rejects content that no longer matches the registered SHA-256", async () => {
    const { artifact, content, manifest, repositoryRoot } = await fixture();
    const filePath = path.join(repositoryRoot, artifact.mediaFiles.video.path);
    await writeFile(filePath, Buffer.alloc(content.byteLength, 0x78));
    await expect(
      verifyArtifactAssets({ repositoryRoot, artifacts: [artifact], manifest }),
    ).rejects.toThrow(/SHA-256 differs from the stored file/);
  });

  it("rejects symlinked media files", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const filePath = path.join(repositoryRoot, artifact.mediaFiles.video.path);
    const targetPath = path.join(repositoryRoot, "target.mp4");
    await writeFile(targetPath, Buffer.from("example-video-bytes"));
    await rm(filePath);
    await symlink(targetPath, filePath);
    await expect(
      verifyArtifactAssets({ repositoryRoot, artifacts: [artifact], manifest }),
    ).rejects.toThrow(/regular non-symlink file/);
  });

  it("rejects repository-escape paths before reading them", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const escapedArtifact = {
      ...artifact,
      mediaFiles: {
        ...artifact.mediaFiles,
        video: { ...artifact.mediaFiles.video, path: "../escape.mp4" },
      },
    };
    const escapedManifest = {
      ...manifest,
      assets: manifest.assets.map((entry) => ({
        ...entry,
        path: "../escape.mp4",
      })),
    };
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [escapedArtifact],
        manifest: escapedManifest,
      }),
    ).rejects.toThrow(/path escapes the repository/);
  });
});

describe("artifact publication integrity", () => {
  it("verifies license bytes and tool/project screenshot bytes and dimensions", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest,
      }),
    ).resolves.toEqual({ licenses: 1, screenshots: 1, mediaFiles: 0 });
  });

  it("rejects tampered license and screenshot bytes", async () => {
    const licenseFixture = await publicationFixture();
    await writeFile(
      path.join(licenseFixture.repositoryRoot, licenseFixture.licensePath),
      Buffer.alloc(licenseFixture.licenseBytes.byteLength, 0x78),
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: licenseFixture.repositoryRoot,
        artifacts: [licenseFixture.artifact],
        manifest: licenseFixture.manifest,
      }),
    ).rejects.toThrow(/license SHA-256 differs from the stored file/);

    const screenshotFixture = await publicationFixture();
    await writeFile(
      path.join(
        screenshotFixture.repositoryRoot,
        screenshotFixture.screenshotPath,
      ),
      Buffer.alloc(screenshotFixture.screenshotBytes.byteLength, 0x78),
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: screenshotFixture.repositoryRoot,
        artifacts: [screenshotFixture.artifact],
        manifest: screenshotFixture.manifest,
      }),
    ).rejects.toThrow(/screenshot SHA-256 differs from the stored file/);
  });

  it("rejects missing or tampered assets for non-published candidates", async () => {
    const draftFixture = await publicationFixture();
    const draftCandidate = {
      ...draftFixture.artifact,
      publicationLifecycle: "draft",
    } as OpenSourceArtifact;
    await rm(path.join(draftFixture.repositoryRoot, draftFixture.licensePath));
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: draftFixture.repositoryRoot,
        artifacts: [draftCandidate],
        manifest: draftFixture.manifest,
      }),
    ).rejects.toThrow(/license must resolve to a regular non-symlink file/);

    const withdrawnFixture = await publicationFixture();
    const withdrawnCandidate = {
      ...withdrawnFixture.artifact,
      publicationLifecycle: "withdrawn",
    } as OpenSourceArtifact;
    await writeFile(
      path.join(
        withdrawnFixture.repositoryRoot,
        withdrawnFixture.screenshotPath,
      ),
      Buffer.alloc(withdrawnFixture.screenshotBytes.byteLength, 0x78),
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: withdrawnFixture.repositoryRoot,
        artifacts: [withdrawnCandidate],
        manifest: withdrawnFixture.manifest,
      }),
    ).rejects.toThrow(/screenshot SHA-256 differs from the stored file/);
  });

  it("rejects missing license and screenshot files", async () => {
    const licenseFixture = await publicationFixture();
    await rm(
      path.join(licenseFixture.repositoryRoot, licenseFixture.licensePath),
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: licenseFixture.repositoryRoot,
        artifacts: [licenseFixture.artifact],
        manifest: licenseFixture.manifest,
      }),
    ).rejects.toThrow(/license must resolve to a regular non-symlink file/);

    const screenshotFixture = await publicationFixture();
    await rm(
      path.join(
        screenshotFixture.repositoryRoot,
        screenshotFixture.screenshotPath,
      ),
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: screenshotFixture.repositoryRoot,
        artifacts: [screenshotFixture.artifact],
        manifest: screenshotFixture.manifest,
      }),
    ).rejects.toThrow(/screenshot must resolve to a regular non-symlink file/);
  });

  it("rejects screenshot dimensions that differ from the catalog", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    const wrongDimensionsArtifact = {
      ...artifact,
      guide: {
        ...artifact.guide,
        screenshot: { ...artifact.guide.screenshot, width: 641 },
      },
    } as OpenSourceArtifact;
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [wrongDimensionsArtifact],
        manifest,
      }),
    ).rejects.toThrow(/screenshot dimensions differ/);
  });
});
