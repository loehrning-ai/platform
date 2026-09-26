import type { ReactNode } from "react";
import { cx } from "./cx";

/*
 * Square line pictograms from the Workshop 03 deck sprite
 * (public/workshops/datenbereitschaft-fuer-ki/slides.html, <symbol id="i-*">).
 * Path data is copied verbatim so the web and the deck share one glyph family:
 * 100-unit viewBox, square caps, miter joins, filled square details.
 *
 * Glyphs marked "web" have no deck symbol and are drawn in the same grammar.
 */

const FILL = (children: ReactNode) => (
  <g fill="currentColor" stroke="none">
    {children}
  </g>
);

const GLYPHS = {
  /** deck i-question */
  question: (
    <>
      <path d="M8 12h84v60H46L28 90V72H8z" />
      <path d="M38 24h24v14H50v8" />
      {FILL(<rect x="46" y="54" width="8" height="8" />)}
    </>
  ),
  /** deck i-app: the deck or a presentation */
  deck: (
    <>
      <rect x="8" y="12" width="84" height="76" />
      <path d="M8 30h84M20 72h36" />
      <rect x="20" y="42" width="46" height="16" />
      {FILL(<rect x="68" y="40" width="14" height="20" />)}
    </>
  ),
  /** deck i-canvas: a worksheet or template */
  canvas: (
    <>
      <rect x="12" y="8" width="76" height="84" />
      <path d="M24 22h32" />
      <rect x="24" y="34" width="20" height="16" />
      <rect x="56" y="34" width="20" height="16" />
      <rect x="24" y="62" width="20" height="16" />
      <rect x="56" y="62" width="20" height="16" />
    </>
  ),
  /** deck i-book: guide or companion */
  guide: (
    <>
      <rect x="16" y="8" width="68" height="72" />
      <path d="M28 8v72M16 80v12h68V80M40 46h24" />
      {FILL(<rect x="40" y="22" width="32" height="12" />)}
    </>
  ),
  /** web: play, for an interactive demo */
  demo: (
    <>
      <rect x="10" y="10" width="80" height="80" />
      {FILL(<path d="M38 30l32 20-32 20z" />)}
    </>
  ),
  /** web: download, for a kit or archive */
  download: (
    <>
      <path d="M50 10v50M30 42l20 20 20-20M10 70v20h80V70" />
      {FILL(<rect x="44" y="76" width="12" height="8" />)}
    </>
  ),
  /** deck i-export */
  export: (
    <>
      <rect x="8" y="20" width="54" height="60" />
      <path d="M8 40h54M8 60h54M26 40v40M44 40v40M72 50h14M78 38l12 12-12 12" />
    </>
  ),
  /** deck i-checklist: field card or checklist */
  checklist: (
    <>
      <rect x="14" y="14" width="72" height="78" />
      <path d="M26 44l8 8 14-14M56 46h18M26 72l8 8 14-14M56 74h18" />
      {FILL(<rect x="34" y="8" width="32" height="12" />)}
    </>
  ),
  /** deck i-table: data or CSV */
  table: (
    <>
      <rect x="8" y="14" width="84" height="72" />
      <path d="M8 38h84M8 62h84M36 38v48M64 38v48" />
    </>
  ),
  /** deck i-clock */
  clock: (
    <>
      <circle cx="50" cy="56" r="34" />
      <path d="M50 36v20h16M40 10h20M50 10v12" />
    </>
  ),
  /** deck i-chart */
  chart: (
    <>
      <path d="M12 10v78h78M26 70l16-16 12 12 26-26" />
      {FILL(<rect x="74" y="34" width="12" height="12" />)}
    </>
  ),
  /** deck i-database */
  database: (
    <>
      <path d="M16 22a34 10 0 0 0 68 0a34 10 0 0 0-68 0z" />
      <path d="M16 22v56a34 10 0 0 0 68 0V22M16 50a34 10 0 0 0 68 0" />
    </>
  ),
  /** deck i-calendar */
  calendar: (
    <>
      <path d="M10 32v58h80V32M30 8v10M70 8v10" />
      <rect x="20" y="52" width="12" height="12" />
      <rect x="44" y="52" width="12" height="12" />
      <rect x="68" y="52" width="12" height="12" />
      {FILL(<rect x="8" y="16" width="84" height="16" />)}
    </>
  ),
  /** deck i-person */
  person: (
    <>
      <circle cx="50" cy="28" r="16" />
      <path d="M18 92V72l16-16h32l16 16v20" />
    </>
  ),
  /** deck i-pass: always with a word */
  pass: (
    <>
      <rect x="10" y="10" width="80" height="80" />
      <path d="M28 50l14 14 30-30" />
    </>
  ),
  /** deck i-fail */
  fail: (
    <>
      <rect x="10" y="10" width="80" height="80" />
      <path d="M32 32l36 36M68 32L32 68" />
    </>
  ),
  /** deck i-gap: known gap, not approved */
  gap: (
    <>
      <path d="M10 26V10h16M42 10h16M74 10h16v16M90 42v16M10 42v16M10 74v16h16M42 90h16" />
      {FILL(<rect x="72" y="72" width="20" height="20" />)}
    </>
  ),
  /** deck i-shield: privacy and access boundaries */
  shield: (
    <>
      <path d="M16 10h68v48L50 92 16 58z" />
      {FILL(<rect x="40" y="34" width="20" height="20" />)}
    </>
  ),
} as const satisfies Record<string, ReactNode>;

export type PictogramName = keyof typeof GLYPHS;

export const PICTOGRAM_NAMES = Object.keys(GLYPHS) as readonly PictogramName[];

export type PictogramProps = {
  readonly name: PictogramName;
  readonly className?: string;
  /**
   * Stroke width in CSS pixels (the stroke does not scale with the icon).
   * The deck rule: 2 at 32px and above, 1.5 at 16 to 24px.
   */
  readonly strokeWidth?: number;
  /** Accessible name. Without it the pictogram is decorative and hidden. */
  readonly title?: string;
};

/** One deck pictogram, drawn in currentColor. */
export function Pictogram({
  name,
  className,
  strokeWidth = 1.5,
  title,
}: PictogramProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeMiterlimit={4}
      className={cx("size-5 shrink-0 [&_*]:[vector-effect:non-scaling-stroke]", className)}
      data-pictogram={name}
      focusable="false"
      {...(title
        ? { role: "img", "aria-label": title }
        : { "aria-hidden": true })}
    >
      {GLYPHS[name]}
    </svg>
  );
}
