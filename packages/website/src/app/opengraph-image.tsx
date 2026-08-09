import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "loehrning.ai: free AI and data learning resources in German and English.";
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "76px",
              fontWeight: 800,
              color: "#0B0908",
              lineHeight: 1.05,
              letterSpacing: "0",
            }}
          >
            <div>AI and data.</div>
            <div>KI und Daten.</div>
            <div>Free to learn.</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "28px",
              color: "#4f4640",
              lineHeight: 1.3,
            }}
          >
            <div>Courses, books, workshops, demos, and source artifacts.</div>
            <div>Each page states access, sources, and completion evidence.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "24px",
            paddingTop: "24px",
            borderTop: "2px solid #B73A15",
          }}
        >
          {["Courses · Kurse", "Books · Bücher", "Workshops", "Open Source"].map((label) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "16px", color: "#4f4640", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Resource · Ressource
              </div>
              <div style={{ fontSize: "20px", color: "#0B0908", fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
