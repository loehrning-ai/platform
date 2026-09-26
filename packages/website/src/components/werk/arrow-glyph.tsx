import { cx } from "./cx";

export type ArrowDirection = "right" | "external" | "down";

const PATHS: Record<ArrowDirection, string> = {
  right: "M3 10h13M11 5l5 5-5 5",
  external: "M5 15L15 5M7 5h8v8",
  down: "M10 3v13M5 11l5 5 5-5",
};

/**
 * Action arrow with square caps and miter joins, matching the pictograms.
 * `right` navigates, `external` opens a new window, `down` downloads.
 * The right arrow nudges 3px on group hover via `.arrow-nudge`.
 */
export function ArrowGlyph({
  direction = "right",
  className,
}: {
  readonly direction?: ArrowDirection;
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      data-arrow={direction}
      className={cx(
        "size-4 shrink-0",
        direction === "right" && "arrow-nudge",
        className,
      )}
    >
      <path d={PATHS[direction]} />
    </svg>
  );
}
