import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectArtifact } from "@/lib/open-source/artifacts";

const { PROJECT } = vi.hoisted(() => {
  const revision = "a".repeat(40);
  const project = {
    id: "project:example-project",
    kind: "project",
    publicationLifecycle: "published",
    slug: "example-project",
    title: "Example Project",
    eyebrow: "Open-Source-Projekt",
    description: "A pinned public project with a complete operating guide.",
    href: "/open-source/projects/example-project",
    language: "English (United Kingdom)",
    languageTag: "en-GB",
    source: {
      href: "https://github.com/loehrning-ai/example-project",
      revision,
      revisionHref: `https://github.com/loehrning-ai/example-project/commit/${revision}`,
    },
    license: {
      href: "/artifacts/projects/example-project/LICENSE.txt",
      sourcePath: "LICENSE",
      sha256: "b".repeat(64),
      sizeBytes: 1066,
      licenseId: "MIT",
    },
    delivery: "external-service",
    launchHref: "https://example.com/example-project",
    guide: {
      status: "stable",
      statusNote: "The documented release is stable.",
      dataFlow: "Local project data stays on the local machine.",
      prerequisites: [
        {
          label: "Python",
          detail: "Install the supported runtime.",
        },
      ],
      installation: {
        summary: "Install the pinned release.",
        steps: [
          {
            title: "Install",
            detail: "Install locked dependencies.",
            command: "python -m pip install -r requirements.lock",
          },
        ],
      },
      usage: {
        summary: "Run the local application.",
        steps: [
          {
            title: "Run",
            detail: "Start the documented entry point.",
            command: "python app.py",
          },
        ],
      },
      integration: {
        summary: "Connect the generated document.",
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
        href: "https://github.com/loehrning-ai/example-project",
      },
      screenshot: {
        src: "/artifacts/projects/example-project/screenshot.webp",
        sourcePath: "docs/screenshots/example-project.webp",
        alt: "Example Project showing a generated document.",
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
  } as const satisfies ProjectArtifact;

  return {
    PROJECT: project,
  };
});

vi.mock("@/lib/open-source/artifacts", () => ({
  OPEN_SOURCE_PROJECT_ARTIFACTS: [PROJECT],
  OPEN_SOURCE_TOOL_ARTIFACTS: [],
  OPEN_SOURCE_VIDEO_ARTIFACTS: [],
  getOpenSourceArtifactByRoute: (kind: string, slug: string) =>
    kind === "projects" && slug === PROJECT.slug ? PROJECT : undefined,
}));

import OpenSourceArtifactDetailPage, {
  generateMetadata,
  generateStaticParams,
} from "./page";

const PARAMS = Promise.resolve({
  kind: "projects",
  slug: PROJECT.slug,
});

describe("OpenSourceArtifactDetailPage", () => {
  it("keeps its mocked artifact aligned with the publication validator", async () => {
    const { assertOpenSourceArtifacts } = await vi.importActual<
      typeof import("@/lib/open-source/artifacts")
    >("@/lib/open-source/artifacts");

    expect(() => assertOpenSourceArtifacts([PROJECT])).not.toThrow();
  });

  it("publishes artifact metadata while file conventions own social images", async () => {
    const metadata = await generateMetadata({ params: PARAMS });

    expect(metadata.alternates?.canonical).toBe(PROJECT.href);
    expect(metadata.openGraph).toMatchObject({
      title: PROJECT.title,
      url: `https://loehrning.ai${PROJECT.href}`,
      siteName: "loehrning.ai",
      locale: "de_DE",
    });
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: PROJECT.title,
    });
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("emits a static route, ownership-linked artifact data, and breadcrumbs", async () => {
    expect(generateStaticParams()).toEqual([
      { kind: "projects", slug: PROJECT.slug },
    ]);
    const { container } = render(
      await OpenSourceArtifactDetailPage({ params: PARAMS }),
    );
    const script = container.querySelector<HTMLScriptElement>(
      `script#open-source-project-${PROJECT.slug}-jsonld`,
    );
    const graph = JSON.parse(script?.textContent ?? "{}")["@graph"];

    expect(graph[0]).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, item: "https://loehrning.ai" },
        { position: 2, item: "https://loehrning.ai/open-source" },
        { position: 3, item: `https://loehrning.ai${PROJECT.href}` },
      ],
    });
    expect(graph[1]).toMatchObject({
      "@type": "SoftwareSourceCode",
      publisher: { "@id": "https://loehrning.ai/#org" },
      creator: { "@id": "https://loehrning.ai/#tim" },
      isAccessibleForFree: true,
      inLanguage: "en-GB",
    });
    expect(
      screen.getByRole("heading", { name: "Datenfluss" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Local project data stays on the local machine."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Öffnen, öffnet in neuem Tab",
      }),
    ).toHaveAttribute("href", PROJECT.launchHref);
    expect(
      screen.getByRole("link", {
        name: "Quellstand, öffnet in neuem Tab",
      }),
    ).toHaveAttribute("href", PROJECT.source.revisionHref);
  });
});
