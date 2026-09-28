import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import type { Locale } from "@/lib/i18n/locale";
import { fitEm, POSTER_TRACKING_EM } from "@/lib/plakat/fit";
import { OG_COLOPHON_HEIGHT, OG_FONT_FAMILY, OG_SIZE, OgColophon } from "@/lib/plakat/og";
import { PLAKAT, ROUTE_PLAKAT } from "@/lib/plakat/palettes";
import { courseOgFonts } from "../../kurse/course-og-card";

/**
 * The blog post share cards (Werkzeichnung v2, SPEC §3.15), in the /blog
 * index scene (IDEA): Kreide ground, the caps line with its hairline arrow in
 * Kobalt, the title in Himbeere at poster size (display only, 3.67:1), one
 * Kobalt subtitle, and the blog's cloud halftone in Kobalt as the full-height
 * art on the right, where the workshop and course cards place their poster.
 * The Kalkweiß colophon strip with the header lockup sits under the text
 * column, below a 2px Kobalt rule. Colours come from PLAKAT only.
 *
 * Node runtime: the fonts and the halftone are read from the project root.
 */

const SCENE = PLAKAT[ROUTE_PLAKAT.blog];
const INSET = 64;
/** The text column, as on the workshop cards; the art takes the rest. */
const TEXT_COLUMN = 696;
const ART_WIDTH = OG_SIZE.width - TEXT_COLUMN;
const TITLE_MAX = 104;
/** The title's line box: the column less its left inset and a 40px gutter. */
const TITLE_MEASURE = TEXT_COLUMN - INSET - 40;

/**
 * The halftone field (scripts/plakat/build-halftone.mjs) is an alpha PNG of
 * 1600 × 560. Scaled to the card height it is 1800 wide; the offset shows the
 * larger cloud, cut by the card's top and bottom edges like a poster shape.
 */
const HALFTONE_SIZE = { width: 1800, height: 630 } as const;
const HALFTONE_OFFSET_X = -330;

let halftone: Promise<string> | undefined;
function halftoneDataUri(): Promise<string> {
  halftone ??= readFile(join(process.cwd(), "public/plakat/halftone-blog.png"), "base64").then(
    (data) => `data:image/png;base64,${data}`,
  );
  return halftone;
}

/**
 * The halftone in Kobalt on Kreide. The PNG holds black dots whose alpha is
 * the shape; an SVG filter floods the ink into that alpha, as the CSS mask
 * does on the site. (Satori turns CSS mask-image into a luminance mask, which
 * a black alpha image cannot drive.) Called as a function, not rendered as a
 * component: Satori preloads <image> sources from the element tree before it
 * resolves components, and would miss the href inside one.
 */
function halftoneArt(href: string) {
  return (
    <svg width={ART_WIDTH} height={OG_SIZE.height} viewBox={`0 0 ${ART_WIDTH} ${OG_SIZE.height}`}>
      <defs>
        <filter id="halftone-ink" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feFlood floodColor={SCENE.ink} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <image
        href={href}
        x={HALFTONE_OFFSET_X}
        y="0"
        width={HALFTONE_SIZE.width}
        height={HALFTONE_SIZE.height}
        filter="url(#halftone-ink)"
      />
    </svg>
  );
}

const MONTHS: Record<Locale, readonly string[]> = {
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** "September 2026": the month of the post's dateModified in the manifest. */
export function blogStandMonth(slug: string, locale: Locale): string {
  const post = BLOG_POSTS.find((entry) => entry.slug === slug);
  if (!post) throw new Error(`blog manifest has no entry for ${slug}`);
  const [year, month] = post.dateModified.split("-").map(Number) as [number, number];
  return `${MONTHS[locale][month - 1]} ${year}`;
}

export type BlogOgCardText = {
  /** The caps line, e.g. "Blog · Nº 02". */
  readonly caps: string;
  readonly title: string;
  readonly subtitle: string;
  /** The colophon's right-hand line, e.g. "Stand September 2026". */
  readonly trailing: string;
};

/** Poster size for the title: its longest word fits the column, capped at TITLE_MAX. */
export function blogOgTitleSize(title: string): number {
  return Math.min(TITLE_MAX, Math.floor(TITLE_MEASURE / fitEm(title)));
}

export async function renderBlogOgCard({ caps, title, subtitle, trailing }: BlogOgCardText): Promise<ImageResponse> {
  const [fonts, halftoneHref] = await Promise.all([courseOgFonts(), halftoneDataUri()]);
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: SCENE.ground,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: TEXT_COLUMN, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              padding: `60px 40px 0 ${INSET}px`,
              color: SCENE.ink,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg width="64" height="10" viewBox="0 0 64 10" style={{ marginRight: 16 }}>
                <path
                  d="M0 5H62M57.5 1.5L62 5L57.5 8.5"
                  fill="none"
                  stroke={SCENE.ink}
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {caps}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 32,
                fontSize: blogOgTitleSize(title),
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: `${POSTER_TRACKING_EM}em`,
                color: SCENE.mid,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </div>
          </div>
          <div style={{ display: "flex", borderTop: `2px solid ${SCENE.ink}`, height: OG_COLOPHON_HEIGHT }}>
            <OgColophon trailing={trailing} inset={INSET} />
          </div>
        </div>
        {halftoneArt(halftoneHref)}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
