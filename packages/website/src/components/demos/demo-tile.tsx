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
      className="demo-gallery-tile group relative flex min-w-0 flex-col text-foreground"
    >
      {/* Schematic drawing on a recessed Beton panel, the tile's only box
          (blueprint 6.14). Every tile has the same 4:3 panel, so a row lines
          up without spans. Hover darkens the panel one tone; no lift, no
          shadow. Decorative: the tile's aria-label and visible text carry the
          meaning, so screen readers skip the drawing's short labels. */}
      <div
        aria-hidden="true"
        data-demo-preview
        className="relative flex aspect-[4/3] overflow-hidden bg-inset transition-colors duration-[120ms] group-hover:bg-[color-mix(in_srgb,var(--color-inset),var(--color-foreground)_5%)] motion-reduce:transition-none"
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

      {/* The text block takes the row's slack so the link sits on one line
          across a row. */}
      <div className="flex min-w-0 flex-1 flex-col pt-4">
        <p className="text-label text-muted-foreground tabular-nums">
          <span>{demo.n}</span>
          {" · "}
          {categoryLabel}
          {leadIndustry ? ` · ${leadIndustry}` : ""}
        </p>
        <h3 className="mt-2 break-words text-fluid-h3 font-bold text-foreground text-balance hyphens-manual">
          {name}
        </h3>
        <p className="mt-3 max-w-[60ch] break-words text-[0.9375rem] leading-relaxed text-muted-foreground">
          {demo.description}
        </p>
        <p className="mt-auto pt-3 text-caption text-muted-foreground" data-demo-tile-meta>
          {evidenceLabel} · {levelLabel}
        </p>
        <span className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 group-hover:decoration-foreground">
          {copy.open}
          <ArrowGlyph />
        </span>
      </div>
    </Link>
  );
}
