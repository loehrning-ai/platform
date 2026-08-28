import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SURFACES = [
  "../../app/demos/page.tsx",
  "demo-grid.tsx",
  "demo-tile.tsx",
  "demo-detail-layout.tsx",
  "animated-meta-table.tsx",
  "evidence-badge.tsx",
  "demo-shell.tsx",
  "demo-cta.tsx",
] as const;

function source(path: (typeof SURFACES)[number]): string {
  return readFileSync(join(__dirname, path), "utf8");
}

describe("demo atlas visual contract", () => {
  it.each(SURFACES)("keeps %s labels at 12px or larger", (path) => {
    expect(source(path)).not.toMatch(
      /\btext-\[(?:9|10|10\.5|11)px\]\b|fontSize:\s*(?:9|10|11)\b/,
    );
  });

  it.each(SURFACES)("keeps %s geometry and motion bounded", (path) => {
    expect(source(path)).not.toMatch(
      /(?:hover:-translate|active:translate|transition-all|rounded-full|linear-gradient|demo-corner)/,
    );
  });

  it.each(SURFACES)("keeps %s scene gaps at 48px or less", (path) => {
    expect(source(path)).not.toMatch(
      /\b(?:py-(?:14|16|20|24|28|32)|(?<!scroll-)mt-(?:14|16|20|24|28|32)|gap-(?:14|16|20|24|28|32))\b/,
    );
  });

  it("uses the registry hierarchy for a preview-led bento atlas", () => {
    const grid = source("demo-grid.tsx");
    const tile = source("demo-tile.tsx");
    const hub = source("../../app/demos/page.tsx");

    expect(grid).toContain("lg:grid-cols-4");
    expect(grid).toContain("data-demo-filter-console");
    expect(tile).toContain("tileSizeClass(demo.size)");
    expect(tile).toContain('case "s-hero"');
    expect(tile).toContain("data-demo-preview");
    expect(hub).toContain("copy.catalog.stats.map");
  });

  it("limits tile motion and supplies a static reduced-motion state", () => {
    const tile = source("demo-tile.tsx");

    expect(tile).toContain("transition-[border-color,box-shadow]");
    expect(tile).toContain("transition-transform");
    expect(tile).toContain("motion-reduce:transition-none");
    expect(tile).toContain("motion-reduce:transform-none");
    expect(tile).not.toMatch(/animate-|repeat|autoplay/);
  });

  it("renders reviewed metrics statically rather than counting them up", () => {
    const table = source("animated-meta-table.tsx");
    expect(table).not.toMatch(
      /requestAnimationFrame|IntersectionObserver|useMotionAllowed/,
    );
    expect(table).toContain("{value}");
  });
});
