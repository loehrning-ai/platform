import { ImageResponse } from "next/og";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PAPER } from "@/lib/plakat/palettes";

export const runtime = "edge";
export const alt = "Was ist KI? Ein Einstieg ohne Vorwissen. loehrning.ai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Loehrning Sans Bold, bundled with the edge function by URL. One face keeps
// the function small; the card is set in 700 throughout.
const boldFont = fetch(
  new URL("../../fonts/LoehrningSans-Bold.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

const INSET = 64;

/**
 * /einstieg stays paper (SPEC §2.3): Kalkweiß, Druckschwarz type, Mennige
 * only for the one step label, a 2px Kopflinie above the shared colophon
 * strip with the header's L tile.
 */
export default async function Image() {
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
            Stufe 1: Orientierung
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
            <div style={{ display: "flex" }}>Was ist KI?</div>
            <div style={{ display: "flex" }}>Ein Einstieg ohne Vorwissen.</div>
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
            10 Minuten. Kein Login.
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
          data: await boldFont,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
