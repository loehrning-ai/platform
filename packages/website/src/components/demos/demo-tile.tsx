"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Demo, DemoLevel, DemoSize } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getGalleryPreview } from "./demo-gallery-registry";
import { DemoLocaleProvider } from "./demo-locale";

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

function tileSizeClass(size: DemoSize): string {
  switch (size) {
    case "s-hero":
      return "sm:col-span-2 lg:col-span-2 lg:row-span-2";
    case "s-tall":
      return "lg:row-span-2";
    case "s-wide":
      return "sm:col-span-2 lg:col-span-2";
    case "s-med":
      return "";
  }
}

// Reserved height per tile size, kept close to what the mockups actually
// measure so the band hugs its content. The previous values reserved far more
// than the faux-UI drew, and because the content is bottom-anchored the excess
// showed as a band of empty paper above the mockup: 86px on the hero and 165
// to 180px on the two tiles recently promoted to s-tall. Measured mockup
// heights are ~200px for the hero and word, and ~75 to 95px for the rest.
function previewSizeClass(size: DemoSize): string {
  switch (size) {
    case "s-hero":
      return "min-h-52 lg:min-h-56";
    case "s-tall":
      return "min-h-48 lg:min-h-52";
    case "s-wide":
      return "min-h-36";
    case "s-med":
      return "min-h-32";
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
    "demo-gallery-tile group relative flex min-w-0 flex-col overflow-hidden border border-foreground/50 border-t-[3px] border-t-brand-orange transition-[border-color,box-shadow] duration-200 hover:border-brand-orange hover:shadow-[6px_6px_0_0_var(--color-brand-orange)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
    tileSizeClass(demo.size),
    dark
      ? "bg-foreground text-background hover:bg-foreground/95"
      : "bg-background text-foreground hover:bg-card",
  ].join(" ");

  // On dark tiles (#0B0908 body) kupfer #A5370F is only 2.98:1; the lighter
  // copper #E07050 reaches 6.18:1. Light tiles keep #A5370F (5.85:1 on cream).
  const accent = dark ? "text-kupfer-light" : "text-brand-orange";

  return (
    <Link
      href={localizeHref(`/demos/${demo.slug}?source=gallery`, locale)}
      prefetch={false}
      data-demo-tile={demo.slug}
      data-demo-size={demo.size}
      className={containerClass}
      aria-label={copy.openAria(`${demo.title} ${demo.titleKicker}`)}
    >
      {/* Index only, at a fixed height. The badges used to share this row, but
          a 1-column tile at the lg breakpoint offers ~193px of content width
          while the index alone measures ~185px and the widest badge pair
          ~263px. Both sides therefore wrapped, and they wrapped by tile width
          AND by label length, so neighbouring tiles ended up with 44px and
          75px headers and the grid read as misaligned. A fixed height plus a
          truncation guard makes this band identical on every tile at every
          width; the badges moved into the body, where wrapping is expected
          and costs no alignment. */}
      <div className="flex h-11 shrink-0 items-center border-b border-current/20 px-4">
        <span
          className={`min-w-0 truncate font-mono text-xs font-bold tracking-[0.1em] uppercase ${accent}`}
        >
          {copy.kind} <strong>{demo.n}</strong>{" "}
          {/* No opacity de-emphasis: the kupfer accent at <100% opacity drops
             below 4.5:1 on both tile themes. Full opacity keeps it AA. */}
          <span aria-hidden="true">/</span>{" "}
          <span>{String(total).padStart(2, "0")}</span>
        </span>
      </div>

      {/* Thumbnail preview — purely decorative faux-UI mockup. aria-hidden so
          screen readers skip its dense, non-informative micro-labels (the card's
          aria-label + visible title/description carry the meaning); this also
          keeps axe's color-contrast rule off the intentionally tiny mockup text. */}
      <div
        aria-hidden="true"
        data-demo-preview
        className={`relative grid overflow-hidden border-b border-current/20 ${previewSizeClass(demo.size)} ${dark ? "bg-foreground" : "bg-card"}`}
      >
        <div
          className={`pointer-events-none absolute inset-3 border ${dark ? "border-background/15" : "border-foreground/10"}`}
        />
        <div className="absolute left-3 top-3 h-6 w-[3px] bg-brand-orange" />
        <div className="absolute left-3 top-3 h-[3px] w-6 bg-brand-orange" />
        <div
          className="relative flex h-full min-h-full w-full items-end overflow-hidden pt-6 transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none [&>div]:w-full"
          data-demo-preview-content
        >
          {Preview ? (
            <DemoLocaleProvider locale={locale}>
              <Preview />
            </DemoLocaleProvider>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 flex-1 px-4 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`border border-current/25 px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] ${accent}`}
          >
            {evidenceLabel}
          </span>
          <span
            className={`border px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] ${levelColorClass(demo.level, dark)}`}
          >
            {levelLabel}
          </span>
        </div>
        <h2 className="mt-3 break-words text-[clamp(1.4rem,4vw,2rem)] font-bold leading-[1.02] tracking-[-0.035em]">
          {demo.title} <span className={accent}>{demo.titleKicker}</span>
        </h2>
        <p
          className={`mt-3 break-words text-sm leading-relaxed ${dark ? "text-background/75" : "text-muted-foreground"}`}
        >
          {demo.description}
        </p>
        <div
          className={`mt-3 flex min-w-0 items-start gap-2 font-mono text-xs leading-relaxed tracking-[0.05em] ${dark ? "text-background/60" : "text-muted-foreground"}`}
        >
          <span className={`${accent} shrink-0`}>◆</span>
          <span className="min-w-0 break-words">{demo.background}</span>
        </div>
      </div>

      <div
        className={`flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 border-t border-current/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] ${dark ? "text-background/70" : "text-muted-foreground"}`}
      >
        <span className="min-w-0 break-words">
          ◆ {categoryLabel}
          {demo.industries[0] ? ` · ${demo.industries[0]}` : ""}
        </span>
        <span className={`inline-flex items-center gap-1 font-bold ${accent}`}>
          {copy.open}
          <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
