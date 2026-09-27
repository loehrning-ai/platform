import { ImageResponse } from "next/og";
import { BLOG_POSTS, getPostNumberLabel } from "@/lib/blog-metadata";
import { OG_COLOPHON_HEIGHT, OG_FONT_FAMILY, OG_PAPER, OG_SIZE, OgColophon } from "@/lib/plakat/og";
import { courseOgFonts } from "../../kurse/course-og-card";

// The share card for Nº 02, one layout per locale. Werkzeichnung on paper (the
// post stays paper, SPEC §2.3): ink type, Schiefer secondary text and the
// header lockup in the shared Kalkweiß colophon. The colours come from PAPER
// (palettes.ts) and the type is the site face, read from src/fonts on the
// Node runtime. opengraph-image.tsx serves German; opengraph-image.en.tsx is
// the sibling the /en mirror re-exports (scripts/generate-english-route-
// mirror.mjs), so /en/blog/ki-in-der-ausbildung shares an English card.

const SLUG = "ki-in-der-ausbildung";
const MONTHS = {
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
} as const;

function standLabel(locale: keyof typeof MONTHS): string {
  const post = BLOG_POSTS.find((entry) => entry.slug === SLUG);
  if (!post) throw new Error(`blog manifest has no entry for ${SLUG}`);
  const [year, month] = post.dateModified.split("-").map(Number) as [number, number];
  return `${MONTHS[locale][month - 1]} ${year}`;
}

const INK = OG_PAPER.druckschwarz;
const SLATE = OG_PAPER.schiefer;
const INSET = 70;

const CARD_COPY = {
  de: {
    title: "KI in der Ausbildung.",
    subtitle: "Fragen für JAV und Betriebsrat, jede mit Rechtsgrundlage. Frei nutzbar unter CC BY 4.0.",
    alt: (stand: string) =>
      `KI in der Ausbildung: Fragen für JAV und Betriebsrat, mit Rechtsgrundlagen, Stand ${stand}.`,
    stand: (stand: string) => `Stand ${stand}`,
  },
  en: {
    title: "AI in apprenticeships.",
    subtitle: "Questions for youth reps and works councils, each with its legal basis. Free to use under CC BY 4.0.",
    alt: (stand: string) =>
      `AI in apprenticeships: questions for youth representatives and works councils, with legal bases, as of ${stand}.`,
    stand: (stand: string) => `As of ${stand}`,
  },
} as const;

export type JavCardLocale = keyof typeof CARD_COPY;

export function javOgAlt(locale: JavCardLocale): string {
  return CARD_COPY[locale].alt(standLabel(locale));
}

export const JAV_OG_SIZE = { width: 1200, height: 630 };

export async function renderJavOgCard(locale: JavCardLocale): Promise<ImageResponse> {
  const copy = CARD_COPY[locale];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG_PAPER.kalkweiss,
          color: INK,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: OG_SIZE.height - OG_COLOPHON_HEIGHT,
            padding: `56px ${INSET}px 40px`,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, fontWeight: 400, color: SLATE }}>
            Blog · Nº {getPostNumberLabel(SLUG)}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              borderTop: `2px solid ${INK}`,
              paddingTop: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
              }}
            >
              {copy.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.35,
                color: SLATE,
                maxWidth: 900,
              }}
            >
              {copy.subtitle}
            </div>
          </div>

          {/* Four square stations on a 2px line: two in force, two to come. */}
          <div style={{ display: "flex", alignItems: "center", width: 520 }}>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", flex: index < 3 ? 1 : 0 }}>
                <div
                  style={{
                    display: "flex",
                    width: 18,
                    height: 18,
                    border: `2px solid ${INK}`,
                    background: index < 2 ? INK : OG_PAPER.kalkweiss,
                  }}
                />
                {index < 3 ? (
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      borderTop: `2px ${index < 2 ? "solid" : "dashed"} ${INK}`,
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <OgColophon trailing={copy.stand(standLabel(locale))} inset={INSET} />
      </div>
    ),
    { ...JAV_OG_SIZE, fonts: await courseOgFonts() },
  );
}
