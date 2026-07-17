import { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";

export const runtime = "edge";
export const alt =
  "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus und deine Rechte, Stand Juli 2026.";
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
          background: "#0d0b09",
          color: "#F3F0E9",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: "#f97316",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 900, color: "#a89070" }}>
            loehrning.ai · Blog · Nº {getPostNumberLabel("eu-ai-act-grundlagen")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            Der EU AI Act.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "#a89070",
              maxWidth: 900,
            }}
          >
            Was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus
            und deine Rechte, Stand Juli 2026.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            { num: "Art. 5", label: "Verbote gelten seit 2. Feb 2025", source: "Reg. 2024/1689" },
            { num: "Art. 50", label: "Transparenz ab 2. Aug 2026", source: "Reg. 2024/1689" },
            { num: "Anhang III", label: "Hochrisiko ab Dez 2027, beschlossen", source: "AI Omnibus, 29. Juni 2026" },
          ].map((item) => (
            <div
              key={item.num}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 22,
                background: "#1a1612",
                border: "2px solid #f97316",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#f97316",
                  fontFamily: "monospace",
                }}
              >
                {item.num}
              </div>
              <div style={{ display: "flex", fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: "#F3F0E9" }}>
                {item.label}
              </div>
              <div style={{ display: "flex", fontSize: 12, color: "#a89070", fontFamily: "monospace" }}>
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
