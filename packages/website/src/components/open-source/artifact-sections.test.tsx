import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  OpenSourceArtifactSection,
  SoftwareArtifactGuide,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import { assertOpenSourceArtifacts } from "@/lib/open-source/artifacts";
import { OpenSourceArtifactSections } from "./artifact-sections";

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

const TOOL = {
  id: "tool:example-tool",
  kind: "tool",
  publicationLifecycle: "published",
  slug: "example-tool",
  title: "Example Tool",
  eyebrow: "Tool",
  description: "Generates a local report from pinned source data.",
  href: "/open-source/tools/example-tool",
  language: "Deutsch",
  languageTag: "de",
  source: {
    href: "https://github.com/loehrning-ai/example-tool",
    revision: "a".repeat(40),
    revisionHref: `https://github.com/loehrning-ai/example-tool/commit/${"a".repeat(40)}`,
  },
  license: {
    href: "/artifacts/tools/example-tool/LICENSE.txt",
    sourcePath: "LICENSE",
    sha256: "b".repeat(64),
    sizeBytes: 1,
  },
  delivery: "source-only",
  guide: GUIDE,
} as const satisfies ToolArtifact;

assertOpenSourceArtifacts([TOOL]);

describe("OpenSourceArtifactSections", () => {
  it("renders no section headings while every publication lane is empty", () => {
    render(<OpenSourceArtifactSections />);

    expect(
      screen.queryByRole("heading", { name: "Werkzeuge" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Projekte" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Videos" }),
    ).not.toBeInTheDocument();
  });

  it("renders a published artifact under its kind heading and skips empty lanes", () => {
    const sections: readonly OpenSourceArtifactSection[] = [
      { kind: "tool", heading: "Werkzeuge", artifacts: [TOOL] },
      { kind: "project", heading: "Projekte", artifacts: [] },
      { kind: "video", heading: "Videos", artifacts: [] },
    ];
    render(<OpenSourceArtifactSections sections={sections} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Werkzeuge" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: TOOL.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Projekte" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Videos" }),
    ).not.toBeInTheDocument();
  });
});
