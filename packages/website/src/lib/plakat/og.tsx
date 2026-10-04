import type { ReactElement } from "react";
import { POSTER_CANVAS, numeralLayout } from "./motifs";
import { PAPER, PLAKAT, type MotifId, type PlakatKey } from "./palettes";
import { posterSvgDataUri } from "./poster-svg";
import { BOLD_ASCENDER, BOLD_DESCENDER, UNITS_PER_EM } from "./type-metrics";

/**
 * Shared pieces of the social and OG images (Werkzeichnung v2, SPEC §3.15),
 * written for Satori (`ImageResponse` from next/og): inline styles, flexbox,
 * no CSS variables. Load Figtree for them from src/fonts
 * (Figtree-Bold.ttf, and Figtree-Regular.ttf for the light
 * autumn numeral) and pass it to ImageResponse under OG_FONT_FAMILY.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Height of the Kalkweiß colophon strip at the foot of a card. */
export const OG_COLOPHON_HEIGHT = 80;

/** The family name to register the site face under in ImageResponse `fonts`. */
export const OG_FONT_FAMILY = "Figtree";

/**
 * The header's paper colours: Kalkweiß ground, the Mennige tile, its Bogen
 * letter and the Druckschwarz wordmark. Satori cannot read the CSS tokens,
 * so the values come from PAPER in palettes.ts, which palettes.test.ts holds
 * equal to the @theme tokens in globals.css.
 */
export const OG_PAPER = PAPER;

export type OgColophonProps = {
  /** A short line at the right end of the strip, e.g. "Workshop 04 · kostenlos". */
  readonly trailing?: string;
  /** Left and right padding, to align the lockup with the card's text. */
  readonly inset?: number;
  readonly fontFamily?: string;
};

/**
 * The Kalkweiß colophon strip with the real header lockup: the 38px Mennige
 * tile with its Bogen "L" and the "loehrning.ai" wordmark in the ink, 700 at
 * -0.015em, as in the site header. The strip exists because the tile would
 * vanish on Rost (1.07:1) and Ultramarin (2.21:1); on Kalkweiß it keeps its
 * paper pair (Bogen on Mennige 5.40:1).
 */
export function OgColophon({ trailing, inset = 56, fontFamily = OG_FONT_FAMILY }: OgColophonProps): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: OG_COLOPHON_HEIGHT,
        paddingLeft: inset,
        paddingRight: inset,
        background: OG_PAPER.kalkweiss,
        fontFamily,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            marginRight: 12,
            background: OG_PAPER.mennige,
          }}
        >
          <div style={{ display: "flex", fontSize: 18, fontWeight: 700, lineHeight: 1, color: OG_PAPER.bogen }}>
            L
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.015em",
            color: OG_PAPER.druckschwarz,
          }}
        >
          loehrning.ai
        </div>
      </div>
      {trailing ? (
        <div style={{ display: "flex", fontSize: 20, fontWeight: 400, lineHeight: 1, color: OG_PAPER.druckschwarz }}>
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export type OgPosterProps = {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  readonly numeral?: string | null;
  /** Rendered width; the height follows the 4:5 portrait canvas. */
  readonly width: number;
  readonly fontFamily?: string;
};

/**
 * A portrait poster for an OG image. The shapes come from poster-svg.ts as an
 * SVG background image; the numeral is set by Satori on top of it, because the SVG
 * rasteriser behind ImageResponse has no fonts for SVG text. Its position
 * follows the poster canvas (numeralLayout), with the baseline placed from
 * the font's hhea metrics, which is how Satori lays out a line.
 */
export function OgPoster({ plakat, motif, numeral = null, width, fontFamily = OG_FONT_FAMILY }: OgPosterProps): ReactElement {
  const canvas = POSTER_CANVAS.portrait;
  const scale = width / canvas.width;
  const height = Math.round(canvas.height * scale);
  const layout = numeralLayout(plakat, "portrait");
  const fontSize = layout.fontSize * scale;
  const ascent = BOLD_ASCENDER / UNITS_PER_EM;
  const lineHeight = (BOLD_ASCENDER - BOLD_DESCENDER) / UNITS_PER_EM;
  const palette = PLAKAT[plakat];
  const numeralBox = {
    display: "flex",
    position: "absolute",
    left: layout.x * scale,
    top: layout.y * scale - ascent * fontSize,
    fontFamily,
    fontSize,
    fontWeight: layout.fontWeight,
    lineHeight,
    letterSpacing: layout.letterSpacing * scale,
  } as const;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        flexShrink: 0,
        backgroundImage: `url("${posterSvgDataUri({ plakat, motif, numeral: null, width, height })}")`,
        backgroundSize: `${width}px ${height}px`,
      }}
    >
      {numeral ? (
        // Two stacked copies emulate the SVG keyline (paint-order: stroke
        // fill), which Satori has no property for: first a ground-coloured
        // copy with a centred stroke of the keyline width, then the fill copy
        // on top. Where the numeral crosses a shape, the ground cuts the gap.
        [
          <div key="keyline" data-og-numeral="keyline" style={{ ...numeralBox, color: palette.ground, WebkitTextStroke: `${layout.keyline * scale}px ${palette.ground}` }}>
            {numeral}
          </div>,
          <div key="fill" data-og-numeral="fill" style={{ ...numeralBox, color: layout.role === "mid" ? palette.mid : palette.ink }}>
            {numeral}
          </div>,
        ]
      ) : null}
    </div>
  );
}
