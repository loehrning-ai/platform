import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const diagnostic = source("./ki-check-client.tsx");
const diagnosticFrame = source("./diagnostic-frame.tsx");

const ownedSurfaces = [
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

  it("keeps one primary action in each diagnostic state", () => {
    expect(diagnosticFrame).toContain("data-diagnostic-state={state}");
    expect(diagnostic).toContain('<DiagnosticFrame state="question">');
    expect(diagnostic).toContain('<DiagnosticFrame state="result" wide>');
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
