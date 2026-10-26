/**
 * Werkglas, the one glass material of the site (amendment 27): `.glass` in
 * src/app/globals.css. Floating chrome over moving visuals only (the desktop
 * nav on the hub, demo, workshop and open-source pages), at most two visible
 * at once on a desktop and one on a phone, never nested, never on a card, a
 * stage or text that stays put under it. Everything else stays paper.
 *
 * The numbers live here so a unit test can prove the material stays legible
 * over the worst content that can scroll behind it, and so the CSS cannot
 * quietly drop to a thinner tint: globals-css reads GLASS_ALPHA back.
 */

import { contrastRatio, mixHex } from "@/lib/figures/palette";

/** Kalkweiß as the site uses it (--color-background). */
export const GLASS_TINT = "#f7f1e7";
/** Share of the tint in the composite; below 0.78 the Mennige marker drops under 3:1 over a black frame. */
export const GLASS_ALPHA = 0.8;
/** Druckschwarz: body text on glass. */
export const GLASS_INK = "#121212";
/** Mennige: the one accent a marker on glass may use. */
export const GLASS_ACCENT = "#b73a15";
/** Schiefer: the one secondary text colour allowed on glass. */
export const GLASS_MUTED = "#4f4640";
/** Text colours that may sit on glass. Mennige is a mark (3:1), never text on glass. */
export const GLASS_TEXT = [GLASS_INK, GLASS_MUTED] as const;
/**
 * Darkest and loudest things that can sit behind the chrome: a black film or
 * photo frame, ink, the accent, a hairline grey. No credit is given for the
 * blur: a large flat area behind the bar stays flat after blurring.
 */
export const GLASS_WORST_BEHIND = ["#000000", "#121212", "#b73a15", "#4f4640"] as const;
/** WCAG AA for body text on glass. */
export const GLASS_TEXT_MIN = 4.5;
/** WCAG non-text contrast for a mark (rule, square, focus ring) on glass. */
export const GLASS_MARK_MIN = 3;

/** What the eye sees: the tint at `alpha` over `behind` (blur averages, it never darkens). */
export function glassComposite(behind: string, alpha: number = GLASS_ALPHA): string {
  return mixHex(behind, GLASS_TINT, alpha);
}

/** Lowest contrast of `foreground` on glass over every worst-case backdrop. */
export function worstGlassContrast(foreground: string, alpha: number = GLASS_ALPHA): number {
  return Math.min(...GLASS_WORST_BEHIND.map((behind) => contrastRatio(foreground, glassComposite(behind, alpha))));
}
