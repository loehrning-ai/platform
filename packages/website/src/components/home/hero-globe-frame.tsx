import {
  CX,
  CY,
  KUPFER,
  LC,
  PHONE_VIEW,
  phoneComposition,
  R,
  WARM,
} from "@/components/home/hero-network-geometry";

/** The same thickening as the live phone globe (hero-network.tsx). */
const STROKE = 2.4;
const ID = "hf";

/** Two decimals: invisible at phone scale, a third of the bytes of three. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The phone hero's globe at first paint, drawn on the server: the thin ink
 * graticule and the Kupfer outlines of the paper hero, centred on Berlin,
 * inside the phone window (PHONE_VIEW) only.
 *
 * It is the globe for everyone below lg until the live globe takes over
 * (phone-globe.tsx), and the whole globe for reduced motion, reduced data
 * and Save-Data, who download nothing more. It uses the live globe's
 * geometry, framing and paint, so the takeover changes nothing but the
 * motion. Decorative: the slot around it is aria-hidden.
 */
export function HeroGlobeFrame() {
  const frame = phoneComposition();
  return (
    <svg
      data-home-globe-ssr=""
      viewBox={`${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${ID}-volume`} cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor={WARM} stopOpacity="0.012" />
          <stop offset="58%" stopColor={WARM} stopOpacity="0.02" />
          <stop offset="84%" stopColor={WARM} stopOpacity="0.055" />
          <stop offset="100%" stopColor={WARM} stopOpacity="0.11" />
        </radialGradient>
        <pattern
          id={`${ID}-hatch`}
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45) scale(2)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={KUPFER} strokeWidth="0.85" />
        </pattern>
      </defs>
      <circle cx={CX} cy={CY} r={R} fill={`url(#${ID}-volume)`} />
      <circle
        cx={CX}
        cy={CY}
        r={R + 1}
        stroke={WARM}
        strokeOpacity={0.12}
        strokeWidth={3.6}
      />
      {/* Shared paint sits on the groups, so each path carries only its
          geometry and its depth: the frame is paid for twice in the page
          (the HTML and the RSC payload). */}
      <g stroke={LC} strokeLinecap="round" strokeLinejoin="round">
        {frame.grid.front.map((s, i) => (
          <path
            key={`g${i}`}
            d={s.d}
            strokeOpacity={round2(0.06 + s.dp * 0.16)}
            strokeWidth={round2((0.45 + s.dp * 0.4) * STROKE)}
          />
        ))}
      </g>
      <g fill={`url(#${ID}-hatch)`} fillOpacity={0.1}>
        {frame.countryFill.map((s, i) => (
          <path key={`f${i}`} d={s.d} />
        ))}
      </g>
      <g stroke={KUPFER} strokeWidth={2 * STROKE} strokeLinecap="round" strokeLinejoin="round">
        {frame.country.map((s, i) => (
          <path
            key={`c${i}`}
            d={s.d}
            strokeOpacity={round2(0.13 + s.dp * 0.05)}
          />
        ))}
      </g>
      <circle
        cx={CX}
        cy={CY}
        r={R}
        stroke={LC}
        strokeOpacity={0.04}
        strokeWidth={0.3}
      />
    </svg>
  );
}
