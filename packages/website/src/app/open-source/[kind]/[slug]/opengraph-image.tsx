import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { OG_FONT_FAMILY, OgColophon } from "@/lib/plakat/og";
import { PAPER } from "@/lib/plakat/palettes";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  getOpenSourceArtifactByRoute,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_SHARED_COPY,
} from "@/lib/open-source/display-copy";

export const alt = "loehrning.ai open-source artifact";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the module-local DETAIL_ARTIFACTS of page.tsx. A route file may only
// export known route exports, so the list is re-derived here instead of shared.
const DETAIL_ARTIFACTS = [
  ...OPEN_SOURCE_TOOL_ARTIFACTS,
  ...OPEN_SOURCE_PROJECT_ARTIFACTS,
  ...OPEN_SOURCE_VIDEO_ARTIFACTS,
] as const;

const INSET = 64;

// The site face from src/fonts, read on the Node runtime. The card reads the
// request locale, so it renders per request, not at build time; the font
// files reach the deployed function through outputFileTracingIncludes in
// next.config.ts (see requests.md G5a-fix). Open source stays paper
// (SPEC §2.3): Kalkweiß, Druckschwarz type, one Mennige label and the shared
// colophon strip with the header's L tile.
let fontData: Promise<{ bold: Buffer; regular: Buffer }> | undefined;
async function ogFonts() {
  fontData ??= Promise.all([
    readFile(join(process.cwd(), "src/fonts/Figtree-Bold.ttf")),
    readFile(join(process.cwd(), "src/fonts/Figtree-Regular.ttf")),
  ]).then(([bold, regular]) => ({ bold, regular }));
  const { bold, regular } = await fontData;
  return [
    { name: OG_FONT_FAMILY, data: bold, weight: 700 as const, style: "normal" as const },
    { name: OG_FONT_FAMILY, data: regular, weight: 400 as const, style: "normal" as const },
  ];
}

export function generateStaticParams() {
  return DETAIL_ARTIFACTS.map((artifact) => ({
    kind: `${artifact.kind}s`,
    slug: artifact.slug,
  }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;
  const registryArtifact = getOpenSourceArtifactByRoute(kind, slug);
  // A card only exists for a published artifact; an unlisted route resolves to
  // 404 rather than serving a generic card for an unbounded slug space.
  if (!registryArtifact) notFound();
  const locale = await getRequestLocale();
  const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
  const copy = OPEN_SOURCE_SHARED_COPY[locale];
  const title = artifact.title;
  const description = artifact.description;
  const chips = [
    artifact.license.licenseId ?? (locale === "de" ? "Lizenz hinterlegt" : "License recorded"),
    artifact.language,
    // Narrowed before `guide` is read: a video artifact has no guide.
    ...(artifact.kind === "tool" || artifact.kind === "project"
      ? [copy.statuses[artifact.guide.status]]
      : []),
    artifact.source.revision.slice(0, 7),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPER.kalkweiss,
          color: PAPER.druckschwarz,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: `${INSET}px ${INSET}px 0 ${INSET}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.3,
              color: PAPER.mennige,
            }}
          >
            {locale === "de" ? "Open-Source-Artefakt" : "Open-source artifact"}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: title.length > 26 ? 64 : 76,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              maxWidth: 1072,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.35,
              maxWidth: 980,
            }}
          >
            {description}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto", paddingBottom: 28 }}>
            {chips.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "8px 14px",
                  border: `2px solid ${PAPER.druckschwarz}`,
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            margin: `0 ${INSET}px`,
            borderTop: `2px solid ${PAPER.druckschwarz}`,
          }}
        />
        <OgColophon
          inset={INSET}
          trailing={locale === "de" ? "/open-source" : "/en/open-source"}
        />
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
