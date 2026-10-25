import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { TILE_VIEWBOX } from "@/lib/demo-tiles/types";

/** What every demo's tile.tsx receives from the hub (or a demo hero). */
export interface TileProps {
  readonly locale: Locale;
  /** Render without any motion hook, whatever the visitor's setting. */
  readonly reducedMotion?: boolean;
}

/**
 * The frame of every tile scene: a 4:3 SVG on a 400 x 300 viewBox, silent for
 * assistive technology, with one `data-t="root"` group that carries the
 * settle beat. Colours come only from the classes in demo-tile.css (the
 * scene's tokens), so the tile follows its workshop's palette.
 */
export function TileSvg({
  children,
  reducedMotion = false,
}: {
  readonly children: ReactNode;
  readonly reducedMotion?: boolean;
}) {
  return (
    <svg
      className="dt-svg"
      viewBox={TILE_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      data-reduced={reducedMotion ? "" : undefined}
    >
      <g data-t="root">{children}</g>
    </svg>
  );
}

/** A diagonal hatch in the scene's mark colour: "missing" or "wrong", never colour alone. */
export function HatchDef({ id }: { readonly id: string }) {
  return (
    <defs>
      <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" className="dt-fill-ground" />
        <rect width="2.5" height="7" className="dt-fill-mark" />
      </pattern>
    </defs>
  );
}
