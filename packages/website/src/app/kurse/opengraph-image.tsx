import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "loehrning.ai Kurse: vier deutsche Kernkurse und sechs Technikkurse auf Englisch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const labels = [
  "KI-Führerschein",
  "KI und Gesellschaft",
  "EU AI Act Kurs",
  "AI-Native Arbeitskurs",
];

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
          background: "#F3F0E9",
          color: "#0B0908",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Das Ö mark — hard-cornered umlaut, counter knocked out (evenodd) */}
          <svg width="28" height="37" viewBox="18 8 60 80" fill="#B73A15">
            <rect x="26" y="8" width="16" height="16" />
            <rect x="54" y="8" width="16" height="16" />
            <path d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 900 }}>
            loehrning<span style={{ color: "#B73A15" }}>.ai</span> · Kurse
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: 0,
              maxWidth: 980,
            }}
          >
            KI lernen. Daten verstehen.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "#4f4640",
              maxWidth: 900,
            }}
          >
            Vier deutsche Kernkurse mit Lernkonto und Abschlussnachweis, dazu
            sechs öffentliche technische Kurse auf Englisch.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {labels.map((label, index) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                padding: 22,
                background: "#FFFDF8",
                border: "3px solid #0B0908",
                boxShadow: "5px 5px 0 #0B0908",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#B73A15",
                  fontFamily: "monospace",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", fontSize: 25, fontWeight: 900 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
