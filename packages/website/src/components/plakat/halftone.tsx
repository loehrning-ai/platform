import { cx } from "@/components/werk/cx";

export type HalftoneField = "demos" | "blog";

/**
 * One alpha PNG per field (scripts/plakat/build-halftone.mjs), used as a CSS
 * mask over a block filled with the scene ink. Class strings stay literal so
 * Tailwind finds them.
 */
const FIELD_MASK: Readonly<Record<HalftoneField, string>> = {
  demos: "[mask-image:url(/plakat/halftone-demos.png)]",
  blog: "[mask-image:url(/plakat/halftone-blog.png)]",
};

export type HalftoneProps = {
  readonly field: HalftoneField;
  readonly className?: string;
};

/**
 * The IDEA poster's one-ink halftone "photo" (SPEC §3.12, decision D10):
 * demos, a spreadsheet window under a sky; blog, cumulus clouds in a sky.
 * One image instead of thousands of inline circles, and the ink comes from
 * the scene token (`bg-scene-ink`, Kobalt in IDEA), never greyscale.
 * Decorative and aria-hidden.
 */
export function Halftone({ field, className }: HalftoneProps) {
  return (
    <div
      aria-hidden="true"
      data-halftone={field}
      className={cx(
        "pointer-events-none h-44 w-full bg-scene-ink [mask-position:center] [mask-repeat:no-repeat] [mask-size:cover] sm:h-56 lg:h-72",
        FIELD_MASK[field],
        className,
      )}
    />
  );
}
