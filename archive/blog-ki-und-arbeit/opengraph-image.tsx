import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/seo/json-ld";

export const runtime = "edge";
export const alt = "KI und Arbeit: Was die Daten wirklich sagen. 27 bis 46 Prozent KI-exponiert nach OECD 2023.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Suppress unused import warning
void SITE_URL;

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
            loehrning.ai · Blog · Nº 03
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
            KI und Arbeit.
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
            Was die Daten wirklich sagen. 27 bis 46 Prozent KI-exponiert nach OECD 2023.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            { num: "27-46%", label: "Jobs KI-exponiert", source: "OECD 2023" },
            { num: "Amplifier", label: "Modell: verstärken, nicht ersetzen", source: "Brynjolfsson 2025" },
            { num: "§ 87", label: "BetrVG Mitbestimmung bei KI", source: "BetrVG Abs. 1 Nr. 6" },
          ].map((item) => (
            <div
              key={item.num}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 22,
                background: "#FFFDF8",
                border: "3px solid #0B0908",
                boxShadow: "5px 5px 0 #0B0908",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#C4431A",
                  fontFamily: "monospace",
                }}
              >
                {item.num}
              </div>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                {item.label}
              </div>
              <div style={{ display: "flex", fontSize: 13, color: "#4f4640", fontFamily: "monospace" }}>
                {item.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
