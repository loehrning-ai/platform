import { PLAKAT, type PlakatKey } from "./palettes.ts";
import {
  POSTER_CANVAS,
  posterComposition,
  type PosterCompositionOptions,
  type PosterNode,
  type ShapeRole,
} from "./motifs.ts";

/**
 * The poster as a standalone SVG string, for the static generators (social
 * cards, deck covers) and OG images. It draws the same composition as the
 * React poster (components/plakat/poster-art.tsx) but maps each role to its
 * hex value from PLAKAT, since a file has no `.plakat-*` scope around it.
 */

export interface PosterSvgOptions extends PosterCompositionOptions {
  /** Output size attributes. Default: the canvas size (the strip: 400 x 128). */
  readonly width?: number;
  readonly height?: number;
  /** Numeral font stack; the file must embed or have access to Figtree. */
  readonly fontFamily?: string;
  /**
   * Add xmlns (default true). Leave it on for files and data URIs; inline
   * markup inside HTML does not need it.
   */
  readonly standalone?: boolean;
}

export const POSTER_FONT_FAMILY = "'Figtree', Arial, sans-serif";

/** The hex value of each shape role in a scene. */
export function roleHex(plakat: PlakatKey): Readonly<Record<ShapeRole, string>> {
  const { ground, ink, mid } = PLAKAT[plakat];
  return { ground, ink, mid };
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderNode(node: PosterNode, plakat: PlakatKey, fontFamily: string): string {
  const hex = roleHex(plakat);
  switch (node.kind) {
    case "shapes":
      return node.shapes
        .map(
          (shape) =>
            `<path d="${shape.d}" fill="${hex[shape.role]}"${shape.transform ? ` transform="${shape.transform}"` : ""}/>`,
        )
        .join("");
    case "viewport": {
      const { x, y, width, height, viewBox, preserveAspectRatio, overflowVisible } = node.viewport;
      const children = node.children.map((child) => renderNode(child, plakat, fontFamily)).join("");
      return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="${preserveAspectRatio}"${overflowVisible ? ' overflow="visible"' : ""}>${children}</svg>`;
    }
    case "numeral": {
      const { x, y, fontSize, letterSpacing, fontWeight, role, keyline } = node.layout;
      return (
        `<text x="${x}" y="${y}" font-family="${escapeAttribute(fontFamily)}" font-weight="${fontWeight}" ` +
        `font-size="${fontSize}" letter-spacing="${letterSpacing}" fill="${hex[role]}" ` +
        `stroke="${hex.ground}" stroke-width="${keyline}" stroke-linejoin="round" paint-order="stroke fill">` +
        `${escapeText(node.text)}</text>`
      );
    }
  }
}

/** The poster as SVG markup, `aria-hidden` (a decorative image; its page names it). */
export function posterSvg({
  width,
  height,
  fontFamily = POSTER_FONT_FAMILY,
  standalone = true,
  ...options
}: PosterSvgOptions): string {
  const composition = posterComposition(options);
  const canvas = POSTER_CANVAS[composition.format];
  const outWidth = width ?? canvas.width;
  const outHeight = height ?? canvas.height;
  const body = composition.children.map((node) => renderNode(node, options.plakat, fontFamily)).join("");
  const attributes = [
    standalone ? 'xmlns="http://www.w3.org/2000/svg"' : "",
    composition.viewBox ? `viewBox="${composition.viewBox}"` : "",
    `width="${outWidth}"`,
    `height="${outHeight}"`,
    composition.preserveAspectRatio ? `preserveAspectRatio="${composition.preserveAspectRatio}"` : "",
    'aria-hidden="true"',
    'focusable="false"',
    `data-poster="${options.plakat}"`,
  ]
    .filter(Boolean)
    .join(" ");
  return `<svg ${attributes}>${body}</svg>`;
}

/** The poster as a `data:` URI, e.g. for an <img> inside an OG ImageResponse. */
export function posterSvgDataUri(options: PosterSvgOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(posterSvg({ ...options, standalone: true }))}`;
}
