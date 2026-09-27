import { ImageResponse } from "next/og";
import {
  GERMANY_OUTLINE,
  graticulePath,
  outlinePath,
  type GlobeView,
} from "@/components/werk/globe-geometry";
import {
  OG_FONT_FAMILY,
  OG_SIZE,
  OgColophon,
} from "@/lib/plakat/og";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import type { Locale } from "@/lib/i18n/locale";
import { PLAKAT, ROUTE_PLAKAT } from "@/lib/plakat/palettes";

export const runtime = "edge";
// One alt serves both locales: the /en mirror re-exports this module, and a
// static export cannot read the request.
export const alt =
  "KI verstehen. Sicher anwenden. / Understand AI. Apply it safely. Pale yellow headline on an ultramarine poster beside a flat red globe with Germany marked, above the loehrning.ai wordmark.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The root social card: the home scene as a poster (SPEC §3.15). Ultramarin
 * ground, the Butter headline in Loehrning Sans Bold, the flat Mennige globe
 * of the home hero bleeding off the right and bottom edges, and the Kalkweiß
 * colophon strip with the header's L tile. Colours come from PLAKAT only.
 */
const SCENE = PLAKAT[ROUTE_PLAKAT.home];

/**
 * The home hero's caps line and H1, broken for the 632px text column. The
 * English first line is wider, so it sets at 96px (603px measured with
 * type-metrics.ts) where the German one reaches 110px (609px).
 */
const COPY: Record<
  Locale,
  { readonly caps: string; readonly lines: readonly string[]; readonly size: number }
> = {
  de: {
    caps: "Frei · zweisprachig · quelloffen",
    lines: ["KI verstehen.", "Sicher", "anwenden."],
    size: 110,
  },
  en: {
    caps: "Free · bilingual · open source",
    lines: ["Understand AI.", "Apply it", "safely."],
    size: 96,
  },
};

// Loehrning Sans Bold, bundled with the edge function by URL. Only the one
// face is loaded: the whole card is set in 700, which keeps the function small.
const boldFont = fetch(
  new URL("../fonts/LoehrningSans-Bold.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

// The globe: an orthographic sphere rising from the bottom right, drawn like
// the home hero's lemons globe (SPEC §3.6): a flat Mennige disc, a 30°
// graticule knocked out in the ground colour and clipped to the disc, Germany
// in Butter, no coastlines, no limb stroke. The view is tilted 32° north so
// Germany faces the viewer (about 60 × 75px) and the pole, where the meridians
// meet, sits well inside the disc instead of on its edge. The disc clears the
// headline's last line ("anwenden." ends at x 581; the limb there is at 587).
const GLOBE_CENTER = { x: 1115, y: 700 } as const;
const GLOBE_VIEW: GlobeView = { centerLat: 32, centerLon: 16, radius: 600 };
const GRATICULE = graticulePath(GLOBE_VIEW, 30);
const GERMANY = outlinePath(GERMANY_OUTLINE, GLOBE_VIEW);
const TEXT_INSET = 64;
const TEXT_COLUMN = 696;

function Globe() {
  const { x, y } = GLOBE_CENTER;
  return (
    <svg
      width={OG_SIZE.width}
      height={OG_SIZE.height}
      viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <defs>
        <clipPath id="globe-disc">
          <circle cx="0" cy="0" r={GLOBE_VIEW.radius} />
        </clipPath>
      </defs>
      <g transform={`translate(${x} ${y})`}>
        <circle cx="0" cy="0" r={GLOBE_VIEW.radius} fill={SCENE.mid} />
        <path
          d={GRATICULE}
          clipPath="url(#globe-disc)"
          fill="none"
          stroke={SCENE.ground}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d={GERMANY} fill={SCENE.ink} />
      </g>
    </svg>
  );
}

export default async function Image() {
  const copy = COPY[await getRequestLocale()];
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: SCENE.ground,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <Globe />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: TEXT_COLUMN,
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              padding: `${TEXT_INSET - 8}px 0 0 ${TEXT_INSET}px`,
              color: SCENE.ink,
            }}
          >
            {/* The poster's one caps line; uppercase is a transform, the
                source stays sentence case. */}
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {copy.caps}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 30,
                fontSize: copy.size,
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
              }}
            >
              {copy.lines.map((line) => (
                <div key={line} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
          <OgColophon inset={TEXT_INSET} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_FAMILY,
          data: await boldFont,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
