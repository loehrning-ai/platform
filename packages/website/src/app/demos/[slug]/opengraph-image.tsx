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
import { OG_COLOPHON_HEIGHT, OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
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
/** The halftone field spans the text column. */
const HALFTONE_WIDTH = size.width - 2 * INSET;

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

/** The scene ink as 0 to 1 channels, for the halftone's colour matrix. */
function inkChannels(hex: string): string {
  return [1, 3, 5].map((start) => (parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(4)).join(" ");
}

// The demos halftone (public/plakat/halftone-demos.png, black dots on
// alpha), recoloured to the scene ink by an SVG colour matrix, as the /demos
// band colours it with a CSS mask: the card's poster object between the
// type and the colophon. Satori reads a CSS mask by luminance, so black
// dots would vanish; the matrix keeps the alpha and sets the ink.
let halftoneData: Promise<string> | undefined;
function halftoneUri() {
  halftoneData ??= readFile(join(process.cwd(), "public/plakat/halftone-demos.png")).then((png) => {
    const [r, g, b] = inkChannels(SCENE.ink).split(" ");
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="560" viewBox="0 0 1600 560">',
      '<filter id="ink" color-interpolation-filters="sRGB">',
      `<feColorMatrix type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0"/>`,
      "</filter>",
      `<image width="1600" height="560" filter="url(#ink)" xlink:href="data:image/png;base64,${png.toString("base64")}"/>`,
      "</svg>",
    ].join("");
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  });
  return halftoneData;
}

/** The IDEA poster's four corner dots, 24px in from the card's corners above the strip. */
function CornerDots() {
  const places = [
    { left: 24, top: 24 },
    { right: 24, top: 24 },
    { left: 24, top: size.height - OG_COLOPHON_HEIGHT - 24 - DOT },
    { right: 24, top: size.height - OG_COLOPHON_HEIGHT - 24 - DOT },
  ];
  return (
    <>
      {places.map((place) => (
        <div
          key={`${place.left ?? "r"}-${place.top}`}
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
  const [fonts, halftone] = await Promise.all([ogFonts(), halftoneUri()]);

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
            // An explicit height: Satori does not stretch a flex-grown
            // column, so the halftone below would get no room.
            height: size.height - OG_COLOPHON_HEIGHT,
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
          {/* The strip takes the room left above the colophon: a short
              title leaves a tall field, a three-line title a thin one. The
              field is set at the strip's width (a dot pitch near 11px, read
              at about 5px when a feed shows the card at 500px) and cut to
              the strip from its foot, where the sheet's grid is. */}
          <div
            style={{
              display: "flex",
              position: "relative",
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              marginTop: 36,
              marginBottom: 40,
              overflow: "hidden",
            }}
          >
            <img
              src={halftone}
              alt=""
              style={{ position: "absolute", left: 0, bottom: 0 }}
              width={HALFTONE_WIDTH}
              height={Math.round((HALFTONE_WIDTH * 560) / 1600)}
            />
          </div>
        </div>
        <OgColophon trailing={slugLine} inset={INSET} />
      </div>
    ),
    { ...size, fonts },
  );
}
