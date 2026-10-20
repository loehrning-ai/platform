import { isValidElement, type ReactElement, type ReactNode } from "react";
import { controlKindOf, renderFigure, type FigureSpec } from "@/lib/figures";
import { VARIANT_WIDTH } from "@/components/book-figures/basic/stage-controller";
import { viewBoxOf } from "@/components/book-figures/hero/hero-figure-shared";

/**
 * Does a stage's figure stay legible in the pinned strip below lg?
 *
 * Below lg the pin is a strip of at most 44 % of the screen (chapter-stage.css, --cs-pin-h), so the text window
 * keeps 56 % or more. The engine fits a figure to that box, but a figure has a smallest layout (its flexible rows
 * stop at a minimum); a box shorter than that scales the whole SVG down, labels included. A figure whose
 * smallest label would drop under 11px on the smallest phone the book promises (360x740) is not pinned there:
 * its stage takes the inline layout (every step stacked with its numeral, the figure once, full size), which is
 * a CSS decision on server markup, so hydration changes nothing.
 *
 * The numbers mirror chapter-stage.css and hero.css; chapter-stage.test.tsx keeps them in lockstep.
 */

/** The reference phone: 360x740 CSS px. */
export const STRIP_PHONE = { width: 360, height: 740 } as const;
/** --cs-top below lg (the compact header) and --cs-bar (reader bar row 3.25rem, its 2px rule). */
export const STRIP_TOP_PX = 48;
export const STRIP_BAR_PX = 54;
/** --cs-pin-h: clamp(12rem, 44svh - top - bar, 20rem), minus the pin's two 2px rules. */
export function stripInnerHeight(viewportHeight: number = STRIP_PHONE.height): number {
  const pin = Math.min(320, Math.max(192, viewportHeight * 0.44 - STRIP_TOP_PX - STRIP_BAR_PX));
  return pin - 4;
}
/** Height of the figure's own control under the SVG in the strip (hero.css: 48px button, 44px faces and range, 2px air). */
export const CONTROL_PX: Readonly<Record<string, number>> = { none: 0, cycle: 50, segmented: 50, range: 46 };
/** The smallest label size the strip may draw. */
export const MIN_LABEL_PX = 11;

/** Smallest font size of any visible text in an engine element (the engine writes fontSize on <text>). */
export function smallestFont(node: ReactNode, hidden = false): number {
  if (!isValidElement(node)) {
    return Array.isArray(node) ? Math.min(Infinity, ...node.map((n) => smallestFont(n as ReactNode, hidden))) : Infinity;
  }
  const props = (node as ReactElement<Record<string, unknown>>).props;
  const gone = hidden || props["opacity"] === 0 || props["opacity"] === "0";
  let min = Infinity;
  if (!gone && typeof props["fontSize"] === "number") min = props["fontSize"];
  const children = props["children"] as ReactNode;
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) min = Math.min(min, smallestFont(child as ReactNode, gone));
  return min;
}

export interface StripFit {
  /** False: the stage is inline below lg (its figure cannot keep 11px labels in the strip). */
  readonly fits: boolean;
  /**
   * Height of the figure's smallest layout per unit of its width, and the height of its control in px. The strip
   * is never taller than these need (chapter-stage.css): a short figure leaves the text window more room.
   * Null when the figure has no smallest layout (Das Feld: a canvas at a fixed aspect).
   */
  readonly ratio: number | null;
  readonly controlPx: number;
}

/** How a stage's figure sits in the phone strip. */
export function stripFit(spec: FigureSpec): StripFit {
  const controlPx = CONTROL_PX[controlKindOf(spec)] ?? 50;
  // Das Feld is a canvas field at a fixed aspect with its own label layer; it scales by width only.
  if (spec.kind === "field") return { fits: true, ratio: null, controlPx };
  const width = VARIANT_WIDTH.compact;
  const box = stripInnerHeight() - controlPx;
  // Asked for a 1px box, the engine returns its smallest layout: every flexible part at its minimum.
  const smallest = renderFigure({ ...spec, id: `${spec.id}--strip` } as FigureSpec, 1, { width, theme: "web", bare: true, height: 1 });
  const { h } = viewBoxOf(smallest);
  // The SVG meets its box: the width scale, or less when the smallest layout is taller than the box.
  const scale = box > 0 ? Math.min(STRIP_PHONE.width / width, box / h) : 0;
  const font = smallestFont(smallest);
  const fits = box > 0 && (!Number.isFinite(font) || font * scale >= MIN_LABEL_PX);
  return { fits, ratio: Math.round((h / width) * 1000) / 1000, controlPx };
}
