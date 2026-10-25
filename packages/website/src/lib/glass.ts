/**
 * The one glass material of the site (amendment 27): `.glass` in
 * src/app/globals.css. Floating chrome only (a demo bar pinned over a scene,
 * a floating lever), at most two visible at once, never nested, never on a
 * card or a stage. Everything else stays paper.
 *
 * The numbers live here so a unit test can prove the material stays legible
 * over the worst content that can scroll behind it, and so the CSS cannot
 * quietly drop to a thinner tint: globals-css reads GLASS_ALPHA back.
 */

import { contrastRatio, mixHex } from "@/lib/figures/palette";

/** Kalkweiß as the site uses it (--color-background). */
export const GLASS_TINT = "#f7f1e7";
/** Share of the tint in the composite; below 0.76 the Mennige marker drops under 3:1 over Druckschwarz. */
export const GLASS_ALPHA = 0.8;
/** Druckschwarz: body text on glass. */
export const GLASS_INK = "#121212";
/** Mennige: the one accent a marker on glass may use. */
export const GLASS_ACCENT = "#b73a15";
/** Darkest and loudest things that can sit behind the chrome: ink, the accent, a hairline grey. */
export const GLASS_WORST_BEHIND = ["#121212", "#b73a15", "#4f4640"] as const;

/** What the eye sees: the tint at `alpha` over `behind` (blur averages, it never darkens). */
export function glassComposite(behind: string, alpha: number = GLASS_ALPHA): string {
  return mixHex(behind, GLASS_TINT, alpha);
}

/** Lowest contrast of `foreground` on glass over every worst-case backdrop. */
export function worstGlassContrast(foreground: string, alpha: number = GLASS_ALPHA): number {
  return Math.min(...GLASS_WORST_BEHIND.map((behind) => contrastRatio(foreground, glassComposite(behind, alpha))));
}
