import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "loehrning.ai: kostenlose KI-Lernplattform auf Deutsch.";
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#C4431A",
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0B0908" }}>
            loehrning.ai
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
            <div>KI lernen.</div>
            <div>Kostenlos.</div>
            <div>Auf Deutsch.</div>
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
            <div>Kurse, Vorlagen, Bücher, Demos und Blog.</div>
            <div>Ohne Login. Mit offener Methodik und Lernmaterialien.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "24px",
            paddingTop: "24px",
            borderTop: "2px solid #C4431A",
          }}
        >
          {["Kurse", "Bücher", "Demos", "Vorlagen"].map((label) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "16px", color: "#4f4640", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Ressource
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
