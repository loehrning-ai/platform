import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rename,
  rm,
  symlink,
  truncate,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type {
  OpenSourceArtifact,
  ToolArtifact,
  VideoArtifact,
} from "../../packages/website/src/lib/open-source/artifacts";
import {
  OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES,
  OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES,
  OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES,
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

type VideoMediaRole = keyof VideoArtifact["mediaFiles"];

const VIDEO_MEDIA_EXTENSIONS: Record<VideoMediaRole, string> = {
  video: "mp4",
  captions: "vtt",
  transcript: "txt",
  poster: "png",
};

async function fixture(role: VideoMediaRole = "video") {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "artifact-assets-"));
  roots.push(repositoryRoot);
  const extension = VIDEO_MEDIA_EXTENSIONS[role];
  const relativePath = `packages/website/public/media/example-${role}.${extension}`;
  const absolutePath = path.join(repositoryRoot, relativePath);
  const content = Buffer.from(`example-${role}-bytes`);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
  const sha256 = createHash("sha256").update(content).digest("hex");
  const file = {
    path: relativePath,
    sourcePath: `media/example-${role}.${extension}`,
    sha256,
    sizeBytes: content.byteLength,
  };
  const revision = "a".repeat(40);
  const artifact = {
    id: "video:example",
    license: {
      href: "/artifacts/videos/example-video/LICENSE.txt",
      sourcePath: "LICENSE",
    },
    source: {
      href: "https://github.com/loehrning-ai/example-video",
      revision,
    },
    mediaFiles: { [role]: file },
  } as unknown as VideoArtifact;
  const manifest: ArtifactManifest = {
    version: 1,
    assets: [
      {
        ...file,
        source: `https://github.com/loehrning-ai/example-video/blob/${revision}/${file.sourcePath}`,
        redistributionLicenseHref: artifact.license.href,
      },
    ],
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
    "packages/website/public/artifacts/tools/example-tool/LICENSE.txt";
  const licenseBytes = Buffer.from("MIT fixture license\n");
  const screenshotPath =
    "packages/website/public/artifacts/tools/example-tool/screenshot.png";
  const screenshotBytes = pngHeader(640, 360);
  const demoPath =
    "packages/website/public/artifacts/tools/example-tool/demo/step-01.png";
  const demoBytes = pngHeader(800, 500);
  await mkdir(path.join(repositoryRoot, path.dirname(licensePath)), {
    recursive: true,
  });
  await mkdir(path.join(repositoryRoot, path.dirname(screenshotPath)), {
    recursive: true,
  });
  await mkdir(path.join(repositoryRoot, path.dirname(demoPath)), {
    recursive: true,
  });
  await writeFile(path.join(repositoryRoot, licensePath), licenseBytes);
  await writeFile(path.join(repositoryRoot, screenshotPath), screenshotBytes);
  await writeFile(path.join(repositoryRoot, demoPath), demoBytes);

  const licenseSha256 = createHash("sha256").update(licenseBytes).digest("hex");
  const screenshotSha256 = createHash("sha256")
    .update(screenshotBytes)
    .digest("hex");
  const demoSha256 = createHash("sha256").update(demoBytes).digest("hex");
  const revision = "b".repeat(40);
  const artifact = {
    id: "tool:example-tool",
    kind: "tool",
    publicationLifecycle: "published",
    source: {
      href: "https://github.com/loehrning-ai/example-tool",
      revision,
      revisionHref: `https://github.com/loehrning-ai/example-tool/commit/${revision}`,
    },
    license: {
      href: "/artifacts/tools/example-tool/LICENSE.txt",
      sourcePath: "LICENSE",
      sha256: licenseSha256,
      sizeBytes: licenseBytes.byteLength,
    },
    guide: {
      screenshot: {
        src: "/artifacts/tools/example-tool/screenshot.png",
        sourcePath: "docs/screenshot.png",
        sha256: screenshotSha256,
        sizeBytes: screenshotBytes.byteLength,
        width: 640,
        height: 360,
      },
      demo: [
        {
          src: "/artifacts/tools/example-tool/demo/step-01.png",
          sourcePath: "docs/screenshots/step-01.png",
          alt: "The example tool mid-run.",
          caption: "Run the tool.",
          sha256: demoSha256,
          sizeBytes: demoBytes.byteLength,
          width: 800,
          height: 500,
        },
      ],
    },
  } as unknown as ToolArtifact;
  const manifest: ArtifactManifest = {
    version: 1,
    assets: [
      {
        path: licensePath,
        sha256: licenseSha256,
        sizeBytes: licenseBytes.byteLength,
        source: `https://github.com/loehrning-ai/example-tool/blob/${revision}/LICENSE`,
      },
      {
        path: screenshotPath,
        sha256: screenshotSha256,
        sizeBytes: screenshotBytes.byteLength,
        source: `https://raw.githubusercontent.com/loehrning-ai/example-tool/${revision}/docs/screenshot.png`,
        redistribution: "Permitted under the artifact license.",
        redistributionLicenseHref: "/artifacts/tools/example-tool/LICENSE.txt",
      },
      {
        path: demoPath,
        sha256: demoSha256,
        sizeBytes: demoBytes.byteLength,
        source: `https://raw.githubusercontent.com/loehrning-ai/example-tool/${revision}/docs/screenshots/step-01.png`,
        redistribution: "Permitted under the artifact license.",
        redistributionLicenseHref: "/artifacts/tools/example-tool/LICENSE.txt",
      },
    ],
  };
  return {
    artifact,
    demoBytes,
    demoPath,
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

  it("requires video manifest sources to use the pinned repository and SHA", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    for (const source of [
      undefined,
      "https://github.com/loehrning-ai/example-video",
      `https://github.com/loehrning-ai/other-video/blob/${artifact.source.revision}/media/example.mp4`,
      `https://github.com/loehrning-ai/example-video/blob/${"c".repeat(40)}/media/example.mp4`,
    ]) {
      const changedManifest = {
        ...manifest,
        assets: manifest.assets.map((entry) => ({ ...entry, source })),
      };
      await expect(
        verifyArtifactAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest: changedManifest,
        }),
      ).rejects.toThrow(/manifest source/);
    }
  });

  it("requires every video media role to use the artifact license href exactly", async () => {
    for (const role of [
      "video",
      "captions",
      "transcript",
      "poster",
    ] as const) {
      const { artifact, manifest, repositoryRoot } = await fixture(role);
      await expect(
        verifyArtifactAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest,
        }),
      ).resolves.toBe(1);
      for (const redistributionLicenseHref of [
        undefined,
        "/artifacts/videos/another-video/LICENSE.txt",
        "artifacts/videos/example-video/LICENSE.txt",
        `${artifact.license.href}?lookalike=1`,
        `prefix${artifact.license.href}suffix`,
      ]) {
        await expect(
          verifyArtifactAssets({
            repositoryRoot,
            artifacts: [artifact],
            manifest: {
              ...manifest,
              assets: manifest.assets.map((entry) => ({
                ...entry,
                redistributionLicenseHref,
              })),
            },
          }),
        ).rejects.toThrow(
          new RegExp(`${role} redistributionLicenseHref must exactly equal`),
        );
      }
    }
  });

  it("binds every video manifest source to its declared upstream path", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    for (const source of [
      `https://github.com/loehrning-ai/example-video/blob/${artifact.source.revision}/media/another.mp4`,
      `https://github.com/loehrning-ai/example-video/blob/${artifact.source.revision}/media%2Fexample.mp4`,
    ]) {
      await expect(
        verifyArtifactAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest: {
            ...manifest,
            assets: manifest.assets.map((entry) => ({ ...entry, source })),
          },
        }),
      ).rejects.toThrow(/manifest source/);
    }
  });

  it("rejects a local file reused by multiple media roles", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const aliasedArtifact = {
      ...artifact,
      mediaFiles: {
        ...artifact.mediaFiles,
        poster: artifact.mediaFiles.video,
      },
    } as unknown as VideoArtifact;
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [aliasedArtifact],
        manifest,
      }),
    ).rejects.toThrow(/must not reuse the file path/);
  });

  it("rejects an upstream file reused by multiple media roles", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const aliasedArtifact = {
      ...artifact,
      mediaFiles: {
        ...artifact.mediaFiles,
        poster: {
          ...artifact.mediaFiles.video,
          path: "packages/website/public/media/example-poster.png",
          sourcePath: artifact.mediaFiles.video.sourcePath,
        },
      },
    } as VideoArtifact;
    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [aliasedArtifact],
        manifest,
      }),
    ).rejects.toThrow(/must not reuse the file path/);
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

  it("rejects a final-component symlink swap after opening", async () => {
    const { artifact, content, manifest, repositoryRoot } = await fixture();
    const targetPath = path.join(repositoryRoot, "replacement.mp4");
    await writeFile(targetPath, content);

    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest,
        hooks: {
          afterOpen: async ({ absolutePath }) => {
            await rm(absolutePath);
            await symlink(targetPath, absolutePath);
          },
        },
      }),
    ).rejects.toThrow(/symbolic-link path components|pathname/);
  });

  it("rejects same-size mutation inside the descriptor read window", async () => {
    const { artifact, content, manifest, repositoryRoot } = await fixture();

    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest,
        hooks: {
          afterRead: async ({ absolutePath }) => {
            await writeFile(
              absolutePath,
              Buffer.alloc(content.byteLength, 0x79),
            );
            await utimes(absolutePath, new Date(1_000), new Date(2_000));
          },
        },
      }),
    ).rejects.toThrow(/changed while it was being verified/);
  });

  it("rejects an artifact path routed through a symlinked parent", async () => {
    const { artifact, content, manifest, repositoryRoot } = await fixture();
    const outsideRoot = await mkdtemp(
      path.join(tmpdir(), "artifact-assets-outside-"),
    );
    roots.push(outsideRoot);
    const outsidePath = path.join(outsideRoot, "outside.mp4");
    await writeFile(outsidePath, content);

    const linkedParent = path.join(
      repositoryRoot,
      "packages/website/public/linked",
    );
    await mkdir(path.dirname(linkedParent), { recursive: true });
    await symlink(outsideRoot, linkedParent, "dir");

    const linkedRepositoryPath = "packages/website/public/linked/outside.mp4";
    const linkedArtifact = {
      ...artifact,
      mediaFiles: {
        ...artifact.mediaFiles,
        video: {
          ...artifact.mediaFiles.video,
          path: linkedRepositoryPath,
        },
      },
    };
    const linkedManifest = {
      ...manifest,
      assets: manifest.assets.map((entry) => ({
        ...entry,
        path: linkedRepositoryPath,
      })),
    };

    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [linkedArtifact],
        manifest: linkedManifest,
      }),
    ).rejects.toThrow(/symbolic-link path components|inside the repository/);
  });

  it("rejects parent-directory replacement after opening", async () => {
    const { artifact, content, manifest, repositoryRoot } = await fixture();
    const outsideRoot = await mkdtemp(
      path.join(tmpdir(), "artifact-assets-parent-swap-"),
    );
    roots.push(outsideRoot);
    await writeFile(path.join(outsideRoot, "example.mp4"), content);

    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest,
        hooks: {
          afterOpen: async ({ absolutePath }) => {
            const parentPath = path.dirname(absolutePath);
            await rename(parentPath, `${parentPath}.original`);
            await symlink(outsideRoot, parentPath, "dir");
          },
        },
      }),
    ).rejects.toThrow(
      /symbolic-link path components|pathname|inside the repository/,
    );
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

  it("bounds video descriptor reads before hashing", async () => {
    const { artifact, manifest, repositoryRoot } = await fixture();
    const oversizedSize = OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES.video + 1;
    await truncate(
      path.join(repositoryRoot, artifact.mediaFiles.video.path),
      oversizedSize,
    );
    const oversizedArtifact = {
      ...artifact,
      mediaFiles: {
        ...artifact.mediaFiles,
        video: {
          ...artifact.mediaFiles.video,
          sizeBytes: oversizedSize,
        },
      },
    };
    const oversizedManifest = {
      ...manifest,
      assets: manifest.assets.map((entry) => ({
        ...entry,
        sizeBytes: oversizedSize,
      })),
    };

    await expect(
      verifyArtifactAssets({
        repositoryRoot,
        artifacts: [oversizedArtifact],
        manifest: oversizedManifest,
      }),
    ).rejects.toThrow(/size limit/);
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
    ).resolves.toEqual({
      licenses: 1,
      screenshots: 1,
      demoFrames: 1,
      mediaFiles: 0,
    });
  });

  it("rejects tampered demo frame bytes", async () => {
    const { artifact, manifest, repositoryRoot, demoPath, demoBytes } =
      await publicationFixture();
    await writeFile(
      path.join(repositoryRoot, demoPath),
      Buffer.alloc(demoBytes.byteLength, 0x79),
    );

    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest,
      }),
    ).rejects.toThrow(/demo\[0\]/);
  });

  it("rejects a demo frame whose manifest source is not pinned to the artifact revision", async () => {
    const { artifact, manifest, repositoryRoot, demoPath } =
      await publicationFixture();
    const driftedManifest = {
      ...manifest,
      assets: manifest.assets.map((entry) =>
        entry.path === demoPath
          ? {
              ...entry,
              source: `https://raw.githubusercontent.com/loehrning-ai/example-tool/${"c".repeat(40)}/docs/screenshots/step-01.png`,
            }
          : entry,
      ),
    };

    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest: driftedManifest,
      }),
    ).rejects.toThrow(/pinned SHA/);
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

  it("binds license and screenshot manifest sources to the artifact pin", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    const licenseEntry = manifest.assets[0];
    const screenshotEntry = manifest.assets[1];

    for (const source of [
      "https://github.com/loehrning-ai/example-tool/blob/main/LICENSE",
      `https://github.com/loehrning-ai/other-tool/blob/${artifact.source.revision}/LICENSE`,
      `https://github.com/loehrning-ai/example-tool/blob/${artifact.source.revision}/COPYING`,
    ]) {
      await expect(
        verifyArtifactPublicationAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest: {
            ...manifest,
            assets: [{ ...licenseEntry, source }, screenshotEntry],
          },
        }),
      ).rejects.toThrow(/license manifest source/);
    }

    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [artifact],
        manifest: {
          ...manifest,
          assets: [
            licenseEntry,
            {
              ...screenshotEntry,
              source: `https://raw.githubusercontent.com/loehrning-ai/example-tool/${"c".repeat(40)}/docs/screenshot.png`,
            },
          ],
        },
      }),
    ).rejects.toThrow(/screenshot manifest source/);

    for (const source of [
      `https://raw.githubusercontent.com/loehrning-ai/example-tool/${artifact.source.revision}/docs/another.png`,
      `https://raw.githubusercontent.com/loehrning-ai/example-tool/${artifact.source.revision}/docs%2Fscreenshot.png`,
    ]) {
      await expect(
        verifyArtifactPublicationAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest: {
            ...manifest,
            assets: [
              licenseEntry,
              {
                ...screenshotEntry,
                source,
              },
            ],
          },
        }),
      ).rejects.toThrow(/screenshot manifest source/);
    }
  });

  it("requires an exact structured screenshot redistribution license href", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    for (const redistributionLicenseHref of [
      undefined,
      "/artifacts/tools/another-tool/LICENSE.txt",
      "public/artifacts/tools/example-tool/LICENSE.txt",
      "/artifacts/tools/example-tool/LICENSE.txt?lookalike=1",
      `prefix${artifact.license.href}suffix`,
    ]) {
      await expect(
        verifyArtifactPublicationAssets({
          repositoryRoot,
          artifacts: [artifact],
          manifest: {
            ...manifest,
            assets: manifest.assets.map((entry) =>
              entry.path.endsWith("screenshot.png")
                ? { ...entry, redistributionLicenseHref }
                : entry,
            ),
          },
        }),
      ).rejects.toThrow(/redistributionLicenseHref/);
    }
  });

  it("rejects license and screenshot role aliasing before reading bytes", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    const aliasedArtifact = {
      ...artifact,
      guide: {
        ...artifact.guide,
        screenshot: {
          ...artifact.guide.screenshot,
          src: artifact.license.href,
        },
      },
    } as OpenSourceArtifact;
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [aliasedArtifact],
        manifest,
      }),
    ).rejects.toThrow(/must not reuse the file path/);
  });

  it("rejects upstream license and screenshot role aliasing before reading bytes", async () => {
    const { artifact, manifest, repositoryRoot } = await publicationFixture();
    const aliasedArtifact = {
      ...artifact,
      guide: {
        ...artifact.guide,
        screenshot: {
          ...artifact.guide.screenshot,
          sourcePath: artifact.license.sourcePath,
        },
      },
    } as OpenSourceArtifact;
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot,
        artifacts: [aliasedArtifact],
        manifest,
      }),
    ).rejects.toThrow(/must not reuse the file path/);
  });

  it("accepts only bounded, fatal UTF-8 license text without binary controls", async () => {
    for (const invalidBytes of [
      Buffer.from([0xff, 0xfe, 0xfd]),
      Buffer.from("MIT\u0000license\n"),
      Buffer.from("MIT\u0007license\n"),
    ]) {
      const fixture = await publicationFixture();
      const sha256 = createHash("sha256").update(invalidBytes).digest("hex");
      await writeFile(
        path.join(fixture.repositoryRoot, fixture.licensePath),
        invalidBytes,
      );
      const artifact = {
        ...fixture.artifact,
        license: {
          ...fixture.artifact.license,
          sha256,
          sizeBytes: invalidBytes.byteLength,
        },
      };
      const manifest = {
        ...fixture.manifest,
        assets: fixture.manifest.assets.map((entry) =>
          entry.path === fixture.licensePath
            ? {
                ...entry,
                sha256,
                sizeBytes: invalidBytes.byteLength,
              }
            : entry,
        ),
      };
      await expect(
        verifyArtifactPublicationAssets({
          repositoryRoot: fixture.repositoryRoot,
          artifacts: [artifact],
          manifest,
        }),
      ).rejects.toThrow(/valid UTF-8 text|binary control bytes/);
    }

    const oversizedFixture = await publicationFixture();
    const oversizedBytes = Buffer.alloc(
      OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES + 1,
      0x61,
    );
    const oversizedSha256 = createHash("sha256")
      .update(oversizedBytes)
      .digest("hex");
    await writeFile(
      path.join(oversizedFixture.repositoryRoot, oversizedFixture.licensePath),
      oversizedBytes,
    );
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: oversizedFixture.repositoryRoot,
        artifacts: [
          {
            ...oversizedFixture.artifact,
            license: {
              ...oversizedFixture.artifact.license,
              sha256: oversizedSha256,
              sizeBytes: oversizedBytes.byteLength,
            },
          },
        ],
        manifest: {
          ...oversizedFixture.manifest,
          assets: oversizedFixture.manifest.assets.map((entry) =>
            entry.path === oversizedFixture.licensePath
              ? {
                  ...entry,
                  sha256: oversizedSha256,
                  sizeBytes: oversizedBytes.byteLength,
                }
              : entry,
          ),
        },
      }),
    ).rejects.toThrow(/size limit/);
  });

  it("bounds a license that grows after its descriptor is opened", async () => {
    const fixture = await publicationFixture();
    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: fixture.repositoryRoot,
        artifacts: [fixture.artifact],
        manifest: fixture.manifest,
        hooks: {
          afterOpen: async ({ absolutePath, label }) => {
            if (label.endsWith(" license")) {
              await writeFile(
                absolutePath,
                Buffer.alloc(OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES + 1, 0x61),
              );
            }
          },
        },
      }),
    ).rejects.toThrow(/size limit/);
  });

  it("bounds screenshot descriptor reads before decoding", async () => {
    const fixture = await publicationFixture();
    const oversizedSize = OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES + 1;
    await truncate(
      path.join(fixture.repositoryRoot, fixture.screenshotPath),
      oversizedSize,
    );
    const artifact = {
      ...fixture.artifact,
      guide: {
        ...fixture.artifact.guide,
        screenshot: {
          ...fixture.artifact.guide.screenshot,
          sizeBytes: oversizedSize,
        },
      },
    };
    const manifest = {
      ...fixture.manifest,
      assets: fixture.manifest.assets.map((entry) =>
        entry.path === fixture.screenshotPath
          ? { ...entry, sizeBytes: oversizedSize }
          : entry,
      ),
    };

    await expect(
      verifyArtifactPublicationAssets({
        repositoryRoot: fixture.repositoryRoot,
        artifacts: [artifact],
        manifest,
      }),
    ).rejects.toThrow(/size limit/);
  });
});
