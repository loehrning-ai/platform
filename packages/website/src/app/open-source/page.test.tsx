import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectArtifact } from "@/lib/open-source/artifacts";

const { PROJECT } = vi.hoisted(() => {
  const revision = "d".repeat(40);
  const project = {
    id: "project:metadata-project",
    kind: "project",
    publicationLifecycle: "published",
    slug: "metadata-project",
    title: "Metadata Project",
    eyebrow: "Open-Source-Projekt",
    description: "A typed project fixture for collection metadata.",
    href: "/open-source/projects/metadata-project",
    language: "English (United Kingdom)",
    languageTag: "en-GB",
    source: {
      href: "https://github.com/loehrning-ai/metadata-project",
      revision,
      revisionHref: `https://github.com/loehrning-ai/metadata-project/commit/${revision}`,
    },
    license: {
      href: "/artifacts/projects/metadata-project/LICENSE.txt",
      sourcePath: "LICENSE",
      sha256: "e".repeat(64),
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
        href: "https://github.com/loehrning-ai/metadata-project",
      },
      screenshot: {
        src: "/artifacts/projects/metadata-project/screenshot.webp",
        sourcePath: "docs/screenshots/metadata-project.webp",
        alt: "Metadata Project showing a generated document.",
        sha256: "f".repeat(64),
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
  return { PROJECT: project };
});

vi.mock("@/lib/open-source/artifacts", () => ({
  OPEN_SOURCE_ARTIFACTS: [PROJECT],
}));

import OpenSourcePage from "./page";

describe("OpenSourcePage", () => {
  it("keeps its mocked artifact aligned with the publication validator", async () => {
    const { assertOpenSourceArtifacts } = await vi.importActual<
      typeof import("@/lib/open-source/artifacts")
    >("@/lib/open-source/artifacts");

    expect(() => assertOpenSourceArtifacts([PROJECT])).not.toThrow();
  });

  it("describes every artifact lane without encoding an empty launch state", () => {
    const { container } = render(<OpenSourcePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Das Werkverzeichnis. Offen auf GitHub.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/jedes veröffentlichte Werk/),
    ).toBeInTheDocument();
    // The mocked published project renders on the shelf with its kind stamp.
    expect(
      screen.getByRole("heading", { level: 2, name: "Alle Werke" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Projekt")).toBeInTheDocument();
    expect(screen.queryByText(/in Vorbereitung/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bleibt dieser Bereich leer/i)).not.toBeInTheDocument();

    for (const link of screen.getAllByRole("link", {
      name: /loehrning-ai, öffnet in neuem Tab/,
    })) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(container.querySelector("svg.lucide-github")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const graph = JSON.parse(
      container.querySelector<HTMLScriptElement>(
        "script#open-source-jsonld",
      )?.textContent ?? "{}",
    )["@graph"];
    expect(graph[1].hasPart).toEqual([
      expect.objectContaining({
        name: PROJECT.title,
        inLanguage: "en-GB",
      }),
    ]);
  });
});
