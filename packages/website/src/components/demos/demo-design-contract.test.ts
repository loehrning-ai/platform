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

  it("uses the registry hierarchy for a calm, preview-led bento", () => {
    const grid = source("demo-grid.tsx");
    const tile = source("demo-tile.tsx");
    const hub = source("../../app/demos/page.tsx");

    expect(grid).toContain("lg:grid-cols-4");
    expect(grid).toContain("data-demo-filter-console");
    // Filters sit under a Kopflinie section head as square chips.
    expect(grid).toContain("border-t-2 border-foreground");
    expect(grid).toContain("FILTER_CHIP_CLASS");
    expect(tile).toContain("tileSizeClass(demo.size)");
    expect(tile).toContain('case "s-hero"');
    expect(tile).toContain("data-demo-preview");
    // Every tile is the same paper sheet with a hairline edge; the preview
    // is a recessed Beton band. No dark tiles inside the paper grid.
    expect(tile).toContain("border border-hairline bg-card");
    expect(tile).toContain("bg-inset");
    expect(tile).not.toMatch(/bg-foreground|dark-section|demo\.dark/);
    // Stats are the shared StatRow, with values derived from the registry.
    expect(hub).toContain("<StatRow stats={stats}");
    expect(hub).toContain("demos.length");
  });

  it.each(SURFACES)("keeps %s free of the brutalist look", (path) => {
    const text = source(path);
    // Offset stamp shadows, mono-uppercase eyebrows, orange left rules,
    // two-tone accent headings and crushed display tracking are retired.
    expect(text).not.toMatch(/shadow-\[\d+px_\d+px_0/);
    expect(text).not.toMatch(/\buppercase\b/);
    expect(text).not.toMatch(/border-l-\[[3-9]px\]/);
    expect(text).not.toMatch(/font-black|tracking-\[-0\.0[3-9]/);
    expect(text).not.toMatch(/bg-brand-(?:acid|sky|pink|peach|cobalt|teal)/);
    expect(text).not.toMatch(/\brounded-(?:sm|md|lg|xl|2xl)\b/);
  });

  it("limits tile motion to a colour change with a static reduced-motion state", () => {
    const tile = source("demo-tile.tsx");

    expect(tile).toContain("transition-colors");
    expect(tile).toContain("hover:border-foreground");
    expect(tile).toContain("motion-reduce:transition-none");
    expect(tile).toContain("motion-reduce:transform-none");
    // No hover lift, scale or offset shadow.
    expect(tile).not.toMatch(/hover:shadow|group-hover:scale|hover:scale|translate-y/);
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
