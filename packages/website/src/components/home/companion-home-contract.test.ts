import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The companion home is one document with two layouts, not two documents.
 *
 * Below `lg` the page opens with one graphit hero band (the two-line promise,
 * the horizon globe, the primary action and the docked "continue" seat),
 * then two horizontal rails and compact hairline rows; from `lg` it is the
 * reviewed wide layout, unchanged. These assertions pin the two properties
 * that make that safe:
 *
 *  1. every phone compaction is expressed as a `max-lg:` / `max-sm:` override
 *     on top of the wide-layout utility, or in the hero's phone stylesheet,
 *     which is scoped to `width < 64rem` as a whole, so nothing can leak
 *     upward into the reviewed desktop geometry;
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
    // Below lg the band's geometry lives in phone-hero.css; the section only
    // drops its desktop offsets there.
    for (const companion of ["max-lg:mt-0", "max-lg:p-0"]) {
      expect(hero, `hero lost the companion ${companion}`).toContain(
        companion,
      );
    }
    expect(hero).toContain('import "./phone-hero.css";');
  });

  it("scopes every phone hero rule below lg", () => {
    const css = read("phone-hero.css");
    // Strip comments, then check that every rule block that styles the hero
    // band sits inside a `width < 64rem` media query (the pause control and
    // the keyframes are the only top-level rules).
    const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const topLevel: string[] = [];
    let depth = 0;
    let current = "";
    for (const char of source) {
      if (char === "{") {
        if (depth === 0) topLevel.push(current.trim());
        depth++;
        current = "";
      } else if (char === "}") {
        depth--;
        current = "";
      } else if (depth === 0) {
        current += char;
      }
    }
    for (const prelude of topLevel) {
      const allowed =
        /^@media \(width < 64rem\)/.test(prelude) ||
        /^@media \(48rem <= width < 64rem\)/.test(prelude) ||
        /^@media \(width < 22\.5rem\)/.test(prelude) ||
        /^@media \(width >= 64rem\)/.test(prelude) ||
        /^@keyframes hz-/.test(prelude) ||
        /^\.phone-globe-toggle/.test(prelude);
      expect(allowed, `unscoped phone hero rule: ${prelude}`).toBe(true);
    }
    // The band is a min-height, never a fixed height, and sized from the
    // shell tokens only.
    expect(css).toContain(
      "100svh - var(--nav-h-compact) - var(--tabbar-band-h) - 1px",
    );
    expect(css).not.toMatch(/\b100vh\b/);
    expect(css).not.toMatch(/(?<![\w-])height:\s*calc\(\s*100svh/);
    // The opening only exists without a reduced-motion preference, and no
    // animation in the band repeats.
    expect(css).toContain(
      "@media (width < 64rem) and (prefers-reduced-motion: no-preference)",
    );
    expect(css).not.toMatch(/\binfinite\b/);
  });

  it("keeps the desktop headline clamp byte-identical, above lg only", () => {
    const hero = read("hero.tsx");

    expect(hero).toContain(
      "@media (min-width: 64rem) {\n          [data-section=\"hero\"] h1 { font-size: clamp(2.25rem, min(8.4vw, 12.5svh), 8rem); }",
    );
    // Below lg: the full two-line promise, "Sicher anwenden." at about 8.2
    // times the font size, inside a 16px gutter from 320px up.
    expect(hero).toContain(
      '[data-section="hero"] h1 { font-size: clamp(2rem, 11.5vw - 0.25rem, 3rem); }',
    );
    // The short-viewport padding override belongs to the desktop pill; below
    // lg the utilities own the band.
    expect(hero).toContain("@media (min-width: 64rem) and (max-height: 680px)");
  });

  it("keeps exactly one h1 element, visible at every width", () => {
    const hero = read("hero.tsx");

    expect(hero.match(/<h1\b/g)).toHaveLength(1);
    // One lockup for every width: two lines below lg, the reviewed three
    // lines from lg, never a second heading. Two shipped specs count `h1`
    // elements in the DOM, not just the accessible ones. The desktop print
    // shadow exists from lg only; the phone band is flat graphit.
    expect(hero).toContain('"lg:drop-shadow-[0_3px_0_rgba(255,255,255,0.45)] "');
    expect(hero).toContain('<br className="max-lg:hidden" />');
    expect(hero).toContain('aria-label={copy.headline.join(" ")}');
  });

  it("hides the hero pillars below lg instead of restyling them", () => {
    const hero = read("hero.tsx");
    expect(hero).toContain("max-lg:hidden");
    // The pillar row itself is untouched apart from that one class.
    expect(hero).toContain("sm:grid-cols-3");
    expect(hero).toContain("md:mt-8 lg:mt-10");
  });

  it("keeps every section's compact companion band below lg", () => {
    for (const file of [
      "offering.tsx",
      "workflow.tsx",
      "credibility-strip.tsx",
    ]) {
      const source = read(file);
      expect(source, `${file} companion band`).toContain("max-lg:py-5");
      // Every section opens with the shared Kopflinie head.
      expect(source, `${file} section head`).toContain("<HomeSectionHead");
      // One gutter with the header, the phone hero, the footer and
      // /ueber-mich: 16px on a phone, never the old 24px px-6 md:px-12.
      expect(source, `${file} container`).toContain("HOME_CONTAINER");
      expect(source, `${file} gutter`).not.toMatch(/\bmd:px-12\b/);
    }
    // The rails open with the same head, and no eyebrow beside it.
    expect(read("mobile-rails.tsx")).toContain("<HomeSectionHead");
    expect(read("mobile-rails.tsx")).not.toContain("RailHeading");
    // One section head site-wide: the home head is the werk SectionHead in
    // its compact size (22px phone h2), with no kicker of its own.
    const head = read("home-section-head.tsx");
    expect(head).toContain("<SectionHead");
    expect(head).toContain('size="compact"');
    expect(head).not.toMatch(/readonly kicker|kicker=/);
  });
});

