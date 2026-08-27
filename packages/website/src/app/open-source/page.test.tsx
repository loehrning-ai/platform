import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/open-source/artifacts", () => ({
  OPEN_SOURCE_ARTIFACTS: [PROJECT],
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import OpenSourcePage, { generateMetadata } from "./page";

describe("OpenSourcePage", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("keeps its mocked artifact aligned with the publication validator", async () => {
    const { assertOpenSourceArtifacts } = await vi.importActual<
      typeof import("@/lib/open-source/artifacts")
    >("@/lib/open-source/artifacts");

    expect(() => assertOpenSourceArtifacts([PROJECT])).not.toThrow();
  });

  it("leads with a product teaser while retaining registry metadata", async () => {
    const { container } = render(await OpenSourcePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Offene Werkzeuge. Ohne Blackbox.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Echte Ansichten zuerst/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Jetzt veröffentlicht" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Projekt").length).toBeGreaterThan(0);
    expect(screen.queryByText(/in Vorbereitung/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/bleibt dieser Bereich leer/i),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("region", {
        name: "Produktansichten auswählen: Metadata Project",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Editor anzeigen" }),
    ).toHaveAttribute("aria-pressed", "true");

    const sourceLink = screen.getByRole("link", {
      name: /Quellcode: Metadata Project/,
    });
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(sourceLink).toHaveAttribute("href", PROJECT.source.revisionHref);
    expect(
      screen.getByRole("link", {
        name: /Plattform-Code, öffnet in neuem Tab/,
      }),
    ).toHaveAttribute("href", "https://github.com/loehrning-ai/platform");

    const graph = JSON.parse(
      container.querySelector<HTMLScriptElement>("script#open-source-jsonld")
        ?.textContent ?? "{}",
    )["@graph"];
    expect(graph[1].hasPart).toEqual([
      expect.objectContaining({
        name: PROJECT.title,
        inLanguage: "en-GB",
      }),
    ]);
  });

  it("renders the English directory and localizes page routes and structured data", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const { container } = render(await OpenSourcePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Open tools. No black box.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Published now" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Project").length).toBeGreaterThan(0);
    for (const licensePolicy of screen.getAllByRole("link", {
      name: "License policy",
    })) {
      expect(licensePolicy).toHaveAttribute(
        "href",
        "/en/open-source/lizenzrichtlinie",
      );
    }
    expect(
      screen.getByRole("link", { name: "Browse technical courses" }),
    ).toHaveAttribute("href", "/en/kurse");

    const graph = JSON.parse(
      container.querySelector<HTMLScriptElement>("script#open-source-jsonld")
        ?.textContent ?? "{}",
    )["@graph"];
    expect(graph[1]).toMatchObject({
      url: "https://loehrning.ai/en/open-source",
      inLanguage: "en-GB",
    });
    expect(graph[1].hasPart[0].url).toBe(
      "https://loehrning.ai/en/open-source/projects/metadata-project",
    );
  });

  it.each([
    ["de", "/open-source", "Open Source", "de_DE"],
    ["en", "/en/open-source", "Open source", "en_GB"],
  ] as const)(
    "emits %s metadata with a language-specific canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
