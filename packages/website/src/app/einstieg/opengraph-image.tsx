import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Was ist KI? Ein Einstieg ohne Vorwissen — loehrning.ai";
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
          padding: "72px",
          background: "linear-gradient(135deg, #f3f0e9 0%, #e8e3d6 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Das Ö mark — hard-cornered umlaut, counter knocked out (evenodd) */}
          <svg width="30" height="40" viewBox="18 8 60 80" fill="#B73A15">
            <rect x="26" y="8" width="16" height="16" />
            <rect x="54" y="8" width="16" height="16" />
            <path d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 700, color: "#0B0908" }}>
            loehrning<span style={{ color: "#B73A15" }}>.ai</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "18px", color: "#B73A15", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Stufe 1: Orientierung
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "64px",
              fontWeight: 800,
              color: "#0B0908",
              lineHeight: 1.05,
            }}
          >
            <div>Was ist KI?</div>
            <div>Ein Einstieg</div>
            <div>ohne Vorwissen.</div>
          </div>
          <div style={{ fontSize: "24px", color: "#4f4640", lineHeight: 1.4 }}>
            10 Minuten. Kein Vorwissen. Kein Login.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
