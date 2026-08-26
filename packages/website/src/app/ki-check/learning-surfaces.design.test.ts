import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const explainerIndex = source("../wie-ki-funktioniert/page.tsx");
const explainerLesson = source("../wie-ki-funktioniert/[lektionId]/page.tsx");
const diagnostic = source("./ki-check-client.tsx");

const ownedSurfaces = [
  explainerIndex,
  explainerLesson,
  source("../wie-ki-funktioniert/error.tsx"),
  source("../wie-ki-funktioniert/not-found.tsx"),
  diagnostic,
  source("./dimension-bars.tsx"),
  source("./radar-chart.tsx"),
  source("./step-indicator.tsx"),
];

describe("standalone learning surface design contract", () => {
  it("keeps route-owned labels legible and removes brochure chrome", () => {
    for (const code of ownedSurfaces) {
      expect(code).not.toMatch(/text-\[(?:[0-9]|1[01])px\]/);
      expect(code).not.toMatch(/rounded-(?:full|lg|xl|2xl|3xl)/);
      expect(code).not.toMatch(/shadow-(?:\[|sm|md|lg|xl|2xl|tile)/);
      expect(code).not.toContain("transition-all");
      expect(code).not.toMatch(/hover:-?translate-/);
      expect(code).not.toMatch(
        /(?:^|[\s"'])(?:mt|mb|pt|pb|py|gap|space-y)-(?:14|16|20|24|28|32)\b/m,
      );
    }
  });

  it("puts a single first-lesson action before the explainer ledger", () => {
    expect(explainerIndex).toContain('data-learning-explainer="ledger"');
    expect(explainerIndex).toContain("data-primary-action");
    expect(explainerIndex.indexOf("data-primary-action")).toBeLessThan(
      explainerIndex.indexOf('data-testid="lektion-cards"'),
    );
    expect(explainerIndex).toContain("courseGraph(locale)");
    expect(explainerIndex).toContain("hasPart: lektionen.map");
  });

  it("keeps the lesson decision first and evidence secondary", () => {
    expect(explainerLesson).toContain('data-learning-lesson="action-first"');
    expect(explainerLesson.indexOf("<ComprehensionCheck")).toBeLessThan(
      explainerLesson.indexOf("<LessonReference"),
    );
    expect(explainerLesson).toContain("dynamicParams = false");
    expect(explainerLesson).toContain("lessonGraph({ locale, lektion })");
  });

  it("keeps one primary action in each diagnostic state", () => {
    expect(diagnostic).toContain('data-diagnostic-state="question"');
    expect(diagnostic).toContain('data-diagnostic-state="result"');
    expect(diagnostic.match(/data-primary-action/g)).toHaveLength(2);
    expect(diagnostic).toContain("pendingFocus");
    expect(diagnostic).toContain("setChoices({})");
    expect(diagnostic).not.toContain("Card");
    expect(diagnostic).not.toContain("IconTile");
  });

  it("keeps purposeful result motion reduced and exact values semantic", () => {
    expect(diagnostic).toContain("useReducedMotion");
    expect(source("./dimension-bars.tsx")).toContain('role="progressbar"');
    expect(source("./dimension-bars.tsx")).toContain(
      "prefersReducedMotion ? 0",
    );
    expect(source("./radar-chart.tsx")).toContain('aria-hidden="true"');
    expect(source("./radar-chart.tsx")).toContain("prefersReducedMotion ? 0");
  });
});
