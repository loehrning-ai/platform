"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Demo, DemoLevel } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getGalleryPreview } from "./demo-gallery-registry";
import { DemoLocaleProvider } from "./demo-locale";

const SIZE_CLASS: Record<Demo["size"], string> = {
  "s-hero": "md:[grid-column:span_8] md:[grid-row:span_4]",
  "s-wide": "md:[grid-column:span_8] md:[grid-row:span_3]",
  "s-tall": "md:[grid-column:span_4] md:[grid-row:span_4]",
  "s-med": "md:[grid-column:span_4] md:[grid-row:span_3]",
};

const TITLE_SIZE: Record<Demo["size"], string> = {
  "s-hero": "text-[clamp(1.75rem,8vw,2.45rem)]",
  "s-wide": "text-[clamp(1.55rem,7vw,2.05rem)]",
  "s-tall": "text-[clamp(1.4rem,6vw,1.75rem)]",
  "s-med": "text-[clamp(1.3rem,6vw,1.6rem)]",
};

// Level badges sit on a translucent tint of their own hue, so the readable
// text colour differs by tile theme: on a light tile the tint is pale and needs
// a dark ink; on a dark tile the tint is deep and needs a light ink. The static
// single-colour version was sub-AA on one theme each (e.g. bright green #22c55e
// at 1.79:1 on the pale-green light badge; #0B0908 at 1.0:1 on the dark fortg
// badge). These pairings all clear WCAG AA on their actual rendered background.
function levelColorClass(level: DemoLevel, dark: boolean): string {
  switch (level) {
    case "einstieg":
      return dark
        ? "bg-[var(--color-risk-green)]/15 text-[var(--color-risk-green)] border-[var(--color-risk-green)]"
        : "bg-[var(--color-risk-green)]/15 text-[#166534] border-[var(--color-risk-green)]";
    case "mittel":
      return dark
        ? "bg-brand-orange/10 text-kupfer-light border-brand-orange"
        : "bg-brand-orange/10 text-brand-orange border-brand-orange";
    case "fortg":
      return dark
        ? "bg-background/10 text-background border-background/60"
        : "bg-foreground/10 text-foreground border-foreground";
  }
}

