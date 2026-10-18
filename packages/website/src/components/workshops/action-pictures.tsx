import type { CSSProperties, ReactNode } from "react";

/**
 * The pictures of the four action cards (action-cards.css gives them their
 * idle loop and their stronger hover loop). All decorative: the card's link
 * names the action, so every picture is aria-hidden.
 *
 * - slides: three portrait frames fanned out; the top one shows the
 *   workshop's own poster cover on a paper-coloured mini slide with a
 *   progress bar.
 * - kit: a zip box, four file chips (sheet, table, folded sheet, key)
 *   dropping in, a download arrow under it.
 * - lab: a browser window, a slider knob and a forecast line that draws.
 * - case: a paper sheet, three bars rising and a marker dot.
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

function KitPicture(): ReactNode {
  return (
    <Svg>
      <Dust points={[[60, 36], [200, 30], [52, 118], [208, 110]]} />
      <rect x="80" y="60" width="96" height="14" className="ac-flap" />
      <g className="ac-chips">
        <g className="ac-chip" style={CHIP_STYLE(0)}>
          <rect x="90" y="48" width="18" height="28" className="ac-shape" />
          <path d="M94 56H104M94 62H104M94 68H100" className="ac-hair" />
        </g>
        <g className="ac-chip" style={CHIP_STYLE(1)}>
          <rect x="112" y="48" width="18" height="28" className="ac-shape" />
          <path d="M112 57H130M112 66H130M121 48V76" className="ac-hair" />
        </g>
        <g className="ac-chip" style={CHIP_STYLE(2)}>
          <path d="M134 48H146L152 54V76H134Z" className="ac-shape" />
          <path d="M146 48V54H152" className="ac-hair" />
        </g>
        <g className="ac-chip" style={CHIP_STYLE(3)}>
          <rect x="156" y="48" width="18" height="28" className="ac-shape" />
          <circle cx="165" cy="58" r="5" className="ac-dot" />
          <path d="M165 63V72M165 68H169M165 72H169" className="ac-hair" />
        </g>
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
      <path d="M72 122H184" className="ac-hair ac-track" />
      <circle cx="128" cy="122" r="6.5" className="ac-knob" />
    </Svg>
  );
}

function CasePicture(): ReactNode {
  return (
    <Svg>
      <Dust points={[[58, 34], [204, 40], [50, 120], [210, 126]]} />
      <rect x="72" y="12" width="112" height="136" className="ac-shape" />
      <path d="M86 28H130" className="ac-line" />
      <path d="M86 38H170M86 44H156" className="ac-hair" />
      <rect x="90" y="86" width="20" height="34" className="ac-bar ac-bar-fg" style={CHIP_STYLE(0)} />
      <rect x="118" y="62" width="20" height="58" className="ac-bar ac-bar-mid" style={CHIP_STYLE(1)} />
      <rect x="146" y="76" width="20" height="44" className="ac-bar ac-bar-fg" style={CHIP_STYLE(2)} />
      <path d="M84 120H172" className="ac-line" />
      <circle cx="128" cy="50" r="5" className="ac-marker" />
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
      {kind === "kit" ? <KitPicture /> : null}
      {kind === "lab" ? <LabPicture /> : null}
      {kind === "case" ? <CasePicture /> : null}
    </div>
  );
}
