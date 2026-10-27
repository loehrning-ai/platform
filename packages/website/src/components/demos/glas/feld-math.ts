/**
 * The field ("Feld", glass-spec 3), as pure data: the ground, and three
 * radial pools whose positions are a function of the demo's state. Pools are
 * content: the palette ink stays at 4.5:1 over each at its cap (glas.test.ts).
 */

import { GLAS_HUB_GROUND, GLAS_HUB_POOLS, GLAS_POOLS, saturateHex, type GlasPool } from "@/lib/glas";
import { PLAKAT, type PlakatKey } from "@/lib/plakat/palettes";

export interface FeldPool extends GlasPool {
  /** Centre, as a share of the stage width (0 left, 1 right). */
  readonly x: number;
  /** Centre, as a share of the stage height (0 top, 1 bottom). */
  readonly y: number;
  /** Diameter, as a share of the stage width (0.6 to 1.1). */
  readonly size: number;
}

export interface Feld {
  readonly ground: string;
  readonly pools: readonly FeldPool[];
}

/** Where the three pools rest when nothing is happening: top left, right, bottom. */
export const FELD_REST: readonly Pick<FeldPool, "x" | "y" | "size">[] = [
  { x: 0.12, y: 0.18, size: 0.9 },
  { x: 0.92, y: 0.42, size: 0.8 },
  { x: 0.38, y: 0.98, size: 1.05 },
];

/**
 * The field of a workshop palette. `positions` moves the pools (same order as
 * GLAS_POOLS[plakat]); missing entries rest. Alphas are the proven caps and
 * can only be lowered (`dim`).
 */
export function feldFor(
  plakat: PlakatKey,
  positions: readonly (Partial<Pick<FeldPool, "x" | "y" | "size">> | undefined)[] = [],
  dim = 1,
): Feld {
  return {
    ground: PLAKAT[plakat].ground,
    pools: GLAS_POOLS[plakat].map((pool, index) => ({
      ...pool,
      alpha: pool.alpha * Math.min(1, Math.max(0, dim)),
      ...(FELD_REST[index] ?? FELD_REST[0]!),
      ...(positions[index] ?? {}),
    })),
  };
}

/** The hub's own field: Kalkweiß with three soft pools. */
export function hubFeld(positions: readonly (Partial<Pick<FeldPool, "x" | "y" | "size">> | undefined)[] = []): Feld {
  return {
    ground: GLAS_HUB_GROUND,
    pools: GLAS_HUB_POOLS.map((pool, index) => ({ ...pool, ...(FELD_REST[index] ?? FELD_REST[0]!), ...(positions[index] ?? {}) })),
  };
}

function hexToRgbTriplet(hex: string): string {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)).join(" ");
}

/**
 * The frost copy of a field for a stage of `width` x `height` px: the pools as
 * wider radial gradients at 1.3x saturation over the ground, so a surface can
 * paint the field inside itself without any filter (glass-spec 7, frost).
 */
export function frostImage(feld: Feld, width: number, height: number): string {
  const layers = feld.pools.map((pool) => {
    const radius = Math.round((pool.size * width) / 2 * 1.15);
    const colour = hexToRgbTriplet(saturateHex(pool.colour, 1.3));
    const x = Math.round(pool.x * width);
    const y = Math.round(pool.y * height);
    return `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgb(${colour} / ${pool.alpha.toFixed(3)}), rgb(${colour} / 0) 100%)`;
  });
  return [...layers, `linear-gradient(${feld.ground}, ${feld.ground})`].join(", ");
}
