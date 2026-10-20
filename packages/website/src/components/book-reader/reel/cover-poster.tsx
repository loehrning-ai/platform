import { fieldPaths, VIEW_HEIGHT, VIEW_WIDTH } from "../explorer/field-geometry";
import type { FieldCounts } from "@/lib/explorer/model";

/**
 * The settled cover: the book's 1.000 squares as three batched SVG paths, with
 * the squares of the headline share in Mennige (whole squares plus one partial
 * square, never rounded up) and the rest in Leinen. It is the poster frame of
 * the reel (first paint, LCP), the reduced-motion and no-script cover, and the
 * print cover. Server markup only.
 */

export function CoverPoster({
  share,
  label,
}: {
  /** The headline share as a fraction of the base, for example 0.038. */
  readonly share: number;
  readonly label: string;
}) {
  const scaled = Math.max(0, Math.min(1, share)) * 1000;
  const solid = Math.floor(scaled + 1e-9);
  const partial = scaled - solid < 1e-6 ? 0 : scaled - solid;
  const counts: FieldCounts = { solid, partial, bandFrom: 0, bandTo: 0 };
  const paths = fieldPaths(counts);
  return (
    <svg
      className="cr-field"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMinYMax slice"
      data-cover-squares={solid}
    >
      <path className="cr-sq cr-sq--rest" d={paths.rest} />
      <path className="cr-sq cr-sq--solid" d={paths.solid} />
      <path className="cr-sq cr-sq--solid" d={paths.partial} />
    </svg>
  );
}
