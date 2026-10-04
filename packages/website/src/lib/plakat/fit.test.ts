import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { splitTitle } from "@/app/workshops/workshop-title";
import { BOOK_PAGE_COPY } from "@/app/buecher/book-copy";
import { ENTRY_COPY } from "@/lib/i18n/public-info-copy";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import { demoName } from "@/lib/demos";
import { getDemosForLocale } from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { getWorkshops } from "@/lib/workshops";
import {
  breakSegments,
  fallbackFitEm,
  fitEm,
  longestSegment,
  noBreakFirstLine,
  POSTER_FALLBACK_HEADROOM,
  POSTER_FIT_SAFETY,
  POSTER_TITLE_SIZE,
  POSTER_TRACKING_EM,
  posterSizeAt,
  posterTitleSize,
  posterTitleStyle,
  segmentEm,
} from "./fit";
import { BOLD_ADVANCES, TYPE_METRICS_FONT_SHA256 } from "./type-metrics";

const WEBSITE = join(__dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(WEBSITE, path), "utf8");

// ─── The column model (SPEC §3.1, §3.13) ────────────────────────────────────
// Content box of the headline's container at a viewport width, in px. Below
// sm the band pads 16px a side, from sm 24px; from lg the container caps at
// 75rem and a band with art reserves min(36vw, 30rem) + 3rem on the right.
// Desktop widths assume a 15px classic scrollbar, which narrows the layout
// but not the vw the poster size reads.

type Layout = "band-art" | "band" | "course";

const SCROLLBAR = 15;
const VIEWPORTS = [320, 390, 1024, 1280, 1440] as const;

function column(layout: Layout, viewport: number): number {
  if (viewport < 640) return viewport - 32;
  if (viewport < 1024) return viewport - 48;
  const layoutWidth = viewport - SCROLLBAR;
  switch (layout) {
    case "band":
      return Math.min(layoutWidth, 1200) - 48;
    case "band-art":
      return Math.min(layoutWidth, 1200) - 24 - (Math.min(0.36 * viewport, 480) + 48);
    case "course":
      // TechnicalCourseFrame: 72rem track; the header keeps a 20rem right
      // track and a 3rem gap from lg.
      return Math.min(layoutWidth - 48, 1152) - 320 - 48;
  }
}

// ─── The registry: every band H1 set as a poster title, DE and EN ────────────

interface PosterTitle {
  readonly id: string;
  /** The text as the H1 sets it, no-break spaces and soft hyphens included. */
  readonly text: string;
  /** `--fit` as the component writes it, when it adds the fallback headroom. */
  readonly fit?: number;
  /** Copy that lives inside a page file (not exported): each part must still be a literal there. */
  readonly source?: { readonly file: string; readonly parts: readonly string[] };
}

interface Surface {
  readonly name: string;
  readonly layout: Layout;
  /** Files that set the H1 as a .poster-title (one of them must). */
  readonly files: readonly string[];
  readonly titles: readonly PosterTitle[];
}

const LOCALES = ["de", "en"] as const;

/** Page-local copy (not exported): heading parts as they appear in the file. */
function literal(id: string, file: string, parts: readonly string[]): PosterTitle {
  return { id, text: parts.join(" "), source: { file, parts } };
}

const COURSE_LITERALS = [
  { file: "src/app/ki-fuehrerschein/page.tsx", de: ["Welche Daten", "ins KI-Tool dürfen."], en: ["Which data may go", "into an AI tool."] },
  { file: "src/app/eu-ai-act-kurs/page.tsx", de: ["Rollen, Risiken und", "Pflichten einordnen."], en: ["Map roles, risks,", "and duties."] },
  { file: "src/app/ki-und-gesellschaft/page.tsx", de: ["Arbeit, Deepfakes", "und Bias einordnen."], en: ["Assess work, deepfakes,", "and bias."] },
  { file: "src/app/ai-native/page.tsx", de: ["Routinearbeit mit Claude automatisieren."], en: ["Automate routine work with Claude."] },
  { file: "src/app/ai-native/capstone-gallery/page.tsx", de: ["Noch keine veröffentlichten Capstones."], en: ["No published capstones."] },
] as const;

