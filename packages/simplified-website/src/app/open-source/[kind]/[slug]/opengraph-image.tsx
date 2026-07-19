import { ImageResponse } from "next/og";
import { STATUS_LABELS } from "@/components/open-source/status-labels";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  getOpenSourceArtifactByRoute,
} from "@/lib/open-source/artifacts";

export const alt = "loehrning.ai Open-Source-Artefakt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the module-local DETAIL_ARTIFACTS of page.tsx. A route file may only
// export known route exports, so the list is re-derived here instead of shared.
const DETAIL_ARTIFACTS = [
  ...OPEN_SOURCE_TOOL_ARTIFACTS,
  ...OPEN_SOURCE_PROJECT_ARTIFACTS,
  ...OPEN_SOURCE_VIDEO_ARTIFACTS,
] as const;

export function generateStaticParams() {
  return DETAIL_ARTIFACTS.map((artifact) => ({
    kind: `${artifact.kind}s`,
    slug: artifact.slug,
  }));
}

export default function Image({
  params,
}: {
  params: { kind: string; slug: string };
}) {
  const artifact = getOpenSourceArtifactByRoute(params.kind, params.slug);
  const title = artifact?.title ?? "Open-Source-Artefakt";
  const description =
    artifact?.description ??
    "Werkzeuge und Projekte von loehrning.ai: öffentliches Repository, Commit-Pin, Lizenz, Anleitung.";
  const chips = artifact
    ? [
        artifact.license.licenseId ?? "Lizenz hinterlegt",
        artifact.language,
        // Narrowed before `guide` is read: a video artifact has no guide.
        ...(artifact.kind === "tool" || artifact.kind === "project"
          ? [STATUS_LABELS[artifact.guide.status]]
          : []),
        artifact.source.revision.slice(0, 7),
      ]
    : ["Open Source", "Commit-Pin", "Lizenz", "Anleitung"];

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
            Open-Source-Artefakt
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
            {description}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 670 }}>
            {chips.map((label) => (
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
            /open-source
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