describe("companion home: Werkzeichnung below the hero", () => {
  // The risograph look (pastel washes, rounded shadowed cards, cobalt and
  // acid buttons, hover lifts, mono all-caps eyebrows, side stripes) is
  // retired on every section below the hero.
  const FILES = [
    "offering.tsx",
    "workflow.tsx",
    "credibility-strip.tsx",
    "course-artwork.tsx",
    "home-section-head.tsx",
    "mobile-rails.tsx",
    "continue-card.tsx",
    "continue-slot.tsx",
  ] as const;
  const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
    [/\b(?:bg|text|border|ring)-brand-(?:acid|sky|pink|peach|cobalt|teal)\b/, "risograph palette"],
    [/\bshadow-(?:card|\[)/, "card shadow"],
    [/\brounded-(?:xl|2xl|full|\[)/, "rounded card"],
    [/hover:-?translate-|group-hover:-?translate-[xy]-|hover:-?rotate|group-hover:scale/, "hover lift"],
    [/\bfont-ui-mono\b|\buppercase\b/, "mono all-caps eyebrow"],
    [/border-l-\[[3-9]px\]/, "side stripe"],
    [/\bblur-2xl\b|\bfont-black\b/, "decoration"],
    [/tracking-\[-0\.0[2-9]/, "crushed headline tracking"],
    [/from "lucide-react"/, "a second icon family"],
  ];

  it.each(FILES)("keeps %s flat, square and ink", (file) => {
    const source = read(file);
    for (const [pattern, label] of BANNED) {
      expect(source, `${file}: ${label}`).not.toMatch(pattern);
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

  it("keeps the course artwork a lazy, wide-layout-only plate", () => {
    const artwork = read("course-artwork.tsx");
    // Below lg the course rows are hairline rows led by their number: the
    // risograph plate is not rendered, so its lazy image is never requested
    // on a phone. From lg it is the reviewed plate, loaded lazily.
    expect(artwork).toContain("max-lg:hidden");
    expect(artwork).toContain('loading="lazy"');
    expect(artwork).not.toContain("(max-width: 639px) 72px");
    const offering = read("offering.tsx");
    expect(offering).toContain("max-lg:contents");
    expect(offering).toContain("max-lg:grid-cols-[1.75rem_minmax(0,1fr)_auto]");
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
    expect(slot).toContain('className="box-content h-[3.5rem] border-t border-hairline"');
    expect(slot).toContain("lg:hidden");
  });
});

describe("companion home: page order", () => {
  it("docks the continue seat in the hero and puts the rails after the course section", () => {
    const page = readFileSync(
      join(__dirname, "..", "..", "app", "page.tsx"),
      "utf8",
    );
    // The hero comes first; the continue seat is handed to it and docks as the
    // band's last row above the tab bar (in the thumb zone), so the promise
    // and the globe open the page.
    const hero = page.indexOf("<HeroSection");
    const heroEnd = page.indexOf("/>", page.indexOf("continueSlot=", hero));
    const seat = page.indexOf("<ContinueSlot");
    expect(seat).toBeGreaterThan(hero);
    expect(seat).toBeLessThan(heroEnd);
    expect(page).toContain("phoneGlobe={<HorizonGlobeFrame />}");
    const order = [
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
