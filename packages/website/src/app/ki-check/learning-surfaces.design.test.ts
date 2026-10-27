import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const diagnostic = source("./ki-check-client.tsx");

describe("standalone learning surface semantics", () => {
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
