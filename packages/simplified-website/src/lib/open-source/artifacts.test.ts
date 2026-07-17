import { describe, expect, it } from "vitest";
import {
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY,
  OPEN_SOURCE_ARTIFACT_REGISTRY,
  OPEN_SOURCE_ARTIFACTS,
  OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES,
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  assertOpenSourceArtifacts,
  selectPublishedOpenSourceArtifacts,
  type OpenSourceArtifact,
  type ProjectArtifact,
  type SoftwareArtifactGuide,
  type ToolArtifact,
} from "./artifacts";

// Complete fixtures matching the publication contract. The registry itself is
// deliberately empty until real repositories exist under the loehrning-ai
// GitHub organization, so structural validation is exercised on fixtures.
const GUIDE = {
  status: "experimental",
  statusNote: "The interface is usable, but compatibility may change.",
  prerequisites: [
    {
      label: "Bun 1.3",
      detail: "Install the supported package manager before setup.",
      href: "https://bun.sh/docs/installation",
    },
  ],
  installation: {
    summary: "Install dependencies from the pinned source tree.",
    steps: [
      {
        title: "Install dependencies",
        detail: "Run the package manager in the artifact directory.",
        command: "bun install",
      },
    ],
  },
  usage: {
    summary: "Start the local interface and inspect its output.",
    steps: [
      {
        title: "Start locally",
        detail: "Run the documented development command.",
        command: "bun run dev",
      },
    ],
  },
  integration: {
    summary: "Consume the generated JSON from another local workflow.",
    targets: ["JSON", "Local filesystem"],
    steps: [
      {
        title: "Read the result",
        detail: "Point the downstream workflow at the generated file.",
      },
    ],
  },
  documentation: {
    label: "Read the operating guide",
    href: "https://docs.example.com/example-tool",
  },
  screenshot: {
    src: "/imported-courses/screenshots/codex.jpg",
    alt: "The example tool showing its generated report.",
    sha256: "c".repeat(64),
    sizeBytes: 123,
    width: 1600,
    height: 900,
  },
  relatedLearning: [
    {
      title: "Codex course",
      description: "Learn the workflow concepts used by the tool.",
      href: "/kurse/open-source/codex",
    },
  ],
} as const satisfies SoftwareArtifactGuide;

const TOOL = {
  id: "tool:example-tool",
  kind: "tool",
  publicationLifecycle: "published",
  slug: "example-tool",
  title: "Example tool",
  eyebrow: "Tool",
  description: "A complete future tool record.",
  href: "/open-source/tools/example-tool",
  language: "de",
  source: {
    href: "https://github.com/loehrning-ai/example-tool",
    revision: "a".repeat(40),
    revisionHref: `https://github.com/loehrning-ai/example-tool/commit/${"a".repeat(40)}`,
  },
  license: {
    href: "/licenses/example-license.txt",
    sourcePath: "LICENSE",
    sha256: "b".repeat(64),
    sizeBytes: 1,
  },
  delivery: "internal-route",
  launchHref: "/demos/example-tool",
  guide: GUIDE,
} as const satisfies ToolArtifact;

