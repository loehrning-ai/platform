import { ImageResponse } from "next/og";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";

// ─── OG/Twitter image ────────────────────────────
// This course now resolves as a static folder, shadowing the [slug]
// dynamic-segment subtree (and its own opengraph-image.tsx/twitter-
// image.tsx) for this one path — without a local image route here, the
// social-share preview would silently 404 once this course leaves
// generateStaticParams's IMPORTED_COURSE_CATALOG-filtered view. Hardcoded
// (no dynamic params needed) since only this one course lives here.

export const alt = "Data Engineering Fundamentals — interactive course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const locale = await getRequestLocale();
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).socialImage;
  return new ImageResponse(
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
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 900 }}>
          loehrning<span style={{ color: "#B73A15" }}>.ai</span>
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 14,
            fontFamily: "monospace",
            fontSize: 15,
            color: "#B73A15",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {copy.eyebrow}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: 0,
            maxWidth: 1040,
          }}
        >
          Data Engineering Fundamentals
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
          {copy.description}
        </div>
      </div>

      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 24 }}
      >
        <div
          style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 670 }}
        >
          {[...copy.facts, ...copy.topics].map((label) => (
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
            color: "#B73A15",
            fontWeight: 900,
          }}
        >
          /kurse/open-source
        </div>
      </div>
    </div>,
    { ...size },
  );
}
