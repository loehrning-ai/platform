import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import type { Locale } from "@/lib/i18n/locale";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PAPER } from "@/lib/plakat/palettes";

// One alt serves both locales: the /en mirror re-exports this module.
export const alt =
  "Was ist KI? Ein Einstieg ohne Vorwissen. / What is AI? No prior knowledge needed. loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Figtree Bold from src/fonts, read on the Node runtime on the first
// render, like the other share cards. The card reads the request locale, so
// it renders per request; the font reaches the deployed function through
// outputFileTracingIncludes in next.config.ts. The card is set in 700
// throughout, so one face is enough.
let boldFont: Promise<Buffer> | undefined;
function loadBoldFont(): Promise<Buffer> {
  boldFont ??= readFile(join(process.cwd(), "src/fonts/Figtree-Bold.ttf"));
  return boldFont;
}

const INSET = 64;

// The second headline line stays one line at 84px in the 1072px column
// (German 1066px, English 1045px, measured with type-metrics.ts).
const COPY: Record<
  Locale,
  {
    readonly step: string;
    readonly lines: readonly [string, string];
    readonly meta: string;
  }
> = {
  de: {
    step: "Stufe 1: Orientierung",
    lines: ["Was ist KI?", "Ein Einstieg ohne Vorwissen."],
    meta: "10 Minuten. Kein Login.",
  },
  en: {
    step: "Level 1: orientation",
    lines: ["What is AI?", "No prior knowledge needed."],
    meta: "10 minutes. No login.",
  },
};

/**
 * /einstieg stays paper (SPEC §2.3): Kalkweiß, Druckschwarz type, Mennige
 * only for the one step label, a 2px Kopflinie above the shared colophon
 * strip with the header's L tile.
 */
export default async function Image() {
  const copy = COPY[await getRequestLocale()];
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER.kalkweiss,
          color: PAPER.druckschwarz,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            padding: `0 ${INSET}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.3,
              color: PAPER.mennige,
            }}
          >
            {copy.step}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 20,
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.015em",
            }}
          >
            <div style={{ display: "flex" }}>{copy.lines[0]}</div>
            <div style={{ display: "flex" }}>{copy.lines[1]}</div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.35,
            }}
          >
            {copy.meta}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            margin: `0 ${INSET}px`,
            borderTop: `2px solid ${PAPER.druckschwarz}`,
          }}
        />
        <OgColophon inset={INSET} />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_FAMILY,
          data: await loadBoldFont(),
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
