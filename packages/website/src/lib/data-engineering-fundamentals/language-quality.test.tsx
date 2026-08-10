import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllDefTranslatedAdvancedChapters } from "./localized-advanced-content";
import { getAllDefTranslatedCoreChapters } from "./localized-core-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")
      ? [path]
      : [];
  });
}

const websiteRoot = process.cwd();
const learnerSourcePaths = [
  ...sourceFiles(
    resolve(
      websiteRoot,
      "src/components/data-engineering-fundamentals/chapters",
    ),
  ),
  ...sourceFiles(
    resolve(
      websiteRoot,
      "src/components/data-engineering-fundamentals/simulators",
    ),
  ),
  resolve(websiteRoot, "src/lib/data-engineering-fundamentals/config.ts"),
  resolve(websiteRoot, "src/lib/data-engineering-fundamentals/course-copy.ts"),
  resolve(websiteRoot, "src/lib/data-engineering-fundamentals/types.ts"),
  resolve(
    websiteRoot,
    "src/lib/data-engineering-fundamentals/localized-core-content.ts",
  ),
  resolve(
    websiteRoot,
    "src/lib/data-engineering-fundamentals/localized-advanced-content.ts",
  ),
] as const;

const learnerSource = learnerSourcePaths
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("Data Engineering Fundamentals language quality", () => {
  it.each([
    "production-ready data pipelines",
    "produktionsfähige Datenpipelines",
    "six shortcuts replace four hours",
    "sechs Kürzel statt vier Stunden",
    "real tools, real behavior",
    "Reale Werkzeuge, reales Laufzeitverhalten",
    "read 100× less",
    "skip 99%",
    "faster than 90%",
    "legally safe to query",
    "cover &gt;95%",
    "Every one is load-bearing",
    "Jeder ist notwendig",
    "OpenLineage/DataHub serves the same graph",
    "Parquet (ORC fork)",
    "big-data default",
    "zero-ops",
    "always works",
    "non-negotiable",
    "no exceptions",
    "storage costs cents",
    "must finish",
    "can't retry",
    "Trust Meter",
    "Vertrauensanzeige",
  ])("keeps removed hype or unsupported claim out: %s", (forbidden) => {
    expect(learnerSource).not.toContain(forbidden);
  });

  it("does not render representative English interface copy in German chapters", async () => {
    const [core, advanced] = await Promise.all([
      getAllDefTranslatedCoreChapters("de"),
      getAllDefTranslatedAdvancedChapters("de"),
    ]);
    const renderedGerman: string[] = [];

    for (const chapter of [...core, ...advanced]) {
      const Component = chapter.component;
      const view = render(<Component chapter={chapter.meta} />);
      renderedGerman.push(view.container.textContent ?? "");
      view.unmount();
    }

    const corpus = renderedGerman.join("\n");
    for (const forbidden of [
      "Tools used in the course scenarios",
      "Check coverage",
      "Catalog command practice",
      "Start practice",
      "Illustrative catalog graph",
      "Evaluate DatasetSpec",
      "Six modeled controls",
      "Object-store scenario",
    ]) {
      expect(corpus, forbidden).not.toContain(forbidden);
    }
  });
});
