import { ImageResponse } from "next/og";
import { BLOG_POSTS, getPostNumberLabel } from "@/lib/blog-metadata";

// Werkzeichnung on paper: ink type, slate secondary text, one Mennige mark.
// The edge runtime cannot read the sheet, so the image states no counts.
// The English route re-exports this module (scripts/generate-english-route-
// mirror.mjs keeps no hand-written files under src/app/en), so the card and
// its alt carry the English title as well.

export const runtime = "edge";

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

const PAPER = "#f3f0e9";
const INK = "#121212";
const SLATE = "#4f4640";
const MENNIGE = "#b73a15";

export const alt = `KI in der Ausbildung: Fragen für JAV und Betriebsrat, mit Rechtsgrundlagen, Stand ${standLabel("de")} · AI in apprenticeships: questions for youth representatives and works councils, with legal bases, status ${standLabel("en")}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 70,
          background: PAPER,
          color: INK,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Das Ö mark: hard-cornered umlaut, counter knocked out (evenodd). */}
          <svg width="28" height="37" viewBox="18 8 60 80" fill={MENNIGE}>
            <rect x="26" y="8" width="16" height="16" />
            <rect x="54" y="8" width="16" height="16" />
            <path d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: SLATE }}>
            loehrning.ai · Blog · Nº {getPostNumberLabel(SLUG)}
          </div>
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
            KI in der Ausbildung.
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
            Fragen für JAV und Betriebsrat, jede mit Rechtsgrundlage. Frei
            nutzbar unter CC BY 4.0.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 400,
              lineHeight: 1.35,
              color: SLATE,
              maxWidth: 900,
            }}
          >
            {"Also in English: AI in apprenticeships."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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
                    background: index < 2 ? INK : PAPER,
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
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: SLATE }}>
            Stand {standLabel("de")}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
