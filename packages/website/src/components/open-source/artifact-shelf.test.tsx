import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  SoftwareArtifactGuide,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import { assertOpenSourceArtifacts } from "@/lib/open-source/artifacts";
import { OpenSourceArtifactShelf } from "./artifact-shelf";

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

describe("OpenSourceArtifactShelf", () => {
  it("renders nothing at all when the shelf is empty", () => {
    // No placeholder copy, no empty-state promise: with zero entries the
    // Werkverzeichnis simply does not appear. The retired lane headings must
    // never return as headings.
    const { container } = render(<OpenSourceArtifactShelf artifacts={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("heading", { name: "Alle Werke" }),
    ).not.toBeInTheDocument();
    for (const retired of ["Werkzeuge", "Projekte", "Videos"]) {
      expect(
        screen.queryByRole("heading", { name: retired }),
      ).not.toBeInTheDocument();
    }
  });

  it("renders the live registry's published cv-engine tool by default", () => {
    render(<OpenSourceArtifactShelf />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Alle Werke" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 Eintrag")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "CV Engine" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Werkzeug")).toBeInTheDocument();
    for (const retired of ["Werkzeuge", "Projekte", "Videos"]) {
      expect(
        screen.queryByRole("heading", { name: retired }),
      ).not.toBeInTheDocument();
    }
  });

  it("renders provided artifacts in one grid with kind stamps and count", () => {
    render(<OpenSourceArtifactShelf artifacts={[TOOL]} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Alle Werke" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 Eintrag")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: TOOL.title }),
    ).toBeInTheDocument();
    // The kind is a stamp on the card, never a heading.
    expect(screen.getByText("Werkzeug")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Werkzeug" }),
    ).not.toBeInTheDocument();
    for (const retired of ["Werkzeuge", "Projekte", "Videos"]) {
      expect(
        screen.queryByRole("heading", { name: retired }),
      ).not.toBeInTheDocument();
    }
  });
});
