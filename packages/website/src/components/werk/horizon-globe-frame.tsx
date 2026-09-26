import {
  GERMANY_OUTLINE,
  graticulePath,
} from "./globe-geometry";
import {
  BERLIN,
  BERLIN_INSET_UNITS,
  BERLIN_UNITS,
  HORIZON,
  HORIZON_ALPHA,
  HORIZON_DEPTH_FADE,
  HORIZON_GLINT,
  HORIZON_GRID_STEP,
  HORIZON_ROUTE,
  decodeRings,
  focusFade,
  horizonCenterLon,
  horizonFrame,
  limbExit,
  limbPoint,
  projectHorizonPoint,
  routeLine,
  routeStations,
  scaleTicks,
  toSpherePolylines,
  tracePolylines,
  viewBasis,
  type PathSink,
} from "./horizon-projection";
import { HORIZON_LAND, HORIZON_LAND_SCALE } from "@/lib/horizon-land";

/**
 * Server-rendered first frame of the phone hero's horizon globe.
 *
 * Everything here is computed on the server at render time and ships as
 * inline SVG, so the band is complete at first paint without JavaScript, the
 * canvas renderer (horizon-globe-renderer.ts) has an exact frame to take over
 * from, and reduced-motion, Save-Data and no-JS visitors keep this frame.
 *
 * The drawing lives in a 1000-unit-wide coordinate system: each SVG has a
 * viewBox 100 units tall with `xMidYMin meet`, so 1000 units always equal the
 * slot width and the drawing continues below the viewBox (overflow visible)
 * until the slot crops it. Three layers, back to front:
 *
 *  - `lines` (data-home-globe-ssr): graticule and coastlines behind a CSS
 *    depth-fade mask. Hidden once the canvas has drawn.
 *  - `focus` (data-home-globe-ssr): Germany, the Lernroute with its
 *    stations and the Berlin station. Unmasked, the one Mennige group in the
 *    band. Hidden once the canvas has drawn.
 *  - `sky` (data-home-globe-ssr): the limb, the apex glint, the degree scale
 *    and the one-off light sweep. The canvas redraws the limb, glint and
 *    scale (it pushes the sphere in after the takeover, so a fixed SVG limb
 *    would no longer meet the lines), so this layer steps out too.
 *
 * Decorative only: every SVG is aria-hidden and unfocusable, and nothing
 * carries an id.
 */

const UNITS = 1000;
const FRAME = horizonFrame(UNITS, HORIZON.depth * UNITS);
const BASIS = viewBasis(HORIZON.viewLat, horizonCenterLon(0));

/** Compact SVG path writer: absolute moves, relative integer lines. */
class PathWriter implements PathSink {
  d = "";
  private x = 0;
  private y = 0;

  moveTo(x: number, y: number): void {
    const X = Math.round(x);
    const Y = Math.round(y);
    this.d += `M${X} ${Y}`;
    this.x = X;
    this.y = Y;
  }

  lineTo(x: number, y: number): void {
    const X = Math.round(x);
    const Y = Math.round(y);
    const dx = X - this.x;
    const dy = Y - this.y;
    if (!dx && !dy) return;
    this.d += `l${dx}${dy < 0 ? dy : ` ${dy}`}`;
    this.x = X;
    this.y = Y;
  }
}

function coastPath(): string {
  const writer = new PathWriter();
  const land = toSpherePolylines(decodeRings(HORIZON_LAND, HORIZON_LAND_SCALE));
  tracePolylines(writer, land, BASIS, FRAME, FRAME.latMin);
  return writer.d;
}

function germanyPath(): string {
  const writer = new PathWriter();
  const whole = tracePolylines(
    writer,
    toSpherePolylines([GERMANY_OUTLINE]),
    BASIS,
    FRAME,
    -90,
  );
  return whole ? `${writer.d}Z` : writer.d;
}

const r1 = (value: number): string => String(Math.round(value * 10) / 10);

