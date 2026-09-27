import type { CSSProperties } from "react";
import { BOLD_ADVANCES, BOLD_KERNING, UNITS_PER_EM } from "./type-metrics";

/**
 * The poster headline fit rule (Werkzeichnung v2, SPEC §4).
 *
 * `.poster-title` sets its size to
 *   max(2.125rem, min(var(--text-poster), calc(100cqi / var(--fit))))
 * where `--fit` is the em width of the title's longest unbreakable segment.
 * The component writes `--fit` inline from `fitEm()` (band titles add the
 * fallback-face headroom, `posterTitleFallbackStyle()`), so the longest word
 * always fits its column: "Geschäftsberichte" takes about 34px at 320 and
 * 43px at 390, every shorter title reaches the 50px poster size.
 *
 * Widths come from `type-metrics.ts`, measured from the bold web font in
 * Chromium (scripts/plakat/build-type-metrics.mjs). Pure functions, no DOM:
 * server components compute `--fit` while rendering.
 */

/** `--text-poster--letter-spacing`, applied after every character, in em. */
export const POSTER_TRACKING_EM = -0.04;

/** Headroom on the measured width, for rounding and rendering differences. */
export const POSTER_FIT_SAFETY = 1.03;

/**
 * The CSS size model of `.poster-title`, in px: the 2.125rem floor, and
 * `--text-poster: clamp(3.125rem, 1.9rem + 5.2vw, 6rem)`.
 */
export const POSTER_TITLE_SIZE = {
  floor: 34,
  min: 50,
  max: 96,
  base: 30.4,
  perViewport: 0.052,
} as const;

/** `var(--fit, 0.01)` in globals.css: the value for an empty title. */
const EMPTY_FIT = 0.01;

/** A glyph the font does not map is set in the fallback face; assume the widest glyph. */
const FALLBACK_ADVANCE = Math.max(...Object.values(BOLD_ADVANCES));

/**
 * Spaces where a line may break; no-break spaces (U+00A0, U+2007, U+202F)
 * are not among them. Built from a string: some transpilers turn a U+2028
 * escape inside a regex literal into a raw line separator.
 */
const BREAKING_SPACE = new RegExp(
  "[\\t\\n\\f\\r \\u1680\\u2000-\\u2006\\u2008-\\u200a\\u200b\\u2028\\u2029\\u205f\\u3000]+",
  "u",
);

/** A line may break after these: hyphen-minus, hyphen, en dash and em dash. */
const BREAK_AFTER = new Set(["-", "\u2010", "\u2013", "\u2014"]);

const SOFT_HYPHEN = "\u00ad";

/**
 * The pieces of `text` that can never be split across lines: words between
 * breaking spaces, cut again after each hyphen or dash. A soft hyphen is a
 * break too, and the piece before it then ends in a visible hyphen.
 */
export function breakSegments(text: string): string[] {
  const segments: string[] = [];
  for (const word of text.normalize("NFC").split(BREAKING_SPACE)) {
    let current = "";
    for (const character of word) {
      if (character === SOFT_HYPHEN) {
        if (current) segments.push(`${current}-`);
        current = "";
        continue;
      }
      current += character;
      if (BREAK_AFTER.has(character)) {
        segments.push(current);
        current = "";
      }
    }
    if (current) segments.push(current);
  }
  return segments;
}

/**
 * Width of a segment in em as `.poster-title` sets it: glyph advances, pair
 * kerning and the -0.04em tracking after every character (Chromium adds
 * letter-spacing after the last character too).
 */
export function segmentEm(segment: string): number {
  const characters = [...segment.normalize("NFC")];
  let units = 0;
  characters.forEach((character, index) => {
    units += BOLD_ADVANCES[character] ?? FALLBACK_ADVANCE;
    if (index > 0) units += BOLD_KERNING[characters[index - 1] + character] ?? 0;
  });
  return units / UNITS_PER_EM + POSTER_TRACKING_EM * characters.length;
}

/** The longest unbreakable segment of `text` and its width in em. */
export function longestSegment(text: string): { readonly segment: string; readonly em: number } {
  let longest = { segment: "", em: 0 };
  for (const segment of breakSegments(text)) {
    const em = segmentEm(segment);
    if (em > longest.em) longest = { segment, em };
  }
  return longest;
}

/**
 * `--fit` for a poster title: the em width of its longest unbreakable
 * segment with the safety headroom, rounded up to three decimals.
 */
export function fitEm(text: string): number {
  const { em } = longestSegment(text);
  if (em <= 0) return EMPTY_FIT;
  return Math.ceil(em * POSTER_FIT_SAFETY * 1000) / 1000;
}

/**
 * The inline style that hands `--fit` to `.poster-title`:
 *   <h1 className="poster-title" style={posterTitleStyle(head)}>
 */
export function posterTitleStyle(text: string): CSSProperties {
  return { "--fit": String(fitEm(text)) } as CSSProperties;
}

/**
 * Extra headroom over `fitEm()` for a title that runs to its column edge on a
 * phone (the home hero, demo detail, /kurse). `font-display: optional` can
 * leave a first visit on the Arial-metric fallback face, which sets poster
 * words about 4.4% wider than Loehrning Sans (measured with Liberation Sans
 * Bold in Chromium); 5% keeps those titles inside their column.
 */
export const POSTER_FALLBACK_HEADROOM = 1.05;

/** `fitEm()` with the fallback headroom, rounded up to three decimals. */
export function fallbackFitEm(text: string): number {
  return Math.ceil(fitEm(text) * POSTER_FALLBACK_HEADROOM * 1000) / 1000;
}

/** `posterTitleStyle()` with the fallback headroom. */
export function posterTitleFallbackStyle(text: string): CSSProperties {
  return { "--fit": String(fallbackFitEm(text)) } as CSSProperties;
}

/**
 * The text the fit rule measures for a headline set in parts whose first two
 * parts are one unbreakable line (joined by a no-break space in the markup,
 * as the home hero sets "KI verstehen." / "Understand AI.").
 */
export function noBreakFirstLine(parts: readonly string[]): string {
  const [first = "", second = "", ...rest] = parts;
  return [`${first}\u00a0${second}`, ...rest].join(" ");
}

/** `--text-poster` at a viewport width, in px. */
export function posterSizeAt(viewport: number): number {
  const { min, max, base, perViewport } = POSTER_TITLE_SIZE;
  return Math.min(max, Math.max(min, base + perViewport * viewport));
}

/**
 * The font size `.poster-title` resolves to, in px, for a title with the
 * given `--fit` in a column (the container's inline size) at a viewport.
 */
export function posterTitleSize(fit: number, column: number, viewport: number): number {
  return Math.max(POSTER_TITLE_SIZE.floor, Math.min(posterSizeAt(viewport), column / fit));
}
