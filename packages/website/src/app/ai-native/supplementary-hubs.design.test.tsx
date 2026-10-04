import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getCrawlRoute } from "@/lib/crawl/contract";

// The only supplementary hub left beside the course is the glossary. The
// self-assessment, simulation gallery and capstone rules pages were retired
// with the tool-neutral rebuild and now redirect.

describe("AI-Native supplementary hub design contract", () => {
  it("keeps the glossary view compact, flat, and legible", () => {
    const source = readFileSync(
      join(__dirname, "../../components/ai-native/glossary-view.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(
      /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:5|6\d*|7(?:[0-4]\d*)?)rem\]/,
    );
    expect(source).not.toMatch(/\bshadow-/);
    expect(source).not.toMatch(/hover:-translate/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/BrandButton|components\/ai-native\/primitives/);
  });

  it.each([
    ["fluency-test", "/ai-native"],
    ["capstone-gallery", "/ai-native"],
    ["demos", "/demos"],
  ])("retires /ai-native/%s with a permanent redirect to %s", (segment, target) => {
    expect(existsSync(join(__dirname, segment, "page.tsx"))).toBe(false);
    const route = getCrawlRoute(`/ai-native/${segment}`);
    expect(route).toMatchObject({
      routeClass: "retired",
      auth: "redirect",
      redirectTo: target,
      status: 301,
    });
  });
});
