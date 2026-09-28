import type { JSX } from "react";
import { PosterArt, ROLE_FILL_CLASS } from "@/components/plakat";
import { cx } from "@/components/werk/cx";
import { posterComposition } from "@/lib/plakat/motifs";
import { plakatClass, type CoursePlakat } from "@/lib/plakat/palettes";
import { clipPosterComposition } from "./poster-clip";

/**
 * The course band's poster: the shared poster drawing (PosterArt, SPEC
 * §3.5) with every shape cut to the canvas as geometry (./poster-clip.ts).
 * PosterArt lets its shapes run past the canvas and lets the SVG viewport
 * hide the rest; on a full-bleed band that left path boxes up to 2000 units
 * past the page edge, and the page geometry checks read those boxes. Here
 * nothing leaves the viewBox and the picture is the same: the parts the
 * viewport hid are gone, and the root keeps PosterArt's scene class, whose
 * background is the ground colour for any letterbox.
 *
 * Root attributes, shape classes and the numeral are PosterArt's own:
 * course-poster-art.test.tsx holds the root and the numeral to PosterArt's
 * markup, and poster-clip.test.ts compares the two pictures point by point.
 * A composition the clipper does not handle falls back to PosterArt.
 */
export function CoursePosterArt({
  scene,
  format,
}: {
  readonly scene: CoursePlakat;
  readonly format: "portrait" | "landscape";
}): JSX.Element {
  const { plakat, motif, numeral } = scene;
  const composition = posterComposition({ plakat, motif, numeral, format, cornerDots: false });
  const items = clipPosterComposition(composition);
  if (!items) {
    return (
      <PosterArt plakat={plakat} motif={motif} numeral={numeral} format={format} cornerDots={false} />
    );
  }
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-poster={plakat}
      data-poster-motif={motif}
      data-poster-format={format}
      viewBox={composition.viewBox ?? undefined}
      preserveAspectRatio={composition.preserveAspectRatio ?? undefined}
      className={cx(plakatClass(plakat), "block size-full overflow-hidden")}
    >
      {items.map((item, index) => {
        if (item.kind === "shape") {
          // Shapes never reorder; the index is their paint order.
          return <path key={index} d={item.d} className={ROLE_FILL_CLASS[item.role]} />;
        }
        const { x, y, fontSize, letterSpacing, fontWeight, role, keyline } = item.layout;
        // The keyline is a ground-coloured stroke under the fill, as on
        // PosterArt: where the numeral crosses a shape it keeps a gap.
        return (
          <text
            key={index}
            data-poster-numeral-text=""
            x={x}
            y={y}
            fontSize={fontSize}
            fontWeight={fontWeight}
            letterSpacing={letterSpacing}
            strokeWidth={keyline}
            strokeLinejoin="round"
            paintOrder="stroke fill"
            className={cx(ROLE_FILL_CLASS[role], "stroke-scene-ground font-sans normal-nums")}
          >
            {item.text}
          </text>
        );
      })}
    </svg>
  );
}
