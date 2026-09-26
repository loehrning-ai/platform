import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The Werkzeichnung type tokens (`text-label`, `text-caption`, ...) are custom
 * font sizes. Stock tailwind-merge does not know them and files them under
 * text colour, so `cn("text-label text-muted-foreground")` would silently drop
 * the size. This merger registers them as font sizes.
 */
export const WERK_FONT_SIZES = [
  "display",
  "fluid-h1",
  "fluid-h2",
  "fluid-h3",
  "lead",
  "body",
  "label",
  "caption",
  "num-lg",
] as const;

const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...WERK_FONT_SIZES] }],
    },
  },
});

/** clsx plus a tailwind-merge that understands the Werkzeichnung type scale. */
export function cx(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
