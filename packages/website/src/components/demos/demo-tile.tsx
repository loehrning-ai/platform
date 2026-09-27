"use client";

import Link from "next/link";
import { demoName, type Demo } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { ArrowGlyph } from "@/components/werk";
import { getGalleryPreview } from "./demo-gallery-registry";
import { DemoLocaleProvider } from "./demo-locale";
import { DemoPosterThumb } from "./demo-poster";

export function DemoTile({
  demo,
  locale = "de",
}: {
  demo: Demo;
  locale?: Locale;
}) {
  const Preview = getGalleryPreview(demo.slug);
  const copy = DEMOS_PAGE_COPY[locale].tile;
  const levelLabel = DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level];
  const categoryLabel = DEMO_CATEGORY_LABELS[locale][demo.category];
  const evidenceLabel = DEMO_EVIDENCE_COPY[locale][demo.evidenceMode].label;
  const leadIndustry = demo.industries[0];
  const name = demoName(demo);

  return (
    <Link
      href={localizeHref(`/demos/${demo.slug}?source=gallery`, locale)}
      prefetch={false}
      data-demo-tile={demo.slug}
      data-demo-size={demo.size}
      aria-label={copy.openAria(name)}
      className="demo-gallery-tile group relative flex min-w-0 flex-col text-foreground max-sm:flex-row max-sm:items-start max-sm:gap-4 max-sm:py-4 max-sm:[contain-intrinsic-size:auto_132px]!"
    >
      {/* Schematic drawing on a small IDEA poster (SPEC §3.12): the panel
          takes the plakat-idea scene, so the drawing is Kobalt on Kreide and
          its one mark is Himbeere. It is the tile's only box. Every tile has
          the same 4:3 panel, so a row lines up without spans. Hover darkens
          the panel one tone (Kreide to the scene's card-hover, Kobalt on it
          5.83:1); no lift, no shadow. Decorative: the tile's aria-label and visible text carry the
          meaning, so screen readers skip the drawing's short labels. Below
          sm the tile is a ledger row (blueprint 6.6): a 72px square crop
          of the same poster, a one-sentence teaser, hairlines between rows. The whole row is the
          link, so the row drops the caption and the "open" line and carries
          one arrow beside the name instead. Its content-visibility
          placeholder matches the row height, not the 420px card, so the
          page height does not jump while scrolling. */}
      <div
        aria-hidden="true"
        data-demo-preview
        className="plakat-idea relative flex aspect-[4/3] overflow-hidden transition-colors duration-[120ms] group-hover:bg-[var(--color-card-hover)] motion-reduce:transition-none max-sm:hidden"
      >
        <div
          className="flex w-full items-center justify-center motion-reduce:transform-none motion-reduce:transition-none"
          data-demo-preview-content
        >
          {Preview ? (
            <DemoLocaleProvider locale={locale}>
              <Preview />
            </DemoLocaleProvider>
          ) : null}
        </div>
      </div>

      <DemoPosterThumb slug={demo.slug} className="w-[4.5rem] sm:hidden" />

      {/* The text block takes the row's slack so the link sits on one line
          across a row. */}
      <div className="flex min-w-0 flex-1 flex-col pt-4 max-sm:pt-0">
        <p className="text-label text-muted-foreground tabular-nums">
          <span>{demo.n}</span>
          {" · "}
          {categoryLabel}
          {leadIndustry ? ` · ${leadIndustry}` : ""}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3 max-sm:mt-1">
          <h3 className="min-w-0 break-words text-fluid-h3 font-bold text-foreground text-balance hyphens-manual">
            {name}
          </h3>
          <ArrowGlyph className="mt-1 sm:hidden" />
        </div>
        {/* One card line at every width: the one-sentence teaser, never
            clamped, so no row ends mid-sentence. The detail page carries the
            long description. */}
        <p
          className="mt-1 max-w-[60ch] break-words text-[0.9375rem] leading-normal text-muted-foreground sm:mt-3 sm:leading-relaxed"
          data-demo-tile-teaser
        >
          {demo.teaser}
        </p>
        <p className="mt-auto pt-3 text-caption text-muted-foreground max-sm:hidden" data-demo-tile-meta>
          {evidenceLabel} · {levelLabel}
        </p>
        <span className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 group-hover:decoration-foreground max-sm:hidden">
          {copy.open}
          <ArrowGlyph />
        </span>
      </div>
    </Link>
  );
}
