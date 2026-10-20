/**
 * Static SVG output for the PDF and for tests. Kept out of index.ts so client
 * bundles never import react-dom/server.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { renderFigure } from "./render.ts";
import type { FigureSpec, RenderOptions } from "./types.ts";

export const PRINT_OPTIONS: RenderOptions = {
  width: 640,
  theme: "print",
  intrinsic: true,
};

/** The figure at a progress as an SVG string, without an XML prolog. */
export function renderFigureMarkup(
  spec: FigureSpec,
  progress = 1,
  options: RenderOptions = {},
): string {
  return renderToStaticMarkup(renderFigure(spec, progress, options));
}

/** A standalone SVG file body at progress 1 with literal colours. */
export function renderStandaloneSvg(
  spec: FigureSpec,
  options: RenderOptions = {},
): string {
  const body = renderFigureMarkup(spec, 1, { ...PRINT_OPTIONS, ...options });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`;
}
