import { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";

export const runtime = "edge";
export const alt = "Deepfakes erkennen: Drei kostenlose Werkzeuge und eine visuelle Checkliste.";
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
            loehrning.ai · Blog · Nº {getPostNumberLabel("deepfake-erkennen")}
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
            Deepfakes erkennen.
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
            Drei kostenlose Werkzeuge, 10-Punkt-Checkliste und deine Rechte nach EU AI Act Art. 50.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            { num: "3", label: "kostenlose Werkzeuge", detail: "Rückwärtssuche, WeVerify, Hive" },
            { num: "10", label: "visuelle Indikatoren", detail: "Haare, Augen, Finger..." },
            { num: "Art. 50", label: "EU AI Act", detail: "Kennzeichnungspflicht ab 2026-08-02" },
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
              <div style={{ display: "flex", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                {item.label}
              </div>
              <div style={{ display: "flex", fontSize: 13, color: "#4f4640", fontFamily: "monospace" }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
