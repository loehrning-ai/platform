import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { demoLede, getDemoForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { OG_COLOPHON_HEIGHT, OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PLAKAT, ROUTE_PLAKAT, type PlakatPalette } from "@/lib/plakat/palettes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "loehrning.ai Übung zum Workshop · workshop exercise";

/**
 * The demo social card in its workshop's scene (SPEC §2.3, §3.15): the
 * poster ground, the arrow caps line "Workshop NN · Übung", the title at
 * poster size (IDEA sets it in Himbeere, display only; every other scene in
 * its ink), the question as subtitle in the ink, the halftone strip, and the
 * shared Kalkweiß colophon strip with the header's L tile. IDEA alone keeps
 * its four corner dots. Colours come from PLAKAT; the fallback card is the
 * /demos hub's IDEA scene.
 */
const INSET = 64;
const DOT = 16;
/** The halftone field spans the text column. */
const HALFTONE_WIDTH = size.width - 2 * INSET;

// The site face from src/fonts, read on the Node runtime (the cards are
// prerendered for every demo). The card is set in 700 and 400.
let fontData: Promise<{ bold: Buffer; regular: Buffer }> | undefined;
async function ogFonts() {
  fontData ??= Promise.all([
    readFile(join(process.cwd(), "src/fonts/Figtree-Bold.ttf")),
    readFile(join(process.cwd(), "src/fonts/Figtree-Regular.ttf")),
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
let halftonePng: Promise<Buffer> | undefined;
async function halftoneUri(ink: string) {
  halftonePng ??= readFile(join(process.cwd(), "public/plakat/halftone-demos.png"));
  return halftonePng.then((png) => {
    const [r, g, b] = inkChannels(ink).split(" ");
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
}

/** The IDEA poster's four corner dots, 24px in from the card's corners above the strip. */
function CornerDots({ ink }: { readonly ink: string }) {
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
            background: ink,
            ...place,
          }}
        />
      ))}
    </>
  );
}

export async function renderDemoOgImage(slug: string) {
  const locale = await getRequestLocale();
  const demo = getDemoForLocale(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale];
  const SCENE: PlakatPalette = PLAKAT[demo?.plakat ?? ROUTE_PLAKAT.demos];

  const title = demo ? demo.title : pageCopy.og.fallbackTitle;
  const subtitle = demo ? demoLede(demo) : pageCopy.og.fallbackSubtitle;
  const categoryLine = demo ? pageCopy.detail.caps(demo.workshopNumber) : pageCopy.catalog.kicker;
  const slugLine = localizeHref(demo ? `/demos/${demo.slug}` : "/demos", locale);
  const titleColor = SCENE.numRole === "mid" ? SCENE.mid : SCENE.ink;
  const [fonts, halftone] = await Promise.all([ogFonts(), halftoneUri(SCENE.ink)]);

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
        {SCENE.cornerDots ? <CornerDots ink={SCENE.ink} /> : null}
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
              color: titleColor,
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
