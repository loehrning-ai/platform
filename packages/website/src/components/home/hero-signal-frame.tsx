import {
  BERLIN_LAT,
  BERLIN_LON,
  berlinProjector,
  ll3d,
  PHONE_VIEW,
} from "@/components/home/hero-network-geometry";

/**
 * The phone hero's opening: one signal from Berlin.
 *
 * A ping leaves Berlin, ten flight arcs launch from it across the dome of
 * the line globe (west to Iceland and Greenland, north over the pole to
 * Alaska, east to Siberia, plus two short hops), a light runs along each
 * one, every arc lands on a node with a small ring, and after about five and a half seconds
 * the whole layer fades and hands the stage to the globe's tour, which is
 * still resting on Berlin at that point.
 *
 * The endpoints are the destinations projected with the globe's own Berlin
 * projector, in the phone window's coordinates (PHONE_VIEW, the same viewBox
 * and slice as the globe frame), so every node sits on its place on the
 * globe at every phone size. The arcs between them are drawn as flight
 * paths on the screen, bowed upward like a route map, which reads far
 * better at phone scale than a lifted great circle seen from above.
 *
 * Everything is computed on the server once. The browser receives a few
 * hundred bytes of paths and plays them with CSS only (phone-hero.css). It
 * plays once, and only when the phone globe would be allowed to move
 * (phone-globe.tsx sets data-home-intro="play"): never under reduced
 * motion, reduced data, Save-Data or a remembered pause, never from lg. Its
 * resting state is invisible, so the static globe stays the frame for
 * everyone else. Decorative: the slot around it is aria-hidden.
 */

type Destination = readonly [lat: number, lon: number];

/**
 * In launch order, fanning round the dome. All of them lie on the visible
 * face of the globe from Berlin; on a short phone screen the northernmost
 * ones leave the window at its top edge, and the arcs read as reaching past
 * the screen.
 */
const DESTINATIONS: readonly Destination[] = [
  [51.5, -0.13], // London, a short hop
  [64.15, -21.94], // Reykjavík
  [64.2, -51.7], // Nuuk
  [53.5, -113.5], // Edmonton
  [61.2, -149.9], // Anchorage, over the pole
  [78.2, 15.6], // Svalbard
  [62, 129.7], // Yakutsk
  [69.3, 88.2], // Norilsk
  [56.8, 60.6], // Yekaterinburg
  [55.75, 37.62], // Moscow
];

export type SignalArc = {
  /** A quadratic flight path from Berlin, in PHONE_VIEW units. */
  readonly d: string;
  /** Where the arc lands on screen (its node). */
  readonly end: readonly [number, number];
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** A point on the globe, on screen, with its depth (z > 0: facing us). */
function project(lat: number, lon: number) {
  return berlinProjector(ll3d(lat, lon));
}

/** Berlin on screen: the arcs' common origin. */
export function signalOrigin(): readonly [number, number] {
  const p = project(BERLIN_LAT, BERLIN_LON);
  return [round1(p.sx), round1(p.sy)];
}

/** How far each arc bows, as a share of its length. */
const BOW = 0.24;

/**
 * One flight arc per destination: Berlin to the destination's place on the
 * globe, its control point pushed off the chord by BOW of its length, always
 * to the upper side, so the fan opens like a route map over the dome.
 */
export function signalArcs(): readonly SignalArc[] {
  const [ox, oy] = signalOrigin();
  return DESTINATIONS.map(([lat, lon], index) => {
    const p = project(lat, lon);
    const ex = round1(p.sx);
    const ey = round1(p.sy);
    const dx = ex - ox;
    const dy = ey - oy;
    const length = Math.hypot(dx, dy) || 1;
    let nx = -dy / length;
    let ny = dx / length;
    // Bow upward; an arc that runs straight up alternates its side.
    if (ny > 0.05 || (Math.abs(ny) <= 0.05 && index % 2 === 1)) {
      nx = -nx;
      ny = -ny;
    }
    const cx = round1((ox + ex) / 2 + nx * length * BOW);
    const cy = round1((oy + ey) / 2 + ny * length * BOW);
    return { d: `M${ox},${oy}Q${cx},${cy} ${ex},${ey}`, end: [ex, ey] };
  });
}

export function HeroSignalFrame() {
  const arcs = signalArcs();
  const [ox, oy] = signalOrigin();
  return (
    <svg
      data-home-signals=""
      viewBox={`${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* The ping: two rings leave Berlin before the arcs do. */}
      <circle className="sig-ring" cx={ox} cy={oy} r={26} />
      <circle className="sig-ring sig-ring-late" cx={ox} cy={oy} r={26} />
      {arcs.map((arc, index) => (
        <g
          key={arc.d}
          className="sig-arc"
          style={{ ["--sig-i" as string]: index }}
        >
          <path className="sig-line" d={arc.d} pathLength={1} />
          <path className="sig-comet" d={arc.d} pathLength={1} />
          <circle
            className="sig-land"
            cx={arc.end[0]}
            cy={arc.end[1]}
            r={10}
          />
          <circle
            className="sig-node"
            cx={arc.end[0]}
            cy={arc.end[1]}
            r={7}
          />
        </g>
      ))}
      <circle className="sig-origin" cx={ox} cy={oy} r={9} />
    </svg>
  );
}
