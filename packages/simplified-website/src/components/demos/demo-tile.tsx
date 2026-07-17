"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Demo, DemoLevel } from "@/lib/demos";
import { DEMO_LEVEL_LABELS } from "@/lib/demos";
import { trackDemoOpen } from "@/lib/analytics";
import { getGalleryPreview } from "./demo-component-registry";

const SIZE_CLASS: Record<Demo["size"], string> = {
  "s-hero": "md:[grid-column:span_8] md:[grid-row:span_4]",
  "s-wide": "md:[grid-column:span_8] md:[grid-row:span_3]",
  "s-tall": "md:[grid-column:span_4] md:[grid-row:span_4]",
  "s-med":  "md:[grid-column:span_4] md:[grid-row:span_3]",
};

const TITLE_SIZE: Record<Demo["size"], string> = {
  "s-hero": "text-[32px]",
  "s-wide": "text-[26px]",
  "s-tall": "text-[22px]",
  "s-med":  "text-lg",
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

export function DemoTile({ demo, total }: { demo: Demo; total: number }) {
  const Preview = getGalleryPreview(demo.slug);
  const dark = demo.dark;
  const containerClass = [
    "group relative flex flex-col overflow-hidden border transition-[background-color,border-color,color,opacity,transform,box-shadow]",
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
      href={`/demos/${demo.slug}?source=gallery`}
      onClick={() => trackDemoOpen(demo.slug, "gallery")}
      data-demo-tile={demo.slug}
      className={containerClass}
      aria-label={`Praxisbeispiel öffnen: ${demo.title} ${demo.titleKicker}`}
    >
      {/* Corner registration marks */}
      <span className="demo-corner demo-corner-tl" aria-hidden="true" />
      <span className="demo-corner demo-corner-tr" aria-hidden="true" />
      <span className="demo-corner demo-corner-bl" aria-hidden="true" />
      <span className="demo-corner demo-corner-br" aria-hidden="true" />

      {/* Header: number + level badge */}
      <div className="flex items-center justify-between border-b border-current/15 px-4 py-2">
        <span className={`font-mono text-[10px] font-bold tracking-[0.14em] uppercase ${accent}`}>
          Praxisbeispiel <strong>{demo.n}</strong>{" "}
          {/* No opacity de-emphasis: the kupfer accent at <100% opacity drops
             below 4.5:1 on both tile themes. Full opacity keeps it AA. */}
          <span aria-hidden="true">/</span>{" "}
          <span>{String(total).padStart(2, "0")}</span>
        </span>
        <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] border px-2 py-0.5 ${levelColorClass(demo.level, dark)}`}>
          {DEMO_LEVEL_LABELS[demo.level]}
        </span>
      </div>

      {/* Title + description */}
      <div className="px-4 pt-3 pb-1">
        <h2 className={`font-bold leading-[1.05] tracking-[-0.025em] ${TITLE_SIZE[demo.size]}`}>
          {demo.title}{" "}
          <span className={accent}>{demo.titleKicker}</span>
        </h2>
        <p className={`mt-1.5 text-xs leading-snug ${dark ? "text-background/70" : "text-muted-foreground"}`}>
          {demo.description}
        </p>
      </div>

      {/* Tech-stack subtitle */}
      <div className={`px-4 pb-2 font-mono text-[9px] tracking-[0.08em] leading-snug flex gap-1.5 items-start ${dark ? "text-background/50" : "text-muted-foreground"}`}>
        <span className={`${accent} shrink-0`}>◆</span>
        <span>{demo.background}</span>
      </div>

      {/* Thumbnail preview — purely decorative faux-UI mockup. aria-hidden so
          screen readers skip its dense, non-informative micro-labels (the card's
          aria-label + visible title/description carry the meaning); this also
          keeps axe's color-contrast rule off the intentionally tiny mockup text. */}
      <div
        aria-hidden="true"
        className={`mt-auto overflow-hidden border-t border-current/10 ${dark ? "bg-foreground" : "bg-background"}`}
      >
        {Preview ? <Preview /> : null}
      </div>

      {/* Footer: category + CTA */}
      <div className={`flex items-center justify-between border-t border-current/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] ${dark ? "text-background/70" : "text-muted-foreground"}`}>
        <span>
          ◆ {demo.category}
          {demo.industries[0] ? ` · ${demo.industries[0]}` : ""}
        </span>
        <span className={`inline-flex items-center gap-1 font-bold ${accent}`}>
          Details
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
