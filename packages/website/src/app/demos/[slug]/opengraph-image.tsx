import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { demos } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
  getDemoForLocale,
} from "@/lib/demos-localization";
import { getDemoCopy } from "@/lib/demos-copy";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PLAKAT, ROUTE_PLAKAT } from "@/lib/plakat/palettes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "loehrning.ai interactive AI example · KI-Praxisbeispiel";

/**
 * The demo social card in the IDEA scene (SPEC §2.3, §3.15): Kreide ground,
 * four Kobalt corner dots, the arrow caps line, the Himbeere title at poster
 * size (display only, 3.67:1) and a Kobalt subtitle (6.78:1), above the shared
 * Kalkweiß colophon strip with the header's L tile. Colours come from PLAKAT.
 */
const SCENE = PLAKAT[ROUTE_PLAKAT.demos];
const INSET = 64;
const DOT = 16;

// The site face from src/fonts, read on the Node runtime (the cards are
// prerendered for every demo). The card is set in 700 and 400.
let fontData: Promise<{ bold: Buffer; regular: Buffer }> | undefined;
async function ogFonts() {
  fontData ??= Promise.all([
    readFile(join(process.cwd(), "src/fonts/LoehrningSans-Bold.ttf")),
    readFile(join(process.cwd(), "src/fonts/LoehrningSans-Regular.ttf")),
  ]).then(([bold, regular]) => ({ bold, regular }));
  const { bold, regular } = await fontData;
  return [
    { name: OG_FONT_FAMILY, data: bold, weight: 700 as const, style: "normal" as const },
    { name: OG_FONT_FAMILY, data: regular, weight: 400 as const, style: "normal" as const },
  ];
}

/** The IDEA poster's four corner dots, 24px in from the card's upper corners and the strip. */
function CornerDots() {
  const places = [
    { left: 24, top: 24 },
    { right: 24, top: 24 },
    { left: 24, bottom: 80 + 24 },
    { right: 24, bottom: 80 + 24 },
  ];
  return (
    <>
      {places.map((place) => (
        <div
          key={`${place.left ?? "r"}-${place.top ?? "b"}`}
          style={{
            position: "absolute",
            display: "flex",
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            background: SCENE.ink,
            ...place,
          }}
        />
      ))}
    </>
  );
}

export async function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const demo = getDemoForLocale(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale].og;

  const title = demo ? `${demo.title} ${demo.titleKicker}` : pageCopy.fallbackTitle;
  const subtitle = demo
    ? (getDemoCopy(demo.slug, locale)?.ogSubtitle ?? demo.description)
    : pageCopy.fallbackSubtitle;
  const categoryLine = demo
    ? `${DEMO_CATEGORY_LABELS[locale][demo.category]}${demo.level ? ` · ${DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level]}` : ""}`
    : pageCopy.gallery;
  const slugLine = localizeHref(demo ? `/demos/${demo.slug}` : "/demos", locale);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: SCENE.ground,
          color: SCENE.ink,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <CornerDots />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: `72px ${INSET}px 0 ${INSET}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <svg width="64" height="12" viewBox="0 0 64 12" style={{ marginRight: 18 }}>
              <path
                d="M0 6H62M57 1.5L62 6L57 10.5"
                fill="none"
                stroke={SCENE.ink}
                strokeWidth="2"
              />
            </svg>
            {categoryLine}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 1060,
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: SCENE.mid,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 900,
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        </div>
        <OgColophon trailing={slugLine} inset={INSET} />
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
