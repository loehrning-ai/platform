import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The companion home is one document with two layouts, not two documents.
 *
 * The page opens with the paper hero at every width. Below `lg` it holds the
 * "continue" seat, the two-line promise, the primary action and a window
 * onto the line globe, then two horizontal rails and the pastel boards
 * follow; from `lg` it is the wide paper hero (the three-ink lockup left,
 * the line globe behind the right half, the pastel step cards) and the page
 * is the wide layout. These assertions pin the two properties that make
 * that safe:
 *
 *  1. every phone compaction is expressed as a `max-lg:` / `max-sm:` override
 *     on top of the wide-layout utility, or in the hero's stylesheet, whose
 *     phone geometry is scoped to `width < 64rem`, so nothing can leak
 *     upward into the desktop geometry;
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

describe("companion home: the wide layout stays separate", () => {
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
    // band sits inside a `width < 64rem` media query. The only top-level
    // rules are the pause control and the keyframes, which hold at every
    // width: the paper hero sets no tokens of its own.
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
        /^\.globe-toggle/.test(prelude);
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

  it("sets the three-line lockup from lg, the two-line promise below", () => {
    const hero = read("hero.tsx");

    expect(hero).toContain(
      "@media (min-width: 64rem) {\n          [data-section=\"hero\"] h1 { font-size: clamp(2.25rem, min(8.4vw, 12.5svh), 8rem); }",
    );
    // Below lg: "KI verstehen." and "Sicher anwenden." on two lines inside
    // a 24px gutter from 320px up.
    expect(hero).toContain(
      '[data-section="hero"] h1 { font-size: clamp(1.875rem, 9.6vw - 0.125rem, 2.75rem); }',
    );
    // The short-viewport padding override belongs to the wide hero; below
    // lg phone-hero.css owns the band.
    expect(hero).toContain("@media (min-width: 64rem) and (max-height: 680px)");
  });

  it("keeps exactly one h1 element, visible at every width", () => {
    const hero = read("hero.tsx");

    expect(hero.match(/<h1\b/g)).toHaveLength(1);
    // One lockup for every width in the three inks, never a second heading.
    // Two shipped specs count `h1` elements in the DOM, not just the
    // accessible ones.
    expect(hero).toContain('aria-label={copy.headline.join(" ")}');
  });

  it("draws the hero on paper: three inks, print shadow, pastel geometry, no poster band", () => {
    const hero = read("hero.tsx");
    const css = read("phone-hero.css");
    const source = css.replace(/\/\*[\s\S]*?\*\//g, "");

    for (const kept of [
      "berlin-grain",
      "berlin-hero",
      "headlineColors",
      "text-brand-cobalt",
      "text-brand-orange",
      "drop-shadow-[0_3px_0_rgba(255,255,255,0.45)]",
      "RegisterMark",
      "bg-brand-pink/50",
      "-rotate-12",
      "pillarTones",
      "bg-brand-acid/65",
      "bg-brand-peach/55",
      "bg-brand-sky/60",
      "border-brand-cobalt bg-brand-cobalt text-white",
      "shadow-card",
    ]) {
      expect(hero, `hero lost ${kept}`).toContain(kept);
    }
    // No poster band, scene switch or dark ground anywhere in the hero.
    for (const retired of [
      "poster-title",
      "CapsLine",
      "HOME_SCENE",
      "data-plakat-band",
      "data-home-scene",
      "surface=\"dark\"",
    ]) {
      expect(hero, `hero still carries ${retired}`).not.toContain(retired);
    }
    expect(source).not.toMatch(/--color-(?:background|foreground)\s*:/);
    expect(source).not.toMatch(/#152a79|#141414|#1c1b1a|#b73a15/i);
  });

  it("hides the hero pillars below lg instead of restyling them", () => {
    const hero = read("hero.tsx");
    expect(hero).toContain("max-lg:hidden");
    // The pillar register is three pastel step cards, three columns from sm.
    expect(hero).toContain("sm:grid-cols-3");
    expect(hero).toContain("rounded-2xl border border-foreground/10");
    expect(hero).toContain("md:mt-8 lg:mt-10");
  });

  it("keeps the course section's compact companion band below lg", () => {
    const source = read("offering.tsx");
    expect(source, "offering.tsx companion band").toContain("max-lg:py-5");
    // The old paper home's measure, as on the boards below it: the hero's
    // max-w-6xl column and its 24px / 48px gutter, and a plain h2.
    expect(source, "offering.tsx container").toContain(
      "mx-auto max-w-6xl px-6 md:px-12",
    );
    expect(source, "offering.tsx heading").toMatch(/<h2\b/);
    // One section head site-wide: the home head is the werk SectionHead in
    // its compact size (22px phone h2), with no kicker of its own.
    const head = read("home-section-head.tsx");
    expect(head).toContain("<SectionHead");
    expect(head).toContain('size="compact"');
    expect(head).not.toMatch(/readonly kicker|kicker=/);
  });

  it("keeps the paper sections on the hero's gutter with a compact band below lg", () => {
    for (const file of ["workflow.tsx"]) {
      const source = read(file);
      expect(source, `${file} companion band`).toContain("max-lg:py-6");
      // The old paper home's measure: the hero's max-w-6xl column and its
      // 24px / 48px gutter.
      expect(source, `${file} container`).toContain(
        "mx-auto max-w-6xl px-6 md:px-12",
      );
      expect(source, `${file} heading`).toMatch(/<h2\b/);
    }
    // The rails open with a plain h2 each, and no eyebrow beside it.
    const rails = read("mobile-rails.tsx");
    expect(rails.match(/<h2\b/g)).toHaveLength(2);
    expect(rails).not.toContain("RailHeading");
    expect(rails).not.toMatch(/\buppercase\b|font-ui-mono/);
  });
});

describe("companion home: Werkzeichnung in the section head", () => {
  // The shared section head keeps its Werkzeichnung look (flat, square,
  // ink). The course section itself is back on the pastel cards with the
  // people pictures (offering.tsx, course-artwork.tsx), checked below.
  const FILES = ["home-section-head.tsx"] as const;
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

describe("companion home: the paper look, never a dark ground", () => {
  const PAPER = [
    "hero.tsx",
    "phone-hero.css",
    "hero-network.tsx",
    "hero-globe-frame.tsx",
    "workflow.tsx",
    "pointer-depth-classes.ts",
    "mobile-rails.tsx",
    "continue-card.tsx",
    "continue-slot.tsx",
    "offering.tsx",
    "course-artwork.tsx",
  ] as const;
  const DARK =
    /\bbg-(?:graphit|black|foreground|neutral-9\d\d|zinc-9\d\d|stone-9\d\d)\b|\bdark-section\b|#141414|#111111|#1a1a1a|#1c1b1a|#152a79/i;

  it.each(PAPER)("sets %s on light grounds only", (file) => {
    expect(read(file)).not.toMatch(DARK);
  });

  it("gives every section below the hero a pastel wash or pastel cards", () => {
    expect(read("workflow.tsx")).toContain("bg-brand-peach/20");
    expect(read("mobile-rails.tsx")).toMatch(/bg-brand-(?:sky|acid|peach|pink)\//);
    expect(read("continue-card.tsx")).toContain("bg-brand-acid/60");
    expect(read("offering.tsx")).toMatch(/bg-brand-(?:acid|peach|sky|pink)\/\d+/);
  });
});

describe("companion home: hover depth on the two boards", () => {
  it("wraps the course route and the resource board in one pointer list each", () => {
    for (const file of ["offering.tsx", "workflow.tsx"]) {
      const source = read(file);
      expect(source, `${file} list`).toContain("<PointerDepthList");
      expect(source, `${file} card hook`).toContain("data-depth-card");
      expect(source, `${file} card transform`).toContain("POINTER_DEPTH_CARD");
      expect(source, `${file} light`).toContain("POINTER_DEPTH_LIGHT");
      // Reduced motion holds the cards flat and still: no tilt, no lift.
      expect(source).toContain("motion-reduce:transform-none");
      expect(source).toContain("motion-reduce:translate-none");
    }
  });

  it("keeps the depth to the pointer, small and server-static", () => {
    const list = read("pointer-depth.tsx");
    expect(list).toContain('"use client"');
    expect(list).toContain('event.pointerType !== "mouse"');
    expect(list).toContain("requestAnimationFrame");
    expect(list).toContain('"(prefers-reduced-motion: reduce)"');
    expect(list).toMatch(/POINTER_DEPTH_MAX_TILT = [1-5];/);
    expect(list).not.toMatch(/setInterval|\binfinite\b/);
    const classes = read("pointer-depth-classes.ts");
    expect(classes).not.toContain('"use client"');
    expect(classes).toContain("var(--depth-rx,0deg)");
  });
});

describe("companion home: measured layout hooks stay in a vertical stack", () => {
  it("keeps the hooks the shipped width matrix reads", () => {
    expect(read("offering.tsx")).toContain("data-home-course-card");
    expect(read("workflow.tsx")).toContain("data-home-resource-card");
    expect(read("course-artwork.tsx")).toContain("data-course-artwork");
  });

  it("never puts those sections into a horizontal scroller", () => {
    for (const file of ["offering.tsx", "workflow.tsx"]) {
      const source = read(file);
      expect(source, `${file} must not scroll horizontally`).not.toContain(
        "overflow-x-auto",
      );
      expect(source, `${file} must not scroll-snap`).not.toContain("snap-x");
    }
  });

  it("keeps the course artwork the people picture in a registration frame at every width", () => {
    const artwork = read("course-artwork.tsx");
    // The course's people picture (public/course-covers), lazy and
    // decorative, at every width: a 72px crop at the card's left edge below
    // sm (so the four pictures load at 390px too), the 16:7 plate from sm.
    expect(artwork).toContain('from "next/image"');
    expect(artwork).toContain("coursePeoplePicture");
    expect(artwork).toContain('alt=""');
    expect(artwork).toContain('loading="lazy"');
    expect(artwork).toContain("(max-width: 639px) 220px");
    expect(artwork).toContain("sm:aspect-[16/7]");
    expect(artwork).not.toContain("max-lg:hidden");
    // The registration layers move with hover and focus, never under
    // reduced motion.
    expect(artwork).toContain("group-hover:-translate-x-1");
    expect(artwork).toContain("motion-reduce:transform-none");
    const offering = read("offering.tsx");
    expect(offering).toContain("grid-cols-[4.5rem_minmax(0,1fr)]");
    expect(offering).toContain("<CourseArtwork");
    expect(offering).not.toContain("<PosterThumb");
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
  it("seats the continue card in the hero and puts the rails after the course section", () => {
    const page = readFileSync(
      join(__dirname, "..", "..", "app", "page.tsx"),
      "utf8",
    );
    // The hero comes first; the continue seat is handed to it and opens the
    // phone band as its first row, above the promise and the globe.
    const hero = page.indexOf("<HeroSection");
    const heroEnd = page.indexOf("/>", page.indexOf("continueSlot=", hero));
    const seat = page.indexOf("<ContinueSlot");
    expect(seat).toBeGreaterThan(hero);
    expect(seat).toBeLessThan(heroEnd);
    expect(page).toContain("phoneGlobe={<HeroGlobeFrame />}");
    const order = [
      "<HeroSection",
      "<Offering",
      "<MobileRails",
      "<Workflow",
    ].map((token) => {
      const index = page.indexOf(token);
      expect(index, `page.tsx is missing ${token}`).toBeGreaterThan(-1);
      return index;
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // The resource board closes the page: the Ground rules strip is gone and
    // its account boundary lives in the board's cobalt band.
    expect(page).not.toContain("CredibilityStrip");
    expect(page).not.toContain("credibility-strip");
    const afterBoard = page.slice(page.indexOf("<Workflow") + 1);
    expect(afterBoard, "no section after the resource board").not.toMatch(
      /<[A-Z]/,
    );
  });
});