/**
 * Every band H1 writes `posterTitleFallbackStyle()`: `font-display: optional`
 * can leave a first visit on the Arial-metric fallback face, about 4.4%
 * wider, and "Geschäftsberichte" then ran 5px into the gutter at 390.
 */
function withFallbackFit(surface: Surface): Surface {
  return {
    ...surface,
    titles: surface.titles.map((title) => ({ ...title, fit: title.fit ?? fallbackFitEm(title.text) })),
  };
}

const SURFACES: readonly Surface[] = ([
  {
    name: "workshop detail bands",
    layout: "band-art",
    files: ["src/app/workshops/[slug]/workshop-detail-content.tsx"],
    titles: LOCALES.flatMap((locale) =>
      getWorkshops(locale).map((workshop) => ({
        id: `${workshop.slug} ${locale}`,
        text: splitTitle(workshop.title).head,
      })),
    ),
  },
  // The workshops hub and the home hero are no poster titles any more: the
  // owner asked for the old highlighted hub heading and the old paper hero
  // with the line globe back.
  {
    name: "demos hub band",
    layout: "band",
    files: ["src/app/demos/page.tsx"],
    titles: LOCALES.map((locale) => ({ id: `demos ${locale}`, text: DEMOS_PAGE_COPY[locale].catalog.heading })),
  },
  {
    name: "demo detail bands",
    layout: "band",
    files: ["src/components/demos/demo-detail-layout.tsx"],
    titles: LOCALES.flatMap((locale) =>
      getDemosForLocale(locale).map((demo) => ({
        id: `${demo.slug} ${locale}`,
        text: demoName(demo),
        fit: fallbackFitEm(demoName(demo)),
      })),
    ),
  },
  // The blog index is the old bold index again (the giant "Blog."), not a
  // poster band.
  {
    name: "/kurse headline on paper",
    layout: "band",
    files: ["src/app/kurse/page.tsx"],
    titles: LOCALES.map((locale) => ({
      id: `kurse ${locale}`,
      text: COURSE_HUB_COPY[locale].heading,
      fit: fallbackFitEm(COURSE_HUB_COPY[locale].heading),
    })),
  },
  {
    // The paper pages' H1s share the poster step (SPEC §4: one display size
    // for top-level H1s); the reading pages (posts, lessons) keep 36/52px.
    name: "paper page headlines",
    layout: "band",
    files: [
      "src/app/ueber-mich/ueber-mich-content.tsx",
      "src/app/buecher/buecher-content.tsx",
      "src/app/einstieg/page.tsx",
    ],
    titles: LOCALES.flatMap((locale) => [
      { id: `ueber-mich ${locale}`, text: PROFILE_COPY[locale].hero.title },
      {
        id: `buecher ${locale}`,
        text: `${BOOK_PAGE_COPY[locale].catalog.heading} ${BOOK_PAGE_COPY[locale].catalog.headingAccent}`,
      },
      { id: `einstieg ${locale}`, text: ENTRY_COPY[locale].title },
    ]),
  },
  {
    name: "course landing bands",
    layout: "course",
    files: ["src/components/course/technical-course-landing.tsx"],
    titles: [
      ...LOCALES.flatMap((locale) => [
        { id: `ai-native-operator ${locale}`, text: getAiNativeOperatorCourseCopy(locale).landing.title },
        { id: `data-infrastructure ${locale}`, text: getDataInfraCourseCopy(locale).landing.title },
        {
          id: `data-engineering-fundamentals ${locale}`,
          text: getDataEngineeringFundamentalsCourseCopy(locale).landing.title,
        },
      ]),
      ...COURSE_LITERALS.flatMap((page) =>
        LOCALES.map((locale) => literal(`${page.file} ${locale}`, page.file, page[locale])),
      ),
    ],
  },
] as const satisfies readonly Surface[]).map(withFallbackFit);

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("poster title metrics", () => {
  it("were measured from the bold web font on disk", () => {
    const font = readFileSync(join(WEBSITE, "public/fonts/loehrning-sans-bold-v1.woff2"));
    expect(
      createHash("sha256").update(font).digest("hex"),
      "the font changed: run node scripts/plakat/build-type-metrics.mjs",
    ).toBe(TYPE_METRICS_FONT_SHA256);
  });

  it("match the headline widths Chromium sets with -0.04em tracking", () => {
    // DOM widths of a span at 1000px, 700, letter-spacing -0.04em (Chromium
    // 141, Loehrning Sans Bold), measured when the table was built.
    const measured = {
      "Geschäftsberichte": 7.732109375,
      "Arbeitsabläufe": 6.176328125,
      Workshops: 4.837265625,
      "verstehen.": 4.501859375,
      "anwenden.": 4.699578125,
    };
    for (const [word, em] of Object.entries(measured)) {
      expect(segmentEm(word), word).toBeCloseTo(em, 3);
    }
  });

  it("follow the CSS of .poster-title", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(
      new RegExp(
        `--text-poster:\\s*clamp\\(${POSTER_TITLE_SIZE.min / 16}rem,\\s*${POSTER_TITLE_SIZE.base / 16}rem \\+ ${
          POSTER_TITLE_SIZE.perViewport * 100
        }vw,\\s*${POSTER_TITLE_SIZE.max / 16}rem\\)`,
      ),
    );
    expect(css).toMatch(new RegExp(`--text-poster--letter-spacing:\\s*${POSTER_TRACKING_EM}em`));
    expect(css).toMatch(
      new RegExp(`font-size:\\s*max\\(${POSTER_TITLE_SIZE.floor / 16}rem,\\s*min\\(var\\(--text-poster\\),\\s*calc\\(100cqi / var\\(--fit`),
    );
    expect(posterSizeAt(390)).toBeCloseTo(50.68, 2);
    expect(posterSizeAt(1280)).toBe(96);
  });
});

