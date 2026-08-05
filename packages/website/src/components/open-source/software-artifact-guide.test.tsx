import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  assertOpenSourceArtifacts,
  type ToolArtifact,
} from "@/lib/open-source/artifacts";
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
  languageTag: "de",
  source: {
    href: "https://github.com/loehrning-ai/report-builder",
    revision: "a".repeat(40),
    revisionHref: `https://github.com/loehrning-ai/report-builder/commit/${"a".repeat(40)}`,
  },
  license: {
    href: "/artifacts/tools/report-builder/LICENSE.txt",
    sourcePath: "LICENSE",
    sha256: "b".repeat(64),
    sizeBytes: 1,
  },
  delivery: "source-only",
  guide: {
    status: "experimental",
    statusNote: "The input contract is usable but may still change.",
    dataFlow:
      "Input and generated reports remain on the local machine.",
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
      src: "/artifacts/tools/report-builder/screenshot.jpg",
      sourcePath: "docs/screenshots/report-builder.jpg",
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

assertOpenSourceArtifacts([TOOL]);

describe("SoftwareArtifactGuide", () => {
  it("renders the complete operating contract for a future tool detail page", () => {
    const { container } = render(<SoftwareArtifactGuide artifact={TOOL} />);

    expect(screen.getByText("Experimentell")).toBeInTheDocument();
    expect(
      screen.getByRole("figure", {
        name: "Report Builder showing a completed report preview.",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("figure img")).toHaveAttribute("alt", "");
    for (const heading of [
      "Voraussetzungen",
      "Datenfluss",
      "Installation",
      "Verwendung",
      "Integration",
      "Dokumentation und Vertiefung",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "Input and generated reports remain on the local machine.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("bun install")).toBeInTheDocument();
    expect(screen.getByText("bun run report -- input.json")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Befehl für Install dependencies"),
    ).not.toHaveAttribute("tabindex");
    expect(
      screen.getByLabelText("Befehl für Generate the report"),
    ).toHaveClass("whitespace-pre-wrap", "break-words");
    expect(
      screen.getByRole("button", {
        name: "Befehl für Install dependencies kopieren",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Befehl für Generate the report kopieren",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Bun, öffnet in neuem Tab",
      }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Operating guide" })).toHaveAttribute(
      "href",
      "/hilfe",
    );
    expect(screen.getByRole("link", { name: "Codex course" })).toHaveAttribute(
      "href",
      "/kurse/open-source/codex",
    );
  });

  it("renders an ordered demo whose frames are labelled exactly once", () => {
    const withDemo = {
      ...TOOL,
      guide: {
        ...TOOL.guide,
        demo: [
          {
            src: "/artifacts/tools/report-builder/demo/one.png",
            sourcePath: "docs/screenshots/one.png",
            alt: "The form view with a completed entry.",
            caption: "Type into the form.",
            sha256: "d".repeat(64),
            sizeBytes: 10,
            width: 1200,
            height: 800,
          },
          {
            src: "/artifacts/tools/report-builder/demo/two.png",
            sourcePath: "docs/screenshots/two.png",
            alt: "The generated one-page report.",
            caption: "Build the report.",
            sha256: "e".repeat(64),
            sizeBytes: 12,
            width: 1200,
            height: 800,
          },
        ],
      },
    } as const;

    const { container } = render(<SoftwareArtifactGuide artifact={withDemo} />);

    expect(
      screen.getByRole("heading", { name: "Kurzdemo" }),
    ).toBeInTheDocument();
    // Ordered: the sequence is the point of a walkthrough.
    expect(container.querySelector("ol")).toBeInTheDocument();
    for (const step of withDemo.guide.demo) {
      // The caption labels the figure; the descriptive alt renders as visible
      // prose beneath it, so the frame is described once, not twice.
      expect(
        screen.getByRole("figure", { name: step.caption }),
      ).toBeInTheDocument();
      expect(screen.getByText(step.alt)).toBeInTheDocument();
    }
    for (const img of container.querySelectorAll("ol img")) {
      expect(img).toHaveAttribute("alt", "");
    }
    // A figcaption is only the figure's caption when it is a direct child of
    // it; nested in a wrapper it is invalid and the native association is
    // lost. The frame number lives inside the caption and must stay
    // aria-hidden, or it would leak into the figure's accessible name (which
    // the exact-name lookups above would then fail).
    for (const figure of container.querySelectorAll("ol figure")) {
      const captions = figure.querySelectorAll("figcaption");
      expect(captions).toHaveLength(1);
      expect(captions[0].parentElement).toBe(figure);
      expect(captions[0].querySelector("[aria-hidden='true']")).not.toBeNull();
    }
  });

  it("omits the demo section entirely when no frames are declared", () => {
    render(<SoftwareArtifactGuide artifact={TOOL} />);
    expect(
      screen.queryByRole("heading", { name: "Kurzdemo" }),
    ).not.toBeInTheDocument();
  });
});
