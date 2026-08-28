import { describe, expect, it } from "vitest";
import { OPEN_SOURCE_TOOL_ARTIFACTS } from "./artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_PAGE_COPY,
  OPEN_SOURCE_SHARED_COPY,
} from "./display-copy";

describe("open-source display copy", () => {
  it("keeps publication evidence and artifact states precise in both languages", () => {
    expect(OPEN_SOURCE_PAGE_COPY.de.showcase.publicationStandard).toContain(
      "unveränderlichem Commit",
    );
    expect(OPEN_SOURCE_PAGE_COPY.en.showcase.publicationStandard).toContain(
      "immutable commit",
    );
    expect(OPEN_SOURCE_SHARED_COPY.de.statuses.experimental).toBe(
      "Experimentell",
    );
    expect(OPEN_SOURCE_SHARED_COPY.en.statuses.experimental).toBe(
      "Experimental",
    );
  });

  it("translates CV Engine presentation without changing publication evidence", () => {
    const registry = OPEN_SOURCE_TOOL_ARTIFACTS.find(
      (artifact) => artifact.id === "tool:cv-engine",
    );
    expect(registry).toBeDefined();
    if (!registry) return;

    const english = localizeOpenSourceArtifact(registry, "en");

    expect(english).not.toBe(registry);
    expect(english.description).toContain("Local YAML-to-PDF build");
    expect(english.description).not.toContain("Lokaler");
    expect(english.guide.dataFlow).toContain("runs entirely locally");
    expect(english.guide.installation.steps[0].title).toBe(
      "Install system libraries",
    );
    expect(english.guide.demo?.[0].caption).toContain("visible label");

    expect(english.id).toBe(registry.id);
    expect(english.publicationLifecycle).toBe(registry.publicationLifecycle);
    expect(english.source).toEqual(registry.source);
    expect(english.license).toEqual(registry.license);
    expect(english.delivery).toBe(registry.delivery);
    expect(english.guide.status).toBe(registry.guide.status);
    expect(english.guide.integration.targets).toEqual(
      registry.guide.integration.targets,
    );
    expect(
      english.guide.installation.steps.map((step) => step.command),
    ).toEqual(registry.guide.installation.steps.map((step) => step.command));
    expect(english.guide.screenshot.sha256).toBe(
      registry.guide.screenshot.sha256,
    );
    expect(english.guide.demo?.map((step) => step.sha256)).toEqual(
      registry.guide.demo?.map((step) => step.sha256),
    );
  });

  it("returns the canonical registry object for German and unknown artifact IDs", () => {
    const registry = OPEN_SOURCE_TOOL_ARTIFACTS[0];
    expect(localizeOpenSourceArtifact(registry, "de")).toBe(registry);

    const unknown = { ...registry, id: "tool:future-tool" as const };
    expect(localizeOpenSourceArtifact(unknown, "en")).toBe(unknown);
  });
});
