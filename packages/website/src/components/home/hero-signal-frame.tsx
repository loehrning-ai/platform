import {
  BERLIN_LAT,
  BERLIN_LON,
  berlinProjector,
  ll3d,
  PHONE_VIEW,
} from "@/components/home/hero-network-geometry";
import { svgElement } from "@/components/home/static-svg";

/**
 * A quiet network over the phone globe: persistent surface connections and
 * stationary nodes that breathe together. No travelling heads or arrival
 * effects. The layer fades into the globe tour after the existing intro.
 *
 * Geometry is server-rendered; CSS runs once only when phone-globe.tsx allows
 * motion. Reduced motion/data, Save-Data and pause keep the static globe.
 */

type Destination = readonly [lat: number, lon: number];

/** Network peers on the visible hemisphere, projected with the globe. */
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
  /** A great-circle connection on the globe surface, in PHONE_VIEW units. */
  readonly d: string;
  /** The peer node on screen. */
  readonly end: readonly [number, number];
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** A point on the globe, on screen, with its depth (z > 0: facing us). */
function project(lat: number, lon: number) {
  return berlinProjector(ll3d(lat, lon));
}

/** Berlin on screen: the network hub. */
export function signalOrigin(): readonly [number, number] {
  const p = project(BERLIN_LAT, BERLIN_LON);
  return [round1(p.sx), round1(p.sy)];
}

/** Surface links follow the sphere instead of rising above it like trajectories. */
export function signalArcs(): readonly SignalArc[] {
  const start = ll3d(BERLIN_LAT, BERLIN_LON);
  return DESTINATIONS.map(([lat, lon]) => {
    const end = ll3d(lat, lon);
    // Normalized interpolation traces the shorter great-circle arc. All
    // peers are on the visible hemisphere, so no horizon clipping is needed.
    const points = Array.from({ length: 25 }, (_, i) => {
      const t = i / 24;
      const x = start[0] * (1 - t) + end[0] * t;
      const y = start[1] * (1 - t) + end[1] * t;
      const z = start[2] * (1 - t) + end[2] * t;
      const length = Math.hypot(x, y, z);
      const p = berlinProjector([x / length, y / length, z / length]);
      return [round1(p.sx), round1(p.sy)] as const;
    });
    return {
      d: points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(""),
      end: points[points.length - 1],
    };
  });
}

/** Full links appear together; only the fixed peer nodes gently pulse. */
export function signalMarkup(): string {
  const [ox, oy] = signalOrigin();
  const arcs = signalArcs()
    .map((arc, index) =>
      svgElement(
        "g",
        { class: "sig-arc", style: `--sig-i:${index}` },
        svgElement("path", { class: "sig-line", d: arc.d }) +
          svgElement("circle", {
            class: "sig-node",
            cx: arc.end[0],
            cy: arc.end[1],
            r: 6,
          }),
      ),
    )
    .join("");
  return arcs + svgElement("circle", { class: "sig-origin", cx: ox, cy: oy, r: 8 });
}

/**
 * The opening's layer. Its content is static markup (static-svg.ts), so
 * hydration never walks its arcs.
 */
export function HeroSignalFrame() {
  return (
    <svg
      data-home-signals=""
      viewBox={`${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: signalMarkup() }}
    />
  );
}
