import { readdirSync, readFileSync } from "node:fs";
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

  it("uses a uniform, preview-led grid with borderless tiles", () => {
    const grid = source("demo-grid.tsx");
    const tile = source("demo-tile.tsx");
    const hub = source("../../app/demos/page.tsx");

    expect(grid).toContain("lg:grid-cols-3");
    expect(grid).toContain("gap-y-12");
    expect(grid).toContain("data-demo-filter-console");
    // Filters sit under a Kopflinie section head as square chips.
    expect(grid).toContain("border-t-2 border-foreground");
    expect(grid).toContain("FILTER_CHIP_CLASS");
    expect(tile).toContain("data-demo-preview");
    // Blueprint 6.14: no tile border and no card fill; the recessed Beton
    // preview is the only box, and meta is one caption line, not chips.
    expect(tile).not.toMatch(/border border-hairline bg-card|<Chip/);
    expect(tile).toContain("bg-inset");
    expect(tile).toContain("text-caption text-muted-foreground");
    expect(tile).not.toMatch(/bg-foreground|dark-section|demo\.dark/);
    // Copy is written to fit: no clamp from sm up. Below sm the tile is a
    // ledger row (blueprint 6.6) without the drawing and with two lines.
    expect(tile).not.toMatch(/(?<!max-sm:)line-clamp/);
    expect(tile).toContain("max-sm:hidden");
    expect(grid).toContain("max-sm:divide-y max-sm:divide-hairline");
    // Stats are the shared StatRow, with values derived from the registry.
    expect(hub).toContain("<StatRow");
    expect(hub).toContain("stats={stats}");
    expect(hub).toContain("demos.length");
  });

  it("aligns every demo surface to the site column", () => {
    for (const path of ["../../app/demos/page.tsx", "demo-detail-layout.tsx"] as const) {
      expect(source(path)).toContain("max-w-6xl");
      expect(source(path)).not.toContain("max-w-[75rem]");
    }
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
    // Hover darkens the preview panel one tone.
    expect(tile).toContain("group-hover:bg-[color-mix(");
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

/*
 * The interactive engines (*-demo.tsx) sit inside the calm detail frame, so
 * they carry the same Werkzeichnung rules: no kicker or slogan header over
 * the page H1, no Tailwind-orange washes or glows, no app chrome, no
 * decorative textures, no looping animation, no coloured left rules and no
 * mono-uppercase tracked labels.
 */
const ENGINES = readdirSync(__dirname)
  .filter((file) => /-demo\.tsx$/.test(file))
  .sort();

function engine(file: string): string {
  return readFileSync(join(__dirname, file), "utf8");
}

describe("demo engine visual contract", () => {
  it("covers every engine file", () => {
    expect(ENGINES.length).toBeGreaterThanOrEqual(12);
  });

  it.each(ENGINES)("keeps %s headings plain: no visible h2 slogan, no two-colour h2", (file) => {
    const text = engine(file);
    // The page H1 and lead name the demo; an engine h2 is an sr-only landmark.
    for (const match of text.matchAll(/<h2\b[^>]*>/g)) {
      expect(match[0], file).toContain('className="sr-only"');
    }
    expect(text).not.toMatch(
      /<h2\b[^>]*>(?:(?!<\/h2>)[\s\S])*color: "var\(--color-brand-orange\)"(?:(?!<\/h2>)[\s\S])*<\/h2>/,
    );
  });

  it.each(ENGINES)("keeps %s on the deck palette without glows, textures or app chrome", (file) => {
    const text = engine(file);
    // Off-palette Tailwind orange (#f97316) washes and glows.
    expect(text).not.toMatch(/rgba\(\s*249\s*,\s*115\s*,\s*22/);
    // Product title bars (Excel green, Word blue) and dot-grid canvases.
    expect(text).not.toMatch(/#107C41|#2B579A/i);
    expect(text).not.toMatch(/radial-gradient\(/);
    // Offset stamp shadows, inline or in scoped CSS.
    expect(text).not.toMatch(/\b\d+px \d+px 0(?: 0)? (?:var|\$\{|#|rgba)/);
  });

  it.each(ENGINES)("keeps %s motion finite and its rules and labels calm", (file) => {
    const text = engine(file);
    expect(text).not.toMatch(/\binfinite\b/);
    expect(text).not.toMatch(/borderLeft:\s*[`"][3-9]px/);
    expect(text).not.toMatch(/textTransform:\s*"uppercase"/);
    expect(text).not.toMatch(/letterSpacing:\s*"0\.(?:0[89]|1\d?)\d*em"/);
    expect(text).not.toMatch(/letterSpacing:\s*"-0\.0[2-9]/);
  });
});