describe("open-source artifact registry", () => {
  it("keeps every published artifact ID unique", () => {
    const ids = OPEN_SOURCE_ARTIFACTS.map((artifact) => artifact.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      OPEN_SOURCE_ARTIFACTS.every(
        (artifact) => artifact.publicationLifecycle === "published",
      ),
    ).toBe(true);
  });

  it("validates every candidate before isolating draft and withdrawn entries", () => {
    const published = TOOL;
    const draft = {
      ...TOOL,
      id: "tool:draft-tool",
      publicationLifecycle: "draft",
      slug: "draft-tool",
      href: "/open-source/tools/draft-tool",
    } as const satisfies OpenSourceArtifact;
    const withdrawn = {
      ...TOOL,
      id: "tool:withdrawn-tool",
      publicationLifecycle: "withdrawn",
      slug: "withdrawn-tool",
      href: "/open-source/tools/withdrawn-tool",
    } as const satisfies OpenSourceArtifact;

    expect(
      selectPublishedOpenSourceArtifacts([published, draft, withdrawn]).map(
        (artifact) => artifact.id,
      ),
    ).toEqual([published.id]);

    expect(() =>
      selectPublishedOpenSourceArtifacts([
        {
          ...draft,
          source: { ...draft.source, href: "http://github.com/unsafe/repo" },
        },
      ]),
    ).toThrow(/source\.href/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...draft,
          publicationLifecycle: "preview",
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/publicationLifecycle/);
  });

  it("requires immutable source and verifiable license metadata", () => {
    expect(() => assertOpenSourceArtifacts([TOOL])).not.toThrow();
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...TOOL,
          source: { ...TOOL.source, revision: "abc123" },
        },
      ]),
    ).toThrow(/source\.revision/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...TOOL,
          license: { ...TOOL.license, href: "https://example.com/LICENSE" },
        },
      ]),
    ).toThrow(/license\.href/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...TOOL,
          license: { ...TOOL.license, sourcePath: "README.md" },
        },
      ]),
    ).toThrow(/license\.sourcePath/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...TOOL,
          license: { ...TOOL.license, sha256: "not-a-digest" },
        },
      ]),
    ).toThrow(/license\.sha256/);
  });

  it("requires revision URLs to stay on the exact source ancestry", () => {
    const artifact = TOOL;
    const source = new URL(artifact.source.href);

    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            ...artifact.source,
            revisionHref: `https://example.com${source.pathname}`,
          },
        },
      ]),
    ).toThrow(/source\.revisionHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            ...artifact.source,
            revisionHref: `${source.origin}${source.pathname}-lookalike`,
          },
        },
      ]),
    ).toThrow(/source\.revisionHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            href: "https://github.com/loehrning-ai/example",
            revision: artifact.source.revision,
            revisionHref: `https://github.com/loehrning-ai/example/commit/current?revision=${artifact.source.revision}`,
          },
        },
      ]),
    ).toThrow(/source\.revisionHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            ...artifact.source,
            href: "https://example.com/loehrning-ai/example",
            revisionHref: `https://example.com/loehrning-ai/example/commit/${artifact.source.revision}`,
          },
        },
      ]),
    ).toThrow(/source\.href/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            href: "https://github.com/loehrning-ai/example",
            revision: artifact.source.revision,
            revisionHref: `https://github.com/loehrning-ai/example/issues/${artifact.source.revision}`,
          },
        },
      ]),
    ).toThrow(/source\.revisionHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...artifact,
          source: {
            href: "https://github.com/loehrning-ai/example/tree/main/src",
            revision: artifact.source.revision,
            revisionHref: `https://github.com/loehrning-ai/example/tree/${artifact.source.revision}/src`,
          },
        },
      ]),
    ).toThrow(/source\.href/);
  });

  it("rejects unsafe future URLs and incomplete video metadata", () => {
    const base = {
      id: "video:safe-video",
      kind: "video",
      publicationLifecycle: "published",
      slug: "safe-video",
      title: "Safe video",
      eyebrow: "Video",
      description: "A complete future video record.",
      href: "/open-source/videos/safe-video",
      language: "de",
      source: {
        href: "https://github.com/loehrning-ai/example",
        revision: "a".repeat(40),
        revisionHref: `https://github.com/loehrning-ai/example/commit/${"a".repeat(40)}`,
      },
      license: {
        href: "/licenses/example-license.txt",
        sourcePath: "LICENSE",
        sha256: "b".repeat(64),
        sizeBytes: 1,
      },
      watchHref: "https://video.example/watch/safe-video",
      captionsHref: "/media/safe-video.de.vtt",
      transcriptHref: "/media/safe-video-transcript.txt",
      posterSrc: "/media/safe-video.jpg",
      posterAlt: "Vorschaubild des Videos",
      publication: {
        owner: "loehrning.ai maintainers",
        maintainer: "loehrning.ai media team",
        creationMethod:
          "Recorded and edited from repository-owned source material.",
        modificationHistory: "Initial reviewed publication cut.",
        licenseId: "MIT",
        attribution: "Copyright loehrning.ai maintainers.",
        redistribution: "Permitted under MIT.",
        storageLocation:
          "Repository public media directory and first-party web origin.",
        retentionOwner: "loehrning.ai maintainers",
        replacementProcedure:
          "Replace all media variants and update hashes in one change.",
        availabilityExpectations:
          "Best-effort public delivery with transcript fallback.",
        captionLanguage: "de",
        transcriptLanguage: "de",
        accessibilityReviewDate: "2026-07-14",
      },
      mediaFiles: {
        video: {
          path: "packages/simplified-website/public/media/safe-video.mp4",
          sha256: "c".repeat(64),
          sizeBytes: 12_000,
          mimeType: "video/mp4",
        },
        captions: {
          path: "packages/simplified-website/public/media/safe-video.de.vtt",
          sha256: "d".repeat(64),
          sizeBytes: 800,
          mimeType: "text/vtt",
        },
        transcript: {
          path: "packages/simplified-website/public/media/safe-video-transcript.txt",
          sha256: "e".repeat(64),
          sizeBytes: 2_400,
          mimeType: "text/plain",
        },
        poster: {
          path: "packages/simplified-website/public/media/safe-video.jpg",
          sha256: "f".repeat(64),
          sizeBytes: 24_000,
          mimeType: "image/jpeg",
        },
      },
      duration: "PT12M30S",
      datePublished: "2026-07-14",
    } as const satisfies OpenSourceArtifact;

    const validBase = { ...base, watchHref: "/media/safe-video.mp4" } as const;
    expect(() => assertOpenSourceArtifacts([validBase])).not.toThrow();
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          source: { ...base.source, href: "http://github.com/example" },
        },
      ]),
    ).toThrow(/source\.href/);
    expect(() =>
      assertOpenSourceArtifacts([
        { ...validBase, watchHref: "javascript:alert(1)" },
      ]),
    ).toThrow(/watchHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          duration: "12 minutes",
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/duration/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          datePublished: "2026-02-31",
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/datePublished/);
    const { captionsHref: _captionsHref, ...missingCaptions } = validBase;
    expect(() =>
      assertOpenSourceArtifacts([
        missingCaptions as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/captionsHref/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          mediaFiles: {
            ...validBase.mediaFiles,
            poster: { ...validBase.mediaFiles.poster, sizeBytes: 0 },
          },
        },
      ]),
    ).toThrow(/mediaFiles\.poster\.sizeBytes/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          mediaFiles: {
            ...validBase.mediaFiles,
            video: {
              ...validBase.mediaFiles.video,
              mimeType: "application/octet-stream",
            },
          },
        },
      ]),
    ).toThrow(/mediaFiles\.video\.mimeType/);
    for (const role of Object.keys(validBase.mediaFiles) as Array<
      keyof typeof validBase.mediaFiles
    >) {
      expect(
        () =>
          assertOpenSourceArtifacts([
            {
              ...validBase,
              mediaFiles: {
                ...validBase.mediaFiles,
                [role]: {
                  ...validBase.mediaFiles[role],
                  mimeType: "application/octet-stream",
                },
              },
            } as unknown as OpenSourceArtifact,
          ]),
        `mediaFiles.${role}.mimeType must match its extension`,
      ).toThrow(new RegExp(`mediaFiles\\.${role}\\.mimeType`));
    }
    for (const field of Object.keys(validBase.publication) as Array<
      keyof typeof validBase.publication
    >) {
      expect(
        () =>
          assertOpenSourceArtifacts([
            {
              ...validBase,
              publication: { ...validBase.publication, [field]: "" },
            } as unknown as OpenSourceArtifact,
          ]),
        `publication.${field} must be mandatory`,
      ).toThrow(new RegExp(`publication\\.${field}`));
    }
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          publication: { ...validBase.publication, captionLanguage: "german" },
        },
      ]),
    ).toThrow(/publication\.captionLanguage/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          publication: {
            ...validBase.publication,
            licenseId: "not a license/id",
          },
        },
      ]),
    ).toThrow(/publication\.licenseId/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          publication: {
            ...validBase.publication,
            accessibilityReviewDate: "2026-07-15",
          },
        },
      ]),
    ).toThrow(/accessibilityReviewDate/);
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          href: "/open-source/video/safe-video",
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/href/);

    for (const [extension, mimeType] of [
      ["mp4", "video/mp4"],
      ["webm", "video/webm"],
      ["ogg", "video/ogg"],
    ] as const) {
      const path = `packages/simplified-website/public/media/safe-video.${extension}`;
      expect(() =>
        assertOpenSourceArtifacts([
          {
            ...validBase,
            watchHref: `/media/safe-video.${extension}`,
            mediaFiles: {
              ...validBase.mediaFiles,
              video: { ...validBase.mediaFiles.video, path, mimeType },
            },
          },
        ]),
      ).not.toThrow();
    }

    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...validBase,
          transcriptHref: "/media/safe-video-transcript.md",
          mediaFiles: {
            ...validBase.mediaFiles,
            transcript: {
              ...validBase.mediaFiles.transcript,
              path: "packages/simplified-website/public/media/safe-video-transcript.md",
              mimeType: "text/markdown",
            },
          },
        },
      ]),
    ).not.toThrow();

    for (const [role, path, mimeType] of [
      [
        "video",
        "packages/simplified-website/public/media/safe-video.mov",
        "video/quicktime",
      ],
      [
        "video",
        "packages/simplified-website/public/media/safe-video.m4v",
        "video/x-m4v",
      ],
      [
        "captions",
        "packages/simplified-website/public/media/safe-video.de.srt",
        "application/x-subrip",
      ],
      [
        "transcript",
        "packages/simplified-website/public/media/safe-video-transcript.html",
        "text/html",
      ],
      [
        "poster",
        "packages/simplified-website/public/media/safe-video.gif",
        "image/gif",
      ],
    ] as const) {
      expect(
        () =>
          assertOpenSourceArtifacts([
            {
              ...validBase,
              mediaFiles: {
                ...validBase.mediaFiles,
                [role]: {
                  ...validBase.mediaFiles[role],
                  path,
                  mimeType,
                },
              },
            } as unknown as OpenSourceArtifact,
          ]),
        `${role} must reject ${path}`,
      ).toThrow(new RegExp(`mediaFiles\\.${role}\\.mimeType`));
    }
  });

  it("requires a complete operating guide before a tool or project can publish", () => {
    const guide = GUIDE;
    const tool = TOOL;
    const project = {
      ...tool,
      id: "project:example-project",
      kind: "project",
      slug: "example-project",
      title: "Example project",
      href: "/open-source/projects/example-project",
    } as const satisfies ProjectArtifact;

    expect(() => assertOpenSourceArtifacts([tool, project])).not.toThrow();

    const { launchHref: _launchHref, ...toolWithoutLaunchHref } = tool;
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...toolWithoutLaunchHref,
          delivery: "source-only",
        } as ToolArtifact,
      ]),
    ).not.toThrow();
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...tool,
          delivery: "external-service",
          launchHref: "https://tools.example.com/example-tool",
        } as ToolArtifact,
      ]),
    ).not.toThrow();

    for (const [delivery, launchHref] of [
      ["source-only", "/demos/example-tool"],
      ["internal-route", undefined],
      ["internal-route", "https://tools.example.com/example-tool"],
      ["external-service", "/demos/example-tool"],
    ] as const) {
      expect(
        () =>
          assertOpenSourceArtifacts([
            {
              ...tool,
              delivery,
              launchHref,
            } as unknown as OpenSourceArtifact,
          ]),
        `${delivery} must reject ${String(launchHref)}`,
      ).toThrow(/launchHref/);
    }
    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...tool,
          delivery: "preview",
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/delivery/);

    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...tool,
          license: { ...tool.license, sizeBytes: 0 },
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/license\.sizeBytes/);

    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...tool,
          guide: {
            ...guide,
            screenshot: { ...guide.screenshot, sha256: "invalid" },
          },
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/guide\.screenshot\.sha256/);

    expect(() =>
      assertOpenSourceArtifacts([
        {
          ...tool,
          guide: {
            ...guide,
            screenshot: { ...guide.screenshot, sizeBytes: 0 },
          },
        } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/guide\.screenshot\.sizeBytes/);

    for (const [field, invalidGuide] of [
      ["prerequisites", { ...guide, prerequisites: [] }],
      [
        "installation.steps",
        { ...guide, installation: { ...guide.installation, steps: [] } },
      ],
      [
        "integration.targets",
        { ...guide, integration: { ...guide.integration, targets: [] } },
      ],
      [
        "documentation.href",
        {
          ...guide,
          documentation: {
            ...guide.documentation,
            href: "javascript:alert(1)",
          },
        },
      ],
      [
        "screenshot.src",
        {
          ...guide,
          screenshot: { ...guide.screenshot, src: "/media/tool.svg" },
        },
      ],
      [
        "relatedLearning.href",
        {
          ...guide,
          relatedLearning: [
            { ...guide.relatedLearning[0], href: "https://example.com/course" },
          ],
        },
      ],
    ] as const) {
      expect(
        () =>
          assertOpenSourceArtifacts([
            { ...tool, guide: invalidGuide } as unknown as OpenSourceArtifact,
          ]),
        `guide.${field} must fail closed`,
      ).toThrow(new RegExp(`guide\\.${field.replace(".", "(?:\\[0\\])?\\.")}`));
    }

    expect(() =>
      assertOpenSourceArtifacts([
        { ...tool, guide: undefined } as unknown as OpenSourceArtifact,
      ]),
    ).toThrow(/guide/);
  });

  it("keeps every publication lane empty until a loehrning-ai repository exists", () => {
    expect(OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES).toEqual([]);
    expect(OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES).toEqual([]);
    expect(OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES).toEqual([]);
    expect(OPEN_SOURCE_TOOL_ARTIFACTS).toEqual([]);
    expect(OPEN_SOURCE_PROJECT_ARTIFACTS).toEqual([]);
    expect(OPEN_SOURCE_VIDEO_ARTIFACTS).toEqual([]);
    expect(OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.tool).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.project).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.video).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACT_CANDIDATES).toEqual([]);
    expect(OPEN_SOURCE_ARTIFACT_REGISTRY.tool).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACT_REGISTRY.project).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACT_REGISTRY.video).toHaveLength(0);
    expect(OPEN_SOURCE_ARTIFACTS).toEqual([]);
  });
});
