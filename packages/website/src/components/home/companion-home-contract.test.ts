import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The companion home is one document with two layouts, not two documents.
 *
 * Below `lg` the page is a reserved "continue" seat, a one-line headline, two
 * horizontal rails and compact rows; from `lg` it is the reviewed wide layout,
 * unchanged. These assertions pin the two properties that make that safe:
 *
 *  1. every phone compaction is expressed as a `max-lg:` / `max-sm:` override
 *     on top of the wide-layout utility, so nothing can leak upward into the
 *     reviewed desktop geometry;
 *  2. the sections that ship measured layout hooks stay vertical stacks. Two
 *     shipped specs read `[data-home-course-card]` / `[data-home-resource-card]`
 *     rects at 320/390/768/1440 and require them inside the viewport, and one
 *     requires the four course artworks to be loaded at 390px. A horizontal
 *     scroller in those two sections would break both, which is why the rails
 *     live in their own mobile-only section with its own tiles.
 */

const HOME = join(__dirname);

function read(file: string): string {
  return readFileSync(join(HOME, file), "utf8");
}

describe("companion home: the wide layout is untouched", () => {
  it("keeps the hero's reviewed desktop geometry and adds phone-only overrides", () => {
    const hero = read("hero.tsx");

    for (const reviewed of [
      "-mt-16",
      "pt-24",
      "md:px-12",
      "md:pb-10",
      "md:pt-24",
      "lg:min-h-[38rem]",
      "lg:pb-12",
    ]) {
      expect(hero, `hero lost the reviewed ${reviewed}`).toContain(reviewed);
    }
    for (const companion of ["max-lg:mt-0", "max-lg:pb-5", "max-lg:pt-4"]) {
      expect(hero, `hero lost the companion ${companion}`).toContain(
        companion,
      );
    }
  });

  it("keeps the desktop headline clamp byte-identical, above lg only", () => {
    const hero = read("hero.tsx");

    expect(hero).toContain(
      "@media (min-width: 64rem) {\n          [data-section=\"hero\"] h1 { font-size: clamp(2.25rem, min(8.4vw, 12.5svh), 8rem); }",
    );
    expect(hero).toContain(
      '[data-section="hero"] h1 { font-size: clamp(2rem, 8.6vw, 2.75rem); }',
    );
    // The short-viewport padding override belongs to the desktop pill; below
    // lg the utilities own the band.
    expect(hero).toContain("@media (min-width: 64rem) and (max-height: 680px)");
  });

  it("keeps exactly one h1 element, visible at every width", () => {
    const hero = read("hero.tsx");

    expect(hero.match(/<h1\b/g)).toHaveLength(1);
    // One line below lg, the three-line lockup from lg: two spans inside the
    // same heading, never a second heading. Two shipped specs count `h1`
    // elements in the DOM, not just the accessible ones.
    expect(hero).toContain('drop-shadow-[0_3px_0_rgba(255,255,255,0.45)] lg:hidden');
    expect(hero).toContain('<span className="hidden lg:inline">');
    expect(hero).toContain('aria-label={copy.headline.join(" ")}');
  });

  it("hides the hero pillars below lg instead of restyling them", () => {
    const hero = read("hero.tsx");
    expect(hero).toContain("max-lg:hidden");
    // The pillar row itself is untouched apart from that one class.
    expect(hero).toContain("sm:grid-cols-3");
    expect(hero).toContain("md:mt-8 lg:mt-10");
  });

  it("keeps every section's desktop band and adds a compact companion band", () => {
    for (const file of [
      "offering.tsx",
      "workflow.tsx",
      "credibility-strip.tsx",
    ]) {
      const source = read(file);
      expect(source, `${file} desktop band`).toContain("lg:py-24");
      expect(source, `${file} tablet band`).toContain("md:py-20");
      expect(source, `${file} companion band`).toContain("max-lg:py-5");
    }
  });
});

describe("companion home: measured layout hooks stay in a vertical stack", () => {
  it("keeps the hooks the shipped width matrix reads", () => {
    expect(read("offering.tsx")).toContain("data-home-course-card");
    expect(read("workflow.tsx")).toContain("data-home-resource-card");
    expect(read("course-artwork.tsx")).toContain("data-course-artwork");
  });

  it("never puts those sections into a horizontal scroller", () => {
    for (const file of ["offering.tsx", "workflow.tsx", "credibility-strip.tsx"]) {
      const source = read(file);
      expect(source, `${file} must not scroll horizontally`).not.toContain(
        "overflow-x-auto",
      );
      expect(source, `${file} must not scroll-snap`).not.toContain("snap-x");
    }
  });

  it("keeps the four course artworks rendered and lazily loaded on a phone", () => {
    const artwork = read("course-artwork.tsx");
    // Present at every width (only its plate shrinks), so the shipped
    // "artwork is loaded at 390px" assertion keeps passing.
    expect(artwork).toContain("min-h-[4.75rem]");
    expect(artwork).toContain("sm:min-h-0");
    expect(artwork).toContain('loading="lazy"');
    expect(artwork).toContain("(max-width: 639px) 72px");
  });
});

describe("companion home: the continue island stays small", () => {
  it("keeps the catalog and the resume resolver out of the client graph", () => {
    for (const file of ["continue-slot.tsx", "continue-card.tsx"]) {
      const source = read(file);
      expect(source, `${file} must be a client module`).toContain(
        '"use client"',
      );
      // The catalog is 31KB, its English copy layer 10KB, and the canonical
      // resume resolver reaches every per-course reader config. Course facts
      // arrive as props from the server instead (continue-courses.ts).
      expect(source, `${file} imports the catalog`).not.toMatch(
        /from "@\/lib\/courses\/catalog/,
      );
      expect(source, `${file} imports the resume resolver`).not.toMatch(
        /from "@\/lib\/courses\/resume"/,
      );
      expect(source, `${file} imports a course config`).not.toMatch(
        /from "@\/lib\/course\/config"/,
      );
    }
  });

  it("builds the course facts on the server and never marks them client", () => {
    const source = read("continue-courses.ts");
    expect(source).not.toContain('"use client"');
    expect(source).toContain('from "@/lib/courses/catalog"');
    expect(source).toContain("localizeHref");
    expect(source).toContain("getCourseAccess()");
  });

  it("keeps readiness modules out of the home and atlas client graph", () => {
    for (const file of [
      "continue-card.tsx",
      "continue-slot.tsx",
      "../../app/kurse/learning-atlas.tsx",
      "../../app/kurse/course-ledger-row.tsx",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(/from "@\/lib\/(?:runtime-features|provider-readiness|auth\/routes)"/);
      for (const line of source.split("\n")) {
        if (line.includes('from "@/lib/courses/access"')) {
          expect(line.trimStart()).toMatch(/^import type /);
        }
      }
    }
  });

  it("defers the card and reserves its seat before it arrives", () => {
    const slot = read("continue-slot.tsx");
    expect(slot).toContain('{ ssr: false }');
    expect(slot).toContain('className="h-[4.75rem]"');
    expect(slot).toContain("lg:hidden");
  });
});

describe("companion home: page order", () => {
  it("puts the continue seat first and the rails after the course section", () => {
    const page = readFileSync(
      join(__dirname, "..", "..", "app", "page.tsx"),
      "utf8",
    );
    const order = [
      "<ContinueSlot",
      "<HeroSection",
      "<Offering",
      "<MobileRails",
      "<Workflow",
      "<CredibilityStrip",
    ].map((token) => {
      const index = page.indexOf(token);
      expect(index, `page.tsx is missing ${token}`).toBeGreaterThan(-1);
      return index;
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