describe("breakSegments", () => {
  it("splits at spaces and after hyphens and dashes, never at a no-break space", () => {
    expect(breakSegments("KI-Arbeitsabläufe prüfen")).toEqual(["KI-", "Arbeitsabläufe", "prüfen"]);
    expect(breakSegments("ESG-Berichte mit\u00a0KI")).toEqual(["ESG-", "Berichte", "mit\u00a0KI"]);
    expect(breakSegments("a\u2013b c\u2014d")).toEqual(["a\u2013", "b", "c\u2014", "d"]);
  });

  it("turns a soft hyphen into a break that shows a hyphen", () => {
    expect(breakSegments("zusammen\u00adhängendes")).toEqual(["zusammen-", "hängendes"]);
  });

  it("returns the fallback fit for an empty title", () => {
    expect(fitEm("")).toBe(0.01);
    expect(posterTitleStyle("")).toEqual({ "--fit": "0.01" });
  });
});

describe("fitEm", () => {
  it("is the longest segment with the safety headroom, rounded up", () => {
    const { segment, em } = longestSegment("Geschäftsberichte mit KI lesen");
    expect(segment).toBe("Geschäftsberichte");
    const fit = fitEm("Geschäftsberichte mit KI lesen");
    expect(fit).toBeGreaterThanOrEqual(em * POSTER_FIT_SAFETY);
    expect(fit - em * POSTER_FIT_SAFETY).toBeLessThan(0.001);
    expect(posterTitleStyle("Geschäftsberichte mit KI lesen")).toEqual({ "--fit": String(fit) });
  });

  it("adds the fallback headroom on top, and binds a no-break first line", () => {
    const title = "Vertragsassistent.";
    expect(fallbackFitEm(title)).toBeGreaterThanOrEqual(fitEm(title) * POSTER_FALLBACK_HEADROOM);
    expect(fallbackFitEm(title) - fitEm(title) * POSTER_FALLBACK_HEADROOM).toBeLessThan(0.001);
    expect(noBreakFirstLine(["KI", "verstehen.", "Sicher anwenden."])).toBe("KI\u00a0verstehen. Sicher anwenden.");
    expect(breakSegments(noBreakFirstLine(["Understand", "AI.", "Use it safely."]))).toEqual([
      "Understand\u00a0AI.",
      "Use",
      "it",
      "safely.",
    ]);
  });

  it("gives the spec's reference sizes (SPEC §4)", () => {
    const report = fitEm("Geschäftsberichte mit KI lesen");
    // 36px at 320 and about 45px at 390: one line, never broken.
    expect(posterTitleSize(report, column("band-art", 320), 320)).toBeCloseTo(36, 0);
    expect(posterTitleSize(report, column("band-art", 390), 390)).toBeCloseTo(45, 0);
    // KI-Arbeitsabläufe breaks after the hyphen: 45px at 320.
    expect(longestSegment("KI-Arbeitsabläufe prüfen").segment).toBe("Arbeitsabläufe");
    expect(posterTitleSize(fitEm("KI-Arbeitsabläufe prüfen"), 288, 320)).toBeCloseTo(45, 0);
    // Shorter titles reach the full poster size: 50.7px at 390.
    for (const title of ["Workshops mit Fall und Vorlage.", "KI verstehen. Sicher anwenden."]) {
      expect(posterTitleSize(fitEm(title), column("band-art", 390), 390), title).toBeCloseTo(50.68, 1);
    }
  });
});

