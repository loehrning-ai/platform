/**
 * Where things sit in the scene's drawing box. The box is as wide and as
 * tall as the plot really is (measured in the browser), so one unit is one
 * pixel and the chart text stays 15 px on a phone and on a projector alike.
 * The header (name, word tag, big number) is HTML above the box, so the
 * drawing box holds only the plot, the month names and one note row.
 */
export interface Geo {
  readonly W: number;
  readonly H: number;
  readonly X0: number;
  readonly X1: number;
  /** Top and bottom of the plot (the bars and the grid). */
  readonly Y0: number;
  readonly Y1: number;
  readonly maxBar: number;
  readonly wide: boolean;
}

export const DEFAULT_WIDTH = 286;
/** The reserved heights (px) of the drawing box: a phone, and the least a wide box gets. */
export const PHONE_HEIGHT = 204;
export const MIN_HEIGHT = 170;
/** A bottom row for the note that zero lies below the frame. */
export const NOTE_ROW = 18;
/** Month names under the plot. */
export const MONTH_ROW = 26;
/** Air above the plot for a bar label or a stamp. */
export const TOP_ROW = 6;
const MIN_WIDTH = 240;
const MAX_WIDTH = 1200;

export function geometry(width: number, height: number = PHONE_HEIGHT): Geo {
  const W = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));
  const H = Math.max(MIN_HEIGHT, Math.round(height));
  const wide = W >= 480;
  return {
    W,
    H,
    X0: 46,
    X1: W - 4,
    Y0: TOP_ROW,
    Y1: H - NOTE_ROW - MONTH_ROW,
    maxBar: wide ? 150 : 72,
    wide,
  };
}

/** Rough width of a text in em: digits and capitals wide, separators and spaces narrow. Enough to fit, never to measure. */
export function estimateEm(text: string): number {
  let total = 0;
  for (const char of text) total += /[.,:;' !|]/.test(char) ? 0.3 : /[0-9A-ZÄÖÜ€−<]/.test(char) ? 0.62 : 0.54;
  return total;
}

/** The biggest font size (at most `max`, at least `min`) at which `text` still fits `available` units. */
export function fitSize(text: string, available: number, max: number, min = 20): number {
  return Math.max(min, Math.min(max, Math.floor(available / estimateEm(text))));
}
