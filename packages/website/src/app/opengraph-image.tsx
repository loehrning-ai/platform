import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Large copper Ö logo above the loehrning.ai wordmark on a warm cream background.";
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
          alignItems: "center",
          justifyContent: "center",
          gap: "26px",
          background: "#F3F0E9",
          boxShadow: "inset 0 0 0 2px #D8D0C1",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* The mark remains legible when LinkedIn reduces the image to a small feed card. */}
        <svg
          width="276"
          height="368"
          viewBox="18 8 60 80"
          fill="#B73A15"
          aria-hidden="true"
        >
          <rect x="26" y="8" width="16" height="16" />
          <rect x="54" y="8" width="16" height="16" />
          <path
            d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z"
            fillRule="evenodd"
          />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: "48px",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#0B0908",
          }}
        >
          loehrning<span style={{ color: "#B73A15" }}>.ai</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
