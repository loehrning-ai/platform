import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToolArtifact } from "@/lib/open-source/artifacts";
import { SoftwareArtifactGuide } from "./software-artifact-guide";

const TOOL = {
  id: "tool:report-builder",
  kind: "tool",
  publicationLifecycle: "published",
  slug: "report-builder",
  title: "Report Builder",
  eyebrow: "Tool",
  description: "Builds a structured local report.",
  href: "/open-source/tools/report-builder",
  language: "Deutsch",
  source: {
    href: "https://github.com/loehrning-ai/report-builder",
    revision: "a".repeat(40),
    revisionHref: `https://github.com/loehrning-ai/report-builder/commit/${"a".repeat(40)}`,
  },
  license: {
    href: "/licenses/report-builder.txt",
    sourcePath: "LICENSE",
    sha256: "b".repeat(64),
    sizeBytes: 1,
  },
  delivery: "source-only",
  guide: {
    status: "experimental",
    statusNote: "The input contract is usable but may still change.",
    prerequisites: [
      {
        label: "Bun",
        detail: "Use the supported package-manager version.",
        href: "https://bun.sh/docs/installation",
      },
    ],
    installation: {
      summary: "Install the repository dependencies.",
      steps: [
        {
          title: "Install dependencies",
          detail: "Run the install command in the tool directory.",
          command: "bun install",
        },
      ],
    },
    usage: {
      summary: "Generate a report from a local input file.",
      steps: [
        {
          title: "Generate the report",
          detail: "Pass the input file to the documented script.",
          command: "bun run report -- input.json",
        },
      ],
    },
    integration: {
      summary: "Use the resulting JSON in a local document workflow.",
      targets: ["JSON", "Document pipeline"],
      steps: [
        {
          title: "Connect the output",
          detail: "Configure the consumer to read report.json.",
        },
      ],
    },
    documentation: {
      label: "Operating guide",
      href: "/hilfe",
    },
    screenshot: {
      src: "/imported-courses/screenshots/codex.jpg",
      alt: "Report Builder showing a completed report preview.",
      sha256: "6e67076e584ca88b8b497bacebc1f2b5373fe8c6a1547108f65f66b856ee5c46",
      sizeBytes: 269791,
      width: 2880,
      height: 1800,
    },
    relatedLearning: [
      {
        title: "Codex course",
        description: "Learn the workflow used to maintain the tool.",
        href: "/kurse/open-source/codex",
      },
    ],
  },
} as const satisfies ToolArtifact;

describe("SoftwareArtifactGuide", () => {
  it("renders the complete operating contract for a future tool detail page", () => {
    render(<SoftwareArtifactGuide artifact={TOOL} />);

    expect(screen.getByText("Experimentell")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Report Builder showing a completed report preview.",
      }),
    ).toBeInTheDocument();
    for (const heading of [
      "Voraussetzungen",
      "Installation",
      "Verwendung",
      "Integration",
      "Dokumentation und Vertiefung",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText("bun install")).toBeInTheDocument();
    expect(screen.getByText("bun run report -- input.json")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Operating guide" })).toHaveAttribute(
      "href",
      "/hilfe",
    );
    expect(screen.getByRole("link", { name: "Codex course" })).toHaveAttribute(
      "href",
      "/kurse/open-source/codex",
    );
  });
});