/** Limb arc between two angles from the apex (degrees, clockwise positive). */
function limbArc(from: number, to: number): string {
  const [x0, y0] = limbPoint(FRAME, from);
  const [x1, y1] = limbPoint(FRAME, to);
  const R = r1(FRAME.radius);
  return `M${r1(x0)} ${r1(y0)}A${R} ${R} 0 0 ${to > from ? 1 : 0} ${r1(x1)} ${r1(y1)}`;
}

function tickPath(ticks: readonly (readonly [number, number, number, number])[]): string {
  return ticks
    .map(([x0, y0, x1, y1]) => `M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}`)
    .join("");
}

function routePath(): string {
  const writer = new PathWriter();
  tracePolylines(writer, toSpherePolylines([routeLine()]), BASIS, FRAME, -90);
  return writer.d;
}

/** CSS mask for the depth fade, in container units of the slot. */
export function horizonDepthMask(): string {
  const at = `${r1(HORIZON.cx * 100)}cqw ${r1((HORIZON.top + HORIZON.r) * 100)}cqw`;
  const stops = HORIZON_DEPTH_FADE.map(
    ([fraction, alpha]) =>
      `rgb(0 0 0 / ${alpha}) ${r1(fraction * HORIZON.r * 100)}cqw`,
  ).join(", ");
  return `radial-gradient(circle ${r1(HORIZON.r * 100)}cqw at ${at}, ${stops})`;
}

const VIEWBOX = { viewBox: "0 0 1000 100", preserveAspectRatio: "xMidYMin meet" };

/** Computed once per server process: the frame does not depend on the request. */
let cached: {
  grid: string;
  coast: string;
  germany: string;
  berlin: { x: number; y: number };
  fade: number;
  focus: { x: number; y: number };
  ticks: { minor: string; major: string };
  route: string;
  stations: readonly { x: number; y: number }[];
  limbLeft: string;
  limbRight: string;
  glint: readonly string[];
  sweep: string;
  mask: string;
} | null = null;

function frameData() {
  if (cached) return cached;
  const berlin = projectHorizonPoint(BERLIN[0], BERLIN[1], BASIS, FRAME);
  const focus = projectHorizonPoint(
    HORIZON.focusLat,
    HORIZON.focusLon,
    BASIS,
    FRAME,
  );
  const left = limbExit(FRAME, -1);
  const right = limbExit(FRAME, 1);
  const ticks = scaleTicks(FRAME);
  cached = {
    grid: graticulePath(
      {
        centerLat: HORIZON.viewLat,
        centerLon: horizonCenterLon(0),
        radius: FRAME.radius,
      },
      HORIZON_GRID_STEP,
    ),
    coast: coastPath(),
    germany: germanyPath(),
    berlin: { x: berlin.x, y: berlin.y },
    fade: focusFade(focus.depth),
    focus: { x: focus.x, y: focus.y },
    ticks: { minor: tickPath(ticks.minor), major: tickPath(ticks.major) },
    route: routePath(),
    stations: routeStations()
      .map(([lat, lon]) => projectHorizonPoint(lat, lon, BASIS, FRAME))
      .filter((point) => point.depth > 0 && point.y < FRAME.height)
      .map(({ x, y }) => ({ x, y })),
    limbLeft: limbArc(0, left),
    limbRight: limbArc(0, right),
    glint: HORIZON_GLINT.map(([half]) => limbArc(-half, half)),
    sweep: limbArc(left, right),
    mask: horizonDepthMask(),
  };
  return cached;
}

const LINE = "#f2f1ee";
const ACCENT = "#e07050";
const GRAPHIT = "#141414";

