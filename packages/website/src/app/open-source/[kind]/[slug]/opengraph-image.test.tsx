/** @vitest-environment node */

import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectArtifact } from "@/lib/open-source/artifacts";

const { PROJECTS } = vi.hoisted(() => {
  function project(
    slug: string,
    title: string,
    revisionCharacter: string,
  ): ProjectArtifact {
    const revision = revisionCharacter.repeat(40);
    return {
      id: `project:${slug}`,
      kind: "project",
      publicationLifecycle: "published",
      slug,
      title,
      eyebrow: "Open-Source-Projekt",
      description: `${title} has an artifact-specific social preview.`,
      href: `/open-source/projects/${slug}`,
      language: "English",
      languageTag: "en",
      source: {
        href: `https://github.com/loehrning-ai/${slug}`,
        revision,
        revisionHref: `https://github.com/loehrning-ai/${slug}/commit/${revision}`,
      },
      license: {
        href: `/artifacts/projects/${slug}/LICENSE.txt`,
        sourcePath: "LICENSE",
        sha256: "b".repeat(64),
        sizeBytes: 1066,
        licenseId: "MIT",
      },
      delivery: "source-only",
      guide: {
        status: "stable",
        statusNote: "The publication contract is stable.",
        dataFlow: "All project data remains local.",
        prerequisites: [
          {
            label: "Python",
            detail: "Install the supported runtime.",
          },
        ],
        installation: {
          summary: "Install locked dependencies.",
          steps: [
            {
              title: "Install",
              detail: "Use the lock file.",
              command: "python -m pip install -r requirements.lock",
            },
          ],
        },
        usage: {
          summary: "Run the project locally.",
          steps: [
            {
              title: "Run",
              detail: "Start the documented entry point.",
              command: "python app.py",
            },
          ],
        },
        integration: {
          summary: "Consume the generated document.",
          targets: ["PDF"],
          steps: [
            {
              title: "Export",
              detail: "Read the generated PDF.",
            },
          ],
        },
        documentation: {
          label: "README",
          href: `https://github.com/loehrning-ai/${slug}`,
        },
        screenshot: {
          src: `/artifacts/projects/${slug}/screenshot.webp`,
          sourcePath: `docs/screenshots/${slug}.webp`,
          alt: `${title} showing a generated document.`,
          sha256: "c".repeat(64),
          sizeBytes: 1000,
          width: 1600,
          height: 1000,
        },
        relatedLearning: [
          {
            title: "Open Source",
            description: "Publication context.",
            href: "/open-source",
          },
        ],
      },
    };
  }

  return {
    PROJECTS: [
      project("alpha-project", "Alpha Project", "a"),
      project("beta-project", "Beta Project", "d"),
    ],
  };
});

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/open-source/artifacts", () => ({
  OPEN_SOURCE_PROJECT_ARTIFACTS: PROJECTS,
  OPEN_SOURCE_TOOL_ARTIFACTS: [],
  OPEN_SOURCE_VIDEO_ARTIFACTS: [],
  getOpenSourceArtifactByRoute: (kind: string, slug: string) =>
    kind === "projects"
      ? PROJECTS.find((artifact) => artifact.slug === slug)
      : undefined,
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import OpenGraphImage, {
  alt as openGraphAlt,
  contentType as openGraphContentType,
  generateStaticParams as generateOpenGraphStaticParams,
  size as openGraphSize,
} from "./opengraph-image";
import TwitterImage, {
  alt as twitterAlt,
  contentType as twitterContentType,
  generateStaticParams as generateTwitterStaticParams,
  size as twitterSize,
} from "./twitter-image";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

async function renderImage(
  renderer: typeof OpenGraphImage,
  slug: string,
): Promise<{ readonly bytes: Buffer; readonly digest: string }> {
  const response = await renderer({
    params: Promise.resolve({ kind: "projects", slug }),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");

  const bytes = Buffer.from(await response.arrayBuffer());
  expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);

  return {
    bytes,
    digest: createHash("sha256").update(bytes).digest("hex"),
  };
}

describe("open-source artifact social image file conventions", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("keeps every mocked artifact aligned with the publication validator", async () => {
    const { assertOpenSourceArtifacts } = await vi.importActual<
      typeof import("@/lib/open-source/artifacts")
    >("@/lib/open-source/artifacts");

    expect(() => assertOpenSourceArtifacts(PROJECTS)).not.toThrow();
  });

  it("pre-renders every published artifact for both image endpoints", () => {
    const expected = PROJECTS.map((artifact) => ({
      kind: "projects",
      slug: artifact.slug,
    }));

    expect(generateOpenGraphStaticParams()).toEqual(expected);
    expect(generateTwitterStaticParams()).toEqual(expected);
    expect(openGraphSize).toEqual({ width: 1200, height: 630 });
    expect(twitterSize).toEqual(openGraphSize);
    expect(openGraphContentType).toBe("image/png");
    expect(twitterContentType).toBe(openGraphContentType);
    expect(openGraphAlt).toBeTruthy();
    expect(twitterAlt).toBeTruthy();
  });

  it("renders artifact-specific PNGs at the OpenGraph and Twitter endpoints", async () => {
    const alphaOpenGraph = await renderImage(
      OpenGraphImage,
      PROJECTS[0].slug,
    );
    const betaOpenGraph = await renderImage(
      OpenGraphImage,
      PROJECTS[1].slug,
    );
    const alphaTwitter = await renderImage(TwitterImage, PROJECTS[0].slug);

    expect(alphaOpenGraph.digest).not.toBe(betaOpenGraph.digest);
    expect(alphaTwitter.digest).toBe(alphaOpenGraph.digest);
    expect(alphaOpenGraph.bytes.length).toBeGreaterThan(1_000);
  });
});
