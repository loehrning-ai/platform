import { ImageResponse } from "next/og";
import { DEMO_LEVEL_LABELS, demos, getDemoBySlug } from "@/lib/demos";
import { getDemoCopy } from "@/lib/demos-copy";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "loehrning.ai Praxisbeispiel";

export async function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  const demo = getDemoBySlug(params.slug);

  const title = demo ? `${demo.title} ${demo.titleKicker}` : "Praxisbeispiele · loehrning.ai";
  const subtitle = demo
    ? (getDemoCopy(demo.slug)?.ogSubtitle ?? demo.description)
    : "Zwölf interaktive KI-Praxisbeispiele für den Mittelstand.";
  const categoryLine = demo
    ? `${demo.category}${demo.level ? ` · ${DEMO_LEVEL_LABELS[demo.level]}` : ""}`
    : "DEMO-GALERIE";
  const slugLine = demo ? `/demos/${demo.slug}` : "/demos";

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
          background: "#F3F0E9",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0B0908",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              background: "#F97316",
              border: "2px solid #0B0908",
              boxShadow: "4px 4px 0 #0B0908",
              fontSize: 28,
              fontWeight: 900,
              color: "#F3F0E9",
            }}
          >
            L
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 900 }}>LOEHRNING.AI</div>
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              fontFamily: "monospace",
              fontSize: 14,
              color: "#a89070",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {categoryLine}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: 1060,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.3,
              color: "rgba(11,9,8,0.66)",
              maxWidth: 980,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 14,
              letterSpacing: "0.18em",
              color: "rgba(11,9,8,0.55)",
              textTransform: "uppercase",
            }}
          >
            {slugLine}
          </div>
          <div
            style={{
              display: "flex",
              background: "#F97316",
              color: "white",
              padding: "10px 18px",
              border: "2px solid #0B0908",
              boxShadow: "4px 4px 0 #0B0908",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Praxisbeispiel öffnen →
          </div>
        </div>
      </div>
    ),
    size,
  );
}