export function HorizonGlobeFrame() {
  const data = frameData();
  const berlinSize = BERLIN_UNITS;
  const insetSize = BERLIN_INSET_UNITS;

  return (
    <>
      <svg
        {...VIEWBOX}
        aria-hidden="true"
        focusable="false"
        fill="none"
        data-home-globe-ssr=""
        data-home-globe-layer="lines"
        className="hz-layer hz-lines"
        style={{
          maskImage: data.mask,
          WebkitMaskImage: data.mask,
          // Radial reveal origin for the opening: Germany.
          ["--hz-fx" as string]: `${r1(data.focus.x / 10)}cqw`,
          ["--hz-fy" as string]: `${r1(data.focus.y / 10)}cqw`,
        }}
      >
        <path
          d={data.grid}
          transform={`translate(${r1(FRAME.centerX)} ${r1(FRAME.centerY)})`}
          stroke={LINE}
          strokeOpacity={HORIZON_ALPHA.grid}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={data.coast}
          stroke={LINE}
          strokeOpacity={HORIZON_ALPHA.coast}
          strokeWidth="0.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {data.germany ? (
        <svg
          {...VIEWBOX}
          aria-hidden="true"
          focusable="false"
          fill="none"
          data-home-globe-ssr=""
          data-home-globe-layer="focus"
          className="hz-layer hz-focus"
        >
          {/* The Lernroute: drawn from Berlin after Germany, the one
              moment the band's accent moves. */}
          <path
            className="hz-route"
            d={data.route}
            pathLength={1}
            stroke={ACCENT}
            strokeOpacity={HORIZON_ROUTE.alpha}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <g className="hz-stations">
            {data.stations.map((station, index) => (
              <g key={index} style={{ ["--hz-i" as string]: index }}>
                <rect
                  x={r1(station.x - HORIZON_ROUTE.stationUnits / 2)}
                  y={r1(station.y - HORIZON_ROUTE.stationUnits / 2)}
                  width={HORIZON_ROUTE.stationUnits}
                  height={HORIZON_ROUTE.stationUnits}
                  fill={ACCENT}
                />
                <rect
                  x={r1(station.x - HORIZON_ROUTE.stationInsetUnits / 2)}
                  y={r1(station.y - HORIZON_ROUTE.stationInsetUnits / 2)}
                  width={HORIZON_ROUTE.stationInsetUnits}
                  height={HORIZON_ROUTE.stationInsetUnits}
                  fill={GRAPHIT}
                />
              </g>
            ))}
          </g>
          <path
            className="hz-de-fill"
            d={data.germany}
            fill={ACCENT}
            fillOpacity={HORIZON_ALPHA.germanyFill * data.fade}
          />
          <path
            className="hz-de"
            d={data.germany}
            pathLength={1}
            stroke={ACCENT}
            strokeOpacity={HORIZON_ALPHA.germanyStroke * data.fade}
            strokeWidth="1.5"
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
          <g className="hz-berlin" opacity={data.fade}>
            <rect
              x={r1(data.berlin.x - berlinSize / 2)}
              y={r1(data.berlin.y - berlinSize / 2)}
              width={berlinSize}
              height={berlinSize}
              fill={ACCENT}
            />
            <rect
              x={r1(data.berlin.x - insetSize / 2)}
              y={r1(data.berlin.y - insetSize / 2)}
              width={insetSize}
              height={insetSize}
              fill={LINE}
            />
          </g>
        </svg>
      ) : null}

      <svg
        {...VIEWBOX}
        aria-hidden="true"
        focusable="false"
        fill="none"
        data-home-globe-ssr=""
        data-home-globe-layer="sky"
        className="hz-layer hz-sky"
      >
        <path
          className="hz-scale"
          d={data.ticks.minor}
          stroke={LINE}
          strokeOpacity="0.22"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="hz-scale"
          d={data.ticks.major}
          stroke={LINE}
          strokeOpacity="0.4"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="hz-limb"
          d={data.limbLeft}
          pathLength={1}
          stroke={LINE}
          strokeOpacity="0.5"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="hz-limb"
          d={data.limbRight}
          pathLength={1}
          stroke={LINE}
          strokeOpacity="0.5"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {/* Pole glint: the pole sits just behind the apex, so the limb is
            brightest there. Three stacked arcs taper it without a blur. */}
        <g className="hz-glint">
          {data.glint.map((d, index) => (
            <path
              key={d}
              d={d}
              stroke={LINE}
              strokeOpacity={HORIZON_GLINT[index][1]}
              strokeWidth={HORIZON_GLINT[index][2]}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <path
          className="hz-sweep"
          d={data.sweep}
          pathLength={1}
          stroke={LINE}
          strokeOpacity="0.9"
          strokeWidth="1.5"
          strokeDasharray="0.12 2"
          strokeDashoffset="0.12"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}
