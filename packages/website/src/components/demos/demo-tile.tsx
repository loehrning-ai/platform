"use client";

import Link from "next/link";
import type { Demo, DemoSize } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY, DEMO_EVIDENCE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { ArrowGlyph, Chip, cx } from "@/components/werk";
import { getGalleryPreview } from "./demo-gallery-registry";
import { DemoLocaleProvider } from "./demo-locale";

/**
 * Grid spans per registry size. The bento keeps its hierarchy (one 2x2
 * opener, three tall, two wide, six single tiles) while every tile is the
 * same paper sheet; demo-bento-tiling.test.ts simulates these spans.
 */
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

/**
 * The preview band. Tiles that span two rows let the drawing grow into the
 * extra height; single-row tiles keep one fixed band so a row of neighbours
 * lines up.
 */
function previewSizeClass(size: DemoSize): string {
  switch (size) {
    case "s-hero":
      return "min-h-56 flex-1 lg:min-h-72";
    case "s-tall":
      return "min-h-44 flex-1";
    case "s-wide":
      return "h-44";
    case "s-med":
      return "h-44";
  }
}

/** Long descriptions are cut on the narrow tiles; the wide ones show all. */
function descriptionClampClass(size: DemoSize): string {
  return size === "s-hero" || size === "s-wide" ? "" : "line-clamp-4";
}

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

  return (
    <Link
      href={localizeHref(`/demos/${demo.slug}?source=gallery`, locale)}
      prefetch={false}
      data-demo-tile={demo.slug}
      data-demo-size={demo.size}
      aria-label={copy.openAria(`${demo.title} ${demo.titleKicker}`)}
      className={cx(
        "demo-gallery-tile group relative flex min-w-0 flex-col border border-hairline bg-card text-foreground",
        "transition-colors duration-[120ms] hover:border-foreground motion-reduce:transition-none",
        tileSizeClass(demo.size),
      )}
    >
      {/* Schematic drawing on a recessed Beton band. Decorative: the tile's
          aria-label and visible text carry the meaning, so screen readers
          skip the drawing's short labels. */}
      <div
        aria-hidden="true"
        data-demo-preview
        className={cx(
          "relative flex overflow-hidden border-b border-hairline bg-inset",
          previewSizeClass(demo.size),
        )}
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

      <div
        className={cx(
          "flex min-w-0 flex-col px-5 pb-4 pt-5",
          // Single-row tiles stretch to the tallest neighbour; the text block
          // takes that slack so chips and link sit on one line across a row.
          demo.size === "s-med" || demo.size === "s-wide" ? "flex-1" : undefined,
        )}
      >
        <p className="text-label text-muted-foreground tabular-nums">
          <span>{demo.n}</span>
          {" · "}
          {categoryLabel}
          {leadIndustry ? ` · ${leadIndustry}` : ""}
        </p>
        <h3 className="mt-2 break-words text-fluid-h3 font-bold text-foreground text-balance">
          {demo.title} <span>{demo.titleKicker}</span>
        </h3>
        <p
          className={cx(
            "mt-3 max-w-[60ch] break-words text-[0.9375rem] leading-relaxed text-muted-foreground",
            descriptionClampClass(demo.size),
          )}
        >
          {demo.description}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Chip>{evidenceLabel}</Chip>
          <Chip>{levelLabel}</Chip>
        </div>
        <span className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 group-hover:decoration-foreground">
          {copy.open}
          <ArrowGlyph />
        </span>
      </div>
    </Link>
  );
}