export function DemoTile({
  demo,
  total,
  locale = "de",
}: {
  demo: Demo;
  total: number;
  locale?: Locale;
}) {
  const Preview = getGalleryPreview(demo.slug);
  const dark = demo.dark;
  const copy = DEMOS_PAGE_COPY[locale].tile;
  const levelLabel = DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level];
  const categoryLabel = DEMO_CATEGORY_LABELS[locale][demo.category];
  const evidenceLabel = DEMO_EVIDENCE_COPY[locale][demo.evidenceMode].label;
  const containerClass = [
    "demo-gallery-tile group relative flex flex-col overflow-hidden border transition-[background-color,border-color,color,opacity,transform,box-shadow]",
    "hover:-translate-x-[3px] hover:-translate-y-[3px]",
    dark
      ? "bg-foreground text-background border-foreground hover:shadow-[8px_8px_0_0_var(--color-brand-orange)]"
      : "bg-background text-foreground border-foreground/20 hover:shadow-[8px_8px_0_0_var(--color-foreground)]",
    SIZE_CLASS[demo.size],
  ].join(" ");

  // On dark tiles (#0B0908 body) kupfer #A5370F is only 2.98:1; the lighter
  // copper #E07050 reaches 6.18:1. Light tiles keep #A5370F (5.85:1 on cream).
  const accent = dark ? "text-kupfer-light" : "text-brand-orange";

  return (
    <Link
      href={localizeHref(`/demos/${demo.slug}?source=gallery`, locale)}
      prefetch={false}
      data-demo-tile={demo.slug}
      className={containerClass}
      aria-label={copy.openAria(`${demo.title} ${demo.titleKicker}`)}
    >
      {/* Corner registration marks */}
      <span className="demo-corner demo-corner-tl" aria-hidden="true" />
      <span className="demo-corner demo-corner-tr" aria-hidden="true" />
      <span className="demo-corner demo-corner-bl" aria-hidden="true" />
      <span className="demo-corner demo-corner-br" aria-hidden="true" />

      {/* Header: number + level badge */}
      <div className="flex items-center justify-between border-b border-current/15 px-4 py-2">
        <span
          className={`font-mono text-[10px] font-bold tracking-[0.14em] uppercase ${accent}`}
        >
          {copy.kind} <strong>{demo.n}</strong>{" "}
          {/* No opacity de-emphasis: the kupfer accent at <100% opacity drops
             below 4.5:1 on both tile themes. Full opacity keeps it AA. */}
          <span aria-hidden="true">/</span>{" "}
          <span>{String(total).padStart(2, "0")}</span>
        </span>
        <span
          className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] border px-2 py-0.5 ${levelColorClass(demo.level, dark)}`}
        >
          {levelLabel}
        </span>
      </div>

      {/* Title + description */}
      <div className="min-w-0 px-4 pb-2 pt-4 sm:px-5">
        <div
          className={`mb-3 flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${dark ? "text-background/70" : "text-muted-foreground"}`}
        >
          <span className={`border border-current/25 px-2 py-1 ${accent}`}>
            {evidenceLabel}
          </span>
          <span>{categoryLabel}</span>
        </div>
        <h2
          className={`break-words font-bold leading-[1.02] tracking-[-0.03em] ${TITLE_SIZE[demo.size]}`}
        >
          {demo.title} <span className={accent}>{demo.titleKicker}</span>
        </h2>
        <p
          className={`mt-3 break-words text-[13px] leading-[1.55] ${dark ? "text-background/75" : "text-muted-foreground"}`}
        >
          {demo.description}
        </p>
      </div>

      {/* Tech-stack subtitle */}
      <div
        className={`min-w-0 px-4 pb-3 font-mono text-[9px] tracking-[0.08em] leading-relaxed flex gap-1.5 items-start sm:px-5 ${dark ? "text-background/55" : "text-muted-foreground"}`}
      >
        <span className={`${accent} shrink-0`}>◆</span>
        <span className="min-w-0 break-words">{demo.background}</span>
      </div>

      {/* Thumbnail preview — purely decorative faux-UI mockup. aria-hidden so
          screen readers skip its dense, non-informative micro-labels (the card's
          aria-label + visible title/description carry the meaning); this also
          keeps axe's color-contrast rule off the intentionally tiny mockup text. */}
      <div
        aria-hidden="true"
        className={`mt-auto overflow-hidden border-t border-current/10 ${dark ? "bg-foreground" : "bg-background"}`}
      >
        {locale === "en" ? (
          <div className="grid min-h-28 grid-cols-[minmax(0,1.35fr)_minmax(72px,0.65fr)] gap-3 p-4">
            <div className="grid content-end gap-2">
              <span
                className={`h-2 w-3/4 ${dark ? "bg-background/25" : "bg-foreground/20"}`}
              />
              <span
                className={`h-2 w-full ${dark ? "bg-background/15" : "bg-foreground/10"}`}
              />
              <span
                className={`h-2 w-5/6 ${dark ? "bg-background/15" : "bg-foreground/10"}`}
              />
              <span className="mt-2 h-1.5 w-2/3 bg-brand-orange" />
            </div>
            <div
              className={`grid place-items-center border ${dark ? "border-background/20 bg-background/5" : "border-foreground/15 bg-foreground/5"}`}
            >
              <span className={`font-mono text-xl font-bold ${accent}`}>
                {demo.n}
              </span>
            </div>
          </div>
        ) : Preview ? (
          <DemoLocaleProvider locale={locale}>
            <Preview />
          </DemoLocaleProvider>
        ) : null}
      </div>

      {/* Footer: category + CTA */}
      <div
        className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-current/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] sm:px-5 ${dark ? "text-background/70" : "text-muted-foreground"}`}
      >
        <span className="min-w-0 break-words">
          ◆ {categoryLabel}
          {demo.industries[0] ? ` · ${demo.industries[0]}` : ""}
        </span>
        <span className={`inline-flex items-center gap-1 font-bold ${accent}`}>
          {copy.open}
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