describe("the poster title registry", () => {
  it("covers every surface the spec sets in the poster size", () => {
    expect(SURFACES.map((surface) => surface.name)).toEqual([
      "workshop detail bands",
      "demos hub band",
      "demo detail bands",
      "/kurse headline on paper",
      "paper page headlines",
      "course landing bands",
    ]);
    for (const surface of SURFACES) {
      expect(surface.titles.length, surface.name).toBeGreaterThanOrEqual(2);
      for (const title of surface.titles) expect(title.text.trim(), title.id).not.toBe("");
    }
  });

  it("reads the H1 of a surface that sets it as a .poster-title", () => {
    for (const surface of SURFACES) {
      expect(
        surface.files.some((file) => /\bposter-title\b|--text-poster\b/.test(read(file))),
        `${surface.name}: none of ${surface.files.join(", ")} sets .poster-title`,
      ).toBe(true);
    }
  });

  it("gives every band title the fallback-face headroom", () => {
    for (const surface of SURFACES) {
      expect(
        surface.files.some((file) => /posterTitleFallbackStyle\(/.test(read(file))),
        `${surface.name}: none of ${surface.files.join(", ")} writes posterTitleFallbackStyle()`,
      ).toBe(true);
    }
  });

  it("still matches the page-local copy it reads", () => {
    for (const surface of SURFACES) {
      for (const { id, source } of surface.titles) {
        if (!source) continue;
        const text = read(source.file);
        for (const part of source.parts) {
          expect(text, `${id}: "${part}" is no longer in ${source.file}; update the registry`).toContain(`"${part}"`);
        }
      }
    }
  });

  it("sets every title in glyphs the web font maps", () => {
    for (const surface of SURFACES) {
      for (const title of surface.titles) {
        for (const character of title.text.normalize("NFC")) {
          // A soft hyphen is no glyph: the font's "-" shows only at a break,
          // and breakSegments() already counts it there.
          if (/\s/.test(character) || character === "\u00ad") continue;
          expect(BOLD_ADVANCES[character], `${title.id}: "${character}"`).toBeDefined();
        }
      }
    }
  });
});

describe.each(SURFACES)("$name", (surface) => {
  it(
    `fits every title at ${VIEWPORTS.join(", ")}px, DE and EN`,
    () => {
      const overflows: string[] = [];
      for (const title of surface.titles) {
        const fit = title.fit ?? fitEm(title.text);
        for (const viewport of VIEWPORTS) {
          const width = column(surface.layout, viewport);
          const size = posterTitleSize(fit, width, viewport);
          if (size * fit > width + 1e-9) {
            overflows.push(
              `${title.id} at ${viewport}px: "${longestSegment(title.text).segment}" needs ${(size * fit).toFixed(1)}px of ${width.toFixed(1)}px at ${size.toFixed(1)}px. Add a soft hyphen (U+00AD) or reword.`,
            );
          }
        }
      }
      expect(overflows).toEqual([]);
    },
  );
});
