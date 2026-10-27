import type { CSSProperties, ReactNode } from "react";

/**
 * Gives an SVG picture the room that is left in the stage and no more: the
 * box keeps the picture's aspect ratio, grows up to 36rem wide and shrinks
 * on a short phone instead of pushing the rest of the scene out of view, so
 * nothing scrolls under the dock. Readouts positioned inside it line up with
 * the picture, because the box is exactly as big as the drawing.
 */
export function FitBox({ ratio, min, children, className }: { readonly ratio: number; readonly min?: number; readonly children: ReactNode; readonly className?: string }) {
  const style = { "--w02-ratio": ratio, ...(min === undefined ? {} : { "--w02-fit-min": `${min}px` }) } as CSSProperties;
  return (
    <div className={className ? `w02-fit ${className}` : "w02-fit"} style={style}>
      <div className="w02-fit-box">{children}</div>
    </div>
  );
}
