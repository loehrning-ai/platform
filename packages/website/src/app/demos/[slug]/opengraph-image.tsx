import { ImageResponse } from "next/og";
import { demos } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
  getDemoForLocale,
} from "@/lib/demos-localization";
import { getDemoCopy } from "@/lib/demos-copy";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "loehrning.ai interactive AI example · KI-Praxisbeispiel";

export async function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const demo = getDemoForLocale(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale].og;

  const title = demo ? `${demo.title} ${demo.titleKicker}` : pageCopy.fallbackTitle;
  const subtitle = demo
    ? (getDemoCopy(demo.slug, locale)?.ogSubtitle ?? demo.description)
    : pageCopy.fallbackSubtitle;
  const categoryLine = demo
    ? `${DEMO_CATEGORY_LABELS[locale][demo.category]}${demo.level ? ` · ${DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level]}` : ""}`
    : pageCopy.gallery;
  const slugLine = localizeHref(demo ? `/demos/${demo.slug}` : "/demos", locale);

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
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0B0908",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Das Ö mark — hard-cornered umlaut, counter knocked out (evenodd) */}
          <svg width="36" height="48" viewBox="18 8 60 80" fill="#B73A15">
            <rect x="26" y="8" width="16" height="16" />
            <rect x="54" y="8" width="16" height="16" />
            <path d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 900 }}>
            loehrning<span style={{ color: "#B73A15" }}>.ai</span>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              fontFamily: "monospace",
              fontSize: 14,
              color: "#a89070",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {categoryLine}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: 1060,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.3,
              color: "rgba(11,9,8,0.66)",
              maxWidth: 980,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 14,
              letterSpacing: "0.18em",
              color: "rgba(11,9,8,0.55)",
              textTransform: "uppercase",
            }}
          >
            {slugLine}
          </div>
          <div
            style={{
              display: "flex",
              background: "#B73A15",
              color: "white",
              padding: "10px 18px",
              border: "2px solid #0B0908",
              boxShadow: "4px 4px 0 #0B0908",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {pageCopy.open}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
