import { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PAPER } from "@/lib/plakat/palettes";

export const runtime = "edge";
export const alt =
  "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus und deine Rechte, Stand Juli 2026.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Loehrning Sans Bold, bundled with the edge function by URL. One face keeps
// the function small; the card is set in 700 throughout.
const boldFont = fetch(
  new URL("../../../fonts/LoehrningSans-Bold.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

const INSET = 64;

const DATES = [
  { num: "Art. 5", label: "Verbote gelten seit 2. Feb 2025" },
  { num: "Art. 50", label: "Transparenz ab 2. Aug 2026" },
  { num: "Anhang III", label: "Hochrisiko ab Dez 2027" },
] as const;

/**
 * Blog posts stay paper (SPEC §2.3, §5): Kalkweiß, Druckschwarz type, one
 * Mennige label, the three dates as a ruled ledger under a 2px Kopflinie,
 * and the shared colophon strip with the header's L tile (SPEC §3.15).
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
            flexGrow: 1,
            padding: `60px ${INSET}px 0 ${INSET}px`,
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
            Blog · Nº {getPostNumberLabel("eu-ai-act-grundlagen")}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            Der EU AI Act.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              maxWidth: 940,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.3,
              color: PAPER.druckschwarz,
            }}
          >
            Was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus
            und deine Rechte, Stand Juli 2026.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              marginBottom: 40,
              borderTop: `2px solid ${PAPER.druckschwarz}`,
            }}
          >
            {DATES.map((item, index) => (
              <div
                key={item.num}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  paddingTop: 16,
                  paddingLeft: index === 0 ? 0 : 24,
                }}
              >
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
                  {item.num}
                </div>
                <div style={{ display: "flex", marginTop: 6, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <OgColophon trailing="Blog" inset={INSET} />
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
