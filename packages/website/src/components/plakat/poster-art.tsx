import type { ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import {
  posterComposition,
  type PosterFormat,
  type PosterNode,
  type ShapeRole,
} from "@/lib/plakat/motifs";
import { plakatClass, type MotifId, type PlakatKey } from "@/lib/plakat/palettes";

/** Each role paints in its scene token, so a poster reads right on paper and in every scene. */
export const ROLE_FILL_CLASS: Readonly<Record<ShapeRole, string>> = {
  ground: "fill-scene-ground",
  ink: "fill-scene-ink",
  mid: "fill-scene-mid",
};

export type PosterArtProps = {
  readonly plakat: PlakatKey;
  readonly motif: MotifId;
  /** "01" to "04" where a sequence exists (workshops, Grundlagenpfad); otherwise none (SPEC D9). */
  readonly numeral?: string | null;
  /**
   * portrait 4:5 (thumbnails, covers, the lg band art), landscape 16:9 (the
   * home offering), strip (the phone band art: fills a box of any width).
   */
  readonly format?: PosterFormat;
  /**
   * Corner dots at the poster's corners; defaults to the palette (IDEA).
   * Pass false for poster art inside a band, whose own corners carry
   * `CornerDots` instead.
   */
  readonly cornerDots?: boolean;
  /**
   * Fit in a box of another shape. Default xMaxYMax meet: the whole poster
   * against the right and bottom edges, so in a band its shapes bleed off the
   * band and nothing is cut inside it.
   */
  readonly preserveAspectRatio?: string;
  readonly className?: string;
};

function renderNode(node: PosterNode, key: string): ReactNode {
  switch (node.kind) {
    case "shapes":
      return node.shapes.map((shape, index) => (
        <path
          // Shapes never reorder; the index is their paint order.
          key={`${key}-${index}`}
          d={shape.d}
          transform={shape.transform}
          className={ROLE_FILL_CLASS[shape.role]}
        />
      ));
    case "viewport": {
      const { x, y, width, height, viewBox, preserveAspectRatio, overflowVisible } = node.viewport;
      return (
        <svg
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          overflow={overflowVisible ? "visible" : undefined}
        >
          {node.children.map((child, index) => renderNode(child, `${key}-${index}`))}
        </svg>
      );
    }
    case "numeral": {
      const { x, y, fontSize, letterSpacing, fontWeight, role, keyline } = node.layout;
      // The keyline is a ground-coloured stroke painted under the fill: where
      // the numeral crosses a shape it keeps a knockout gap, whatever face
      // the browser ends up using.
      return (
        <text
          key={key}
          data-poster-numeral-text=""
          x={x}
          y={y}
          fontSize={fontSize}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
          strokeWidth={keyline}
          strokeLinejoin="round"
          paintOrder="stroke fill"
          className={cx(ROLE_FILL_CLASS[role], "stroke-scene-ground font-sans normal-nums")}
        >
          {node.text}
        </text>
      );
    }
  }
}

/**
 * A poster: ground, motif and numeral in the scene's three colours, drawn
 * from src/lib/plakat/motifs.ts. Decorative: the heading or link next to it
 * names the workshop or course, so the SVG is aria-hidden, never focusable,
 * and the numeral is stated in text beside it. Server-rendered, no client
 * JS. The root carries the `plakat-*` scope, so a poster on paper still
 * paints its own scene.
 */
export function PosterArt({
  plakat,
  motif,
  numeral = null,
  format = "portrait",
  cornerDots,
  preserveAspectRatio,
  className,
}: PosterArtProps) {
  const composition = posterComposition({
    plakat,
    motif,
    numeral,
    format,
    ...(cornerDots === undefined ? {} : { cornerDots }),
    ...(preserveAspectRatio === undefined ? {} : { preserveAspectRatio }),
  });
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-poster={plakat}
      data-poster-motif={motif}
      data-poster-format={format}
      viewBox={composition.viewBox ?? undefined}
      preserveAspectRatio={composition.preserveAspectRatio ?? undefined}
      className={cx(plakatClass(plakat), "block size-full overflow-hidden", className)}
    >
      {composition.children.map((node, index) => renderNode(node, String(index)))}
    </svg>
  );
}
