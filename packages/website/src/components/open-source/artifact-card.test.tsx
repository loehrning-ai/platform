import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  assertOpenSourceArtifacts,
  type SoftwareArtifactGuide,
  type ToolArtifact,
} from "@/lib/open-source/artifacts";
import { OpenSourceArtifactCard } from "./artifact-card";

const GUIDE = {
  status: "experimental",
  statusNote: "The interface is usable, but compatibility may change.",
  dataFlow:
    "The example stays local and sends no data to third-party services.",
  prerequisites: [
    {
      label: "Bun 1.3",
      detail: "Install the supported package manager before setup.",
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
    targets: ["JSON"],
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
    src: "/artifacts/tools/example-tool/screenshot.jpg",
    sourcePath: "docs/screenshots/example-tool.jpg",
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

function toolFixture(slug: string, title: string): ToolArtifact {
  const artifact: ToolArtifact = {
    id: `tool:${slug}`,
    kind: "tool",
    publicationLifecycle: "published",
    slug,
    title,
    eyebrow: "Tool",
    description: `${title} generates a local report.`,
    href: `/open-source/tools/${slug}`,
    language: "Deutsch",
    languageTag: "de",
    source: {
      href: `https://github.com/loehrning-ai/${slug}`,
      revision: "a".repeat(40),
      revisionHref: `https://github.com/loehrning-ai/${slug}/commit/${"a".repeat(40)}`,
    },
    license: {
      href: `/artifacts/tools/${slug}/LICENSE.txt`,
      sourcePath: "LICENSE",
      sha256: "b".repeat(64),
      sizeBytes: 1,
    },
    delivery: "source-only",
    guide: {
      ...GUIDE,
      screenshot: {
        ...GUIDE.screenshot,
        src: `/artifacts/tools/${slug}/screenshot.jpg`,
      },
    },
  };
  assertOpenSourceArtifacts([artifact]);
  return artifact;
}

describe("OpenSourceArtifactCard", () => {
  it("gives the card and every repeated action an artifact-specific accessible name", () => {
    const first = toolFixture("dashboard-generator", "Dashboard Generator");
    const second = toolFixture("report-generator", "Report Generator");
    render(
      <>
        <OpenSourceArtifactCard artifact={first} />
        <OpenSourceArtifactCard artifact={second} />
      </>,
    );

    expect(screen.getByRole("article", { name: first.title })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: second.title })).toBeInTheDocument();

    for (const artifact of [first, second]) {
      expect(
        screen.getByRole("link", { name: `Detail ${artifact.title}` }),
      ).toHaveAttribute("href", artifact.href);
      // The GitHub action names the repo: the visible mono path sits inside
      // the composed accessible name (label-in-name, WCAG 2.5.3).
      expect(
        screen.getByRole("link", {
          name: `Quelle loehrning-ai/${artifact.slug} ${artifact.title}`,
        }),
      ).toHaveAttribute("href", artifact.source.href);
      expect(
        screen.getByRole("link", { name: `Lizenz ${artifact.title}` }),
      ).toHaveAttribute("href", artifact.license.href);
    }
  });

  it("leads with the guide screenshot under its published alt text", () => {
    const artifact = toolFixture("dashboard-generator", "Dashboard Generator");
    render(<OpenSourceArtifactCard artifact={artifact} />);

    const screenshot = screen.getByRole("img", {
      name: GUIDE.screenshot.alt,
    });
    expect(screenshot).toBeInTheDocument();
    expect(screenshot).toHaveAttribute(
      "alt",
      "The example tool showing its generated report.",
    );
  });

  it("names the license by its identifier when one is recorded", () => {
    const base = toolFixture("dashboard-generator", "Dashboard Generator");
    const identified: ToolArtifact = {
      ...base,
      license: { ...base.license, licenseId: "MIT" },
    };
    render(<OpenSourceArtifactCard artifact={identified} />);

    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.queryByText("LICENSE")).not.toBeInTheDocument();
  });

  it("falls back to the license source path when no identifier is recorded", () => {
    const artifact = toolFixture("dashboard-generator", "Dashboard Generator");
    expect(artifact.license.licenseId).toBeUndefined();
    render(<OpenSourceArtifactCard artifact={artifact} />);

    expect(screen.getByText("LICENSE")).toBeInTheDocument();
  });

  it("uses the launch route as the primary action when a tool declares one", () => {
    const launchable: ToolArtifact = {
      ...toolFixture("example-tool", "Example Tool"),
      delivery: "internal-route",
      launchHref: "/demos/example-tool",
    };
    render(<OpenSourceArtifactCard artifact={launchable} />);

    expect(
      screen.getByRole("link", { name: `Öffnen ${launchable.title}` }),
    ).toHaveAttribute("href", "/demos/example-tool");
    expect(
      screen.getByRole("link", { name: `Detail ${launchable.title}` }),
    ).toHaveAttribute("href", launchable.href);
  });

  it("retains the detail route and discloses every external new-tab action", () => {
    const launchable: ToolArtifact = {
      ...toolFixture("external-tool", "External Tool"),
      delivery: "external-service",
      launchHref: "https://example.com/external-tool",
    };
    render(<OpenSourceArtifactCard artifact={launchable} />);

    expect(
      screen.getByRole("link", { name: `Detail ${launchable.title}` }),
    ).toHaveAttribute("href", launchable.href);
    expect(
      screen.getByRole("link", { name: `Öffnen ${launchable.title}` }),
    ).toHaveAccessibleDescription("Wird in einem neuen Tab geöffnet.");
    expect(
      screen.getByRole("link", {
        name: `Quelle loehrning-ai/${launchable.slug} ${launchable.title}`,
      }),
    ).toHaveAccessibleDescription("Wird in einem neuen Tab geöffnet.");
  });
});
