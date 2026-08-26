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

  it.each(SURFACES)("keeps %s flat and free of decorative motion", (path) => {
    expect(source(path)).not.toMatch(
      /(?:shadow-(?:card|card-hover|tile)|shadow-\[|hover:-translate|active:translate|transition-all|rounded-full|linear-gradient|demo-corner)/,
    );
  });

  it.each(SURFACES)("keeps %s scene gaps at 48px or less", (path) => {
    expect(source(path)).not.toMatch(
      /\b(?:py-(?:14|16|20|24|28|32)|(?<!scroll-)mt-(?:14|16|20|24|28|32)|gap-(?:14|16|20|24|28|32))\b/,
    );
  });

  it("uses a uniform preview atlas without the bento or repeated stats layout", () => {
    expect(source("demo-grid.tsx")).toContain("md:grid-cols-2");
    expect(source("demo-tile.tsx")).not.toMatch(/SIZE_CLASS|grid-column:span/);
    expect(source("../../app/demos/page.tsx")).not.toContain(
      "copy.catalog.stats.map",
    );
  });

  it("renders reviewed metrics statically rather than counting them up", () => {
    const table = source("animated-meta-table.tsx");
    expect(table).not.toMatch(
      /requestAnimationFrame|IntersectionObserver|useMotionAllowed/,
    );
    expect(table).toContain("{value}");
  });
});
