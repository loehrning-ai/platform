import type { CSSProperties, ReactNode } from "react";

/**
 * The pictures of the four action cards (action-cards.css gives them their
 * idle loop and their stronger hover loop). All decorative: the card's link
 * names the action, so every picture is aria-hidden.
 *
 * - slides: three portrait frames fanned out; the top one shows the
 *   workshop's own poster cover on a paper-coloured mini slide with a
 *   progress bar.
 * - kit: a zip box, four file chips dropping in, a download arrow under it.
 *   The box, the lid and the arrow are shared; the four chips are the
 *   workshop's own (a dashboard tile, a five-field grid, a question sheet
 *   and a leaf, a traffic light), so no two kit cards look alike.
 * - lab: a browser window, a slider knob and a forecast line that draws, with
 *   a lead dot that rides its tip.
 * - case: a paper sheet, three bars rising and a marker dot. Lab window and
 *   case sheet are the same 144 units wide, so both thumbnails share their
 *   left and right edge.
 *
 * The SVG pictures share one viewBox of 256 x 160 (16:10) and slice into a
 * square on phones: everything that matters sits in the central 160 x 160.
 * Colours come from the card (`--ac-fg`, `--ac-bg`, `--ac-mid`), so the same
 * drawing works on the plain card and on the inverted one.
 */

export type ActionPictureKind = "slides" | "kit" | "lab" | "case";

function Svg({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 256 160"
      preserveAspectRatio="xMidYMid slice"
      className="ac-svg"
    >
      {children}
    </svg>
  );
}

function Dust({ points }: { readonly points: readonly (readonly [number, number])[] }): ReactNode {
  return (
    <g className="ac-dust">
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} />
      ))}
    </g>
  );
}

function SlidesPicture({ slug }: { readonly slug: string }): ReactNode {
  return (
    <div className="ac-pic-inner ac-slides">
      <span className="ac-frame ac-frame-l" />
      <span className="ac-frame ac-frame-r" />
      <span className="ac-frame ac-frame-top">
        {/* A poster cover of the workshop itself, so the picture is never generic. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/workshops/${slug}/assets/plakat-cover.svg`}
          alt=""
          width={400}
          height={500}
          loading="lazy"
          decoding="async"
          className="ac-cover"
        />
        <span className="ac-progress">
          <span className="ac-progress-bar" />
        </span>
      </span>
    </div>
  );
}

const CHIP_STYLE = (index: number): CSSProperties =>
  ({ "--ac-i": index }) as CSSProperties;

/** The four chip slots of the kit box, left to right (each chip is 18 x 28). */
const CHIP_X = [90, 112, 134, 156] as const;

/*
 * Chip faces, drawn at x 0 and y 48, 18 x 28. The slot moves them with a
 * `translate` attribute on the wrapper, so every face works in every slot.
 */
const FACES = {
  sheet: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <path d="M4 56H14M4 62H14M4 68H10" className="ac-hair" />
    </>
  ),
  table: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <path d="M0 57H18M0 66H18M9 48V76" className="ac-hair" />
    </>
  ),
  folded: (
    <>
      <path d="M0 48H12L18 54V76H0Z" className="ac-shape" />
      <path d="M12 48V54H18" className="ac-hair" />
    </>
  ),
  key: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <circle cx="9" cy="58" r="5" className="ac-dot" />
      <path d="M9 63V72M9 68H13M9 72H13" className="ac-hair" />
    </>
  ),
  /** A dashboard tile: three bars and a dot (Workshop 02). */
  tile: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <circle cx="9" cy="56" r="2.6" className="ac-dot" />
      <path d="M4 72V66M9 72V62M14 72V65" className="ac-line" />
    </>
  ),
  /** Five fields: a header cell and a two by two grid (Workshop 03). */
  fields: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <rect x="2" y="50" width="14" height="5" className="ac-tab" />
      <path d="M0 59H18M0 68H18M9 59V76" className="ac-hair" />
    </>
  ),
  /** A question sheet with a tick box (Workshop 04). */
  question: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <path d="M4 56H14M4 61H14" className="ac-hair" />
      <rect x="4" y="66" width="7" height="7" className="ac-hair" />
      <path d="M5 70L7.5 72.5L13 65" className="ac-line" />
    </>
  ),
  /** An oak leaf on a sheet (Workshop 04). */
  leaf: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <path d="M9 72C2 66 3 57 9 52C15 57 16 66 9 72Z" className="ac-dot" />
      <path d="M9 72V58" className="ac-hair" />
    </>
  ),
  /** A traffic light: green, yellow, red (Workshop 05). */
  light: (
    <>
      <rect x="0" y="48" width="18" height="28" className="ac-shape" />
      <circle cx="9" cy="56" r="3.2" className="ac-dot-fg" />
      <circle cx="9" cy="62" r="3.2" className="ac-dot" />
      <circle cx="9" cy="68" r="3.2" className="ac-hair" />
    </>
  ),
} as const;

