import { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PAPER } from "@/lib/plakat/palettes";

// The share card for Nº 01, one layout per locale: opengraph-image.tsx serves
// German, opengraph-image.en.tsx is the sibling the /en mirror re-exports
// (scripts/generate-english-route-mirror.mjs). Both routes run on the edge.

// Loehrning Sans Bold, bundled with the edge function by URL. One face keeps
// the function small; the card is set in 700 throughout.
const boldFont = fetch(
  new URL("../../../fonts/LoehrningSans-Bold.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

const INSET = 64;

const CARD_COPY = {
  de: {
    alt: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus und deine Rechte, Stand Juli 2026.",
    title: "Der EU AI Act.",
    subtitle: "Was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus und deine Rechte, Stand Juli 2026.",
    dates: [
      { num: "Art. 5", label: "Verbote gelten seit 2. Feb 2025" },
      { num: "Art. 50", label: "Transparenz ab 2. Aug 2026" },
      { num: "Anhang III", label: "Hochrisiko ab Dez 2027" },
    ],
  },
  en: {
    alt: "The EU AI Act: what it means if you are not a lawyer. Timeline, AI Omnibus and your rights, as of July 2026.",
    title: "The EU AI Act.",
    subtitle: "What it means if you are not a lawyer. Timeline, AI Omnibus and your rights, as of July 2026.",
    dates: [
      { num: "Art. 5", label: "Bans apply since 2 Feb 2025" },
      { num: "Art. 50", label: "Transparency from 2 Aug 2026" },
      { num: "Annex III", label: "High-risk from Dec 2027" },
    ],
  },
} as const;

export type EuAiActCardLocale = keyof typeof CARD_COPY;

export function euAiActOgAlt(locale: EuAiActCardLocale): string {
  return CARD_COPY[locale].alt;
}

export const EU_AI_ACT_OG_SIZE = { width: 1200, height: 630 };

/**
 * Blog posts stay paper (SPEC §2.3, §5): Kalkweiß, Druckschwarz type, one
 * Mennige label, the three dates as a ruled ledger under a 2px Kopflinie,
 * and the shared colophon strip with the header's L tile (SPEC §3.15).
 */
export async function renderEuAiActOgCard(
  locale: EuAiActCardLocale,
): Promise<ImageResponse> {
  const copy = CARD_COPY[locale];
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
            {copy.title}
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
            {copy.subtitle}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              marginBottom: 40,
              borderTop: `2px solid ${PAPER.druckschwarz}`,
            }}
          >
            {copy.dates.map((item, index) => (
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
      ...EU_AI_ACT_OG_SIZE,
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
