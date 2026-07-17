import { ImageResponse } from "next/og";
import { getImportedCourse, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";

export const alt = "loehrning.ai Open-Source-Interaktivkurs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return IMPORTED_COURSE_CATALOG.map((course) => ({ slug: course.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const course = getImportedCourse(params.slug);
  const title = course?.title ?? "Open-Source-Interaktivkurs";
  const facts = course?.sourceFacts.slice(0, 4) ?? ["MIT", "kostenlos", "Browserkurs"];
  const topics = course?.topics.slice(0, 4) ?? ["Daten", "KI", "Praxis"];

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
          background: "#0B0908",
          color: "#F3F0E9",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: "#C4431A",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 900 }}>
            loehrning.ai
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontFamily: "monospace",
              fontSize: 15,
              color: "#C4431A",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Open-Source-Kurs
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 26 ? 62 : 72,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: 0,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(243,240,233,0.72)",
              maxWidth: 980,
            }}
          >
            MIT-lizenzierter Browserkurs, eingebunden in die Kursübersicht von
            loehrning.ai.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 670 }}>
            {[...facts, ...topics].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "10px 14px",
                  border: "2px solid rgba(243,240,233,0.28)",
                  background: "rgba(243,240,233,0.08)",
                  fontFamily: "monospace",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              fontFamily: "monospace",
              fontSize: 20,
              color: "#C4431A",
              fontWeight: 900,
            }}
          >
            /kurse/open-source
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