type Face = keyof typeof FACES;

/** The workshop's own four chips. A slug without a set gets the generic one. */
const KIT_FACES: Readonly<Record<string, readonly [Face, Face, Face, Face]>> = {
  "geschaeftsberichte-mit-ki-lesen": ["sheet", "tile", "table", "key"],
  "datenbereitschaft-fuer-ki": ["sheet", "fields", "table", "key"],
  "esg-berichte-mit-ki": ["question", "leaf", "table", "key"],
  "audit-vorbereitung-mit-ki": ["light", "sheet", "question", "key"],
};

const GENERIC_FACES = ["sheet", "table", "folded", "key"] as const;

function KitPicture({ slug }: { readonly slug: string }): ReactNode {
  const faces = Object.hasOwn(KIT_FACES, slug) ? KIT_FACES[slug] : GENERIC_FACES;
  return (
    <Svg>
      <Dust points={[[60, 36], [200, 30], [52, 118], [208, 110]]} />
      {/* The lid is a rim as wide as the box, so no stub of it ever peeks out
          beside the chips and reads as a half-hidden chip. */}
      <rect x="76" y="66" width="104" height="8" className="ac-flap" />
      <g className="ac-chips">
        {faces.map((face, index) => (
          <g key={CHIP_X[index]} transform={`translate(${CHIP_X[index]} 0)`}>
            <g className="ac-chip" style={CHIP_STYLE(index)}>
              {FACES[face]}
            </g>
          </g>
        ))}
      </g>
      <rect x="76" y="74" width="104" height="52" className="ac-shape ac-box" />
      <path d="M128 74V126" className="ac-teeth" />
      <rect x="122" y="88" width="12" height="16" className="ac-tab" />
      <g className="ac-arrow-hover">
        <path d="M128 132V148M120 140L128 148L136 140" className="ac-arrow" />
      </g>
    </Svg>
  );
}

function LabPicture(): ReactNode {
  return (
    <Svg>
      <Dust points={[[56, 30], [204, 34], [48, 128], [210, 122]]} />
      <rect x="56" y="18" width="144" height="116" className="ac-shape" />
      <path d="M56 36H200" className="ac-hair" />
      <circle cx="66" cy="27" r="2.5" className="ac-dot-fg" />
      <circle cx="75" cy="27" r="2.5" className="ac-dot-fg" />
      <circle cx="84" cy="27" r="2.5" className="ac-dot-fg" />
      <path d="M72 108H184" className="ac-hair" />
      <path d="M72 96L92 88L108 92L124 80" className="ac-line" />
      <path d="M124 80L142 66L162 58L184 46" pathLength={1} className="ac-forecast" />
      <circle cx="184" cy="46" r="4.5" className="ac-lead" />
      <path d="M72 122H184" className="ac-hair ac-track" />
      <circle cx="128" cy="122" r="6.5" className="ac-knob" />
    </Svg>
  );
}

function CasePicture(): ReactNode {
  return (
    <Svg>
      <Dust points={[[58, 34], [204, 40], [50, 120], [210, 126]]} />
      <rect x="56" y="18" width="144" height="116" className="ac-shape" />
      <path d="M72 34H116" className="ac-line" />
      <path d="M72 44H184M72 50H170" className="ac-hair" />
      <rect x="84" y="88" width="24" height="30" className="ac-bar ac-bar-fg" style={CHIP_STYLE(0)} />
      <rect x="116" y="66" width="24" height="52" className="ac-bar ac-bar-mid" style={CHIP_STYLE(1)} />
      <rect x="148" y="78" width="24" height="40" className="ac-bar ac-bar-fg" style={CHIP_STYLE(2)} />
      <path d="M72 118H184" className="ac-line" />
      <circle cx="128" cy="56" r="5" className="ac-marker" />
    </Svg>
  );
}

export function ActionPicture({
  kind,
  slug,
}: {
  readonly kind: ActionPictureKind;
  readonly slug: string;
}): ReactNode {
  return (
    <div aria-hidden="true" className={`ac-pic ac-pic-${kind}`}>
      {kind === "slides" ? <SlidesPicture slug={slug} /> : null}
      {kind === "kit" ? <KitPicture slug={slug} /> : null}
      {kind === "lab" ? <LabPicture /> : null}
      {kind === "case" ? <CasePicture /> : null}
    </div>
  );
}
