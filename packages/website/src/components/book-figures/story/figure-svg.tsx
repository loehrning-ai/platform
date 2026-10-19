import { renderFigure, type FigureSpec } from "@/lib/figures";

/** viewBox width of the phone layout and of the wide layout. */
export const COMPACT_WIDTH = 360;
export const WIDE_WIDTH = 640;

interface FigureSvgProps {
  readonly spec: FigureSpec;
  readonly progress?: number;
  readonly highlight?: string;
  /** "pair" renders both layouts and lets a container query pick one, so nothing depends on JS or on measuring. */
  readonly layout?: "pair" | "compact" | "wide";
}

/**
 * The engine's SVG for a spec at a progress. Both layouts are server rendered;
 * CSS shows exactly one (see .bf-svg in story.css), so the reserved height is
 * right in the first paint and hydration never changes it. The second layout
 * gets an id suffix so the accessible name ids stay unique.
 */
export function FigureSvg({ spec, progress = 1, highlight, layout = "pair" }: FigureSvgProps) {
  if (layout === "compact") {
    return <div className="bf-svg bf-svg--solo">{renderFigure(spec, progress, { width: COMPACT_WIDTH, highlight })}</div>;
  }
  if (layout === "wide") {
    return <div className="bf-svg bf-svg--solo">{renderFigure(spec, progress, { width: WIDE_WIDTH, highlight })}</div>;
  }
  return (
    <>
      <div className="bf-svg bf-svg--wide">{renderFigure(spec, progress, { width: WIDE_WIDTH, highlight })}</div>
      <div className="bf-svg bf-svg--compact">{renderFigure({ ...spec, id: `${spec.id}-m` }, progress, { width: COMPACT_WIDTH, highlight })}</div>
    </>
  );
}
