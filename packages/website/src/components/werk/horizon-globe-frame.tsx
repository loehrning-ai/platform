import {
  GERMANY_OUTLINE,
  graticulePath,
} from "./globe-geometry";
import {
  BERLIN,
  BERLIN_INSET_UNITS,
  BERLIN_UNITS,
  HORIZON,
  HORIZON_DEPTH_FADE,
  HORIZON_GLINT,
  HORIZON_HOME_SCENE,
  HORIZON_ROUTE,
  HORIZON_SCENE,
  decodeRings,
  focusFade,
  horizonCenterLon,
  horizonFrame,
  limbExit,
  limbFade,
  limbPoint,
  meridianLines,
  parallelLines,
  polylinePeakDepth,
  projectHorizonPoint,
  rimDepth,
  routeLine,
  routeStations,
  scaleTicks,
  toSpherePolylines,
  tracePolylines,
  viewBasis,
  type HorizonSceneKey,
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
 * until the slot crops it. Up to three layers, back to front, painted per
 * HORIZON_SCENE (the lemons disc or the graphit line globe):
 *
 *  - `lines` (data-home-globe-ssr): on lemons the flat Mennige disc and the
 *    30 degree Ultramarin knockout graticule; on graphit the graticule and
 *    coastlines behind a CSS depth-fade mask. Hidden once the canvas has
 *    drawn.
 *  - `focus` (data-home-globe-ssr): Germany, the Lernroute with its
 *    stations and the Berlin station. Unmasked. Hidden once the canvas has
 *    drawn.
 *  - `sky` (data-home-globe-ssr, graphit only; the lemons disc edge is the
 *    limb): the limb, the apex glint, the degree scale
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

/** The phone slot width the server frame's rim is sized for, CSS px. */
const PHONE_SLOT_PX = 390;

/** Path writer at 0.1 unit: the flat disc's long knockout curves stay smooth. */
class FinePathWriter implements PathSink {
  d = "";

  moveTo(x: number, y: number): void {
    this.d += `M${r1(x)} ${r1(y)}`;
  }

  lineTo(x: number, y: number): void {
    this.d += `L${r1(x)} ${r1(y)}`;
  }
}

/**
 * The flat disc's graticule in frame units, as the canvas draws it at
 * theta 0: parallels and meridians ending on the rim circle
 * (HORIZON_RIM_PX) and faded by peak depth (HORIZON_LIMB_FADE), so no line
 * runs along the silhouette. `whole` holds
 * the lines at full alpha, `faded` the few near the limb.
 */
function flatGrid(step: number): {
  whole: string;
  faded: readonly { d: string; alpha: number }[];
} {
  const whole = new FinePathWriter();
  const faded: { d: string; alpha: number }[] = [];
  // The rim as the canvas draws it on a 390px phone slot at k = 1.
  const rim = rimDepth(HORIZON.r * PHONE_SLOT_PX);
  for (const lines of [
    toSpherePolylines(parallelLines(step)),
    toSpherePolylines(meridianLines(step)),
  ]) {
    for (let k = 0; k < lines.start.length; k++) {
      const alpha = limbFade(polylinePeakDepth(lines, k, BASIS));
      if (alpha <= 0) continue;
      if (alpha >= 1) {
        tracePolylines(whole, lines, BASIS, FRAME, FRAME.latMin, k, k + 1, rim);
        continue;
      }
      const writer = new FinePathWriter();
      tracePolylines(writer, lines, BASIS, FRAME, FRAME.latMin, k, k + 1, rim);
      if (writer.d) faded.push({ d: writer.d, alpha });
    }
  }
  return { whole: whole.d, faded };
}

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

type FrameData = {
  grid: string;
  /** The flat disc's graticule (absolute frame units), or null on the line globe. */
  flatGrid: ReturnType<typeof flatGrid> | null;
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
};

/** Computed once per scene and server process: the frame does not depend on the request. */
const cached = new Map<HorizonSceneKey, FrameData>();

function frameData(sceneKey: HorizonSceneKey): FrameData {
  const hit = cached.get(sceneKey);
  if (hit) return hit;
  const scene = HORIZON_SCENE[sceneKey];
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
  const data: FrameData = {
    grid: scene.disc
      ? ""
      : graticulePath(
          {
            centerLat: HORIZON.viewLat,
            centerLon: horizonCenterLon(0),
            radius: FRAME.radius,
          },
          scene.grid.step,
        ),
    flatGrid: scene.disc ? flatGrid(scene.grid.step) : null,
    coast: scene.coast ? coastPath() : "",
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
  cached.set(sceneKey, data);
  return data;
}

function Station({
  x,
  y,
  size,
  inset,
  outer,
  inner,
}: {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly inset: number;
  readonly outer: string;
  readonly inner: string;
}) {
  return (
    <>
      <rect
        x={r1(x - size / 2)}
        y={r1(y - size / 2)}
        width={size}
        height={size}
        fill={outer}
      />
      <rect
        x={r1(x - inset / 2)}
        y={r1(y - inset / 2)}
        width={inset}
        height={inset}
        fill={inner}
      />
    </>
  );
}

export function HorizonGlobeFrame({
  scene: sceneKey = HORIZON_HOME_SCENE,
}: {
  /** The home scene to paint in (SPEC D7); defaults to the site's HOME_SCENE. */
  readonly scene?: HorizonSceneKey;
} = {}) {
  const data = frameData(sceneKey);
  const scene = HORIZON_SCENE[sceneKey];
  const flat = scene.disc !== null;
  const gridWidth = scene.grid.width ?? 0.5;

  return (
    <>
      <svg
        {...VIEWBOX}
        aria-hidden="true"
        focusable="false"
        fill="none"
        data-home-globe-ssr=""
        data-home-globe-layer="lines"
        data-home-globe-scene={sceneKey}
        className={flat ? "hz-layer hz-disc-layer" : "hz-layer hz-lines"}
        style={
          scene.grid.depthFade
            ? {
                maskImage: data.mask,
                WebkitMaskImage: data.mask,
                // Radial reveal origin for the opening: Germany.
                ["--hz-fx" as string]: `${r1(data.focus.x / 10)}cqw`,
                ["--hz-fy" as string]: `${r1(data.focus.y / 10)}cqw`,
              }
            : undefined
        }
      >
        {scene.disc ? (
          <circle
            className="hz-disc"
            cx={r1(FRAME.centerX)}
            cy={r1(FRAME.centerY)}
            r={r1(FRAME.radius)}
            fill={scene.disc}
          />
        ) : null}
        {data.flatGrid ? (
          <g
            className="hz-grid"
            stroke={scene.grid.hex}
            strokeOpacity={scene.grid.alpha}
            strokeWidth={gridWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={data.flatGrid.whole} vectorEffect="non-scaling-stroke" />
            {data.flatGrid.faded.map((line) => (
              <path
                key={line.d}
                d={line.d}
                strokeOpacity={Math.round(scene.grid.alpha * line.alpha * 100) / 100}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        ) : (
          <path
            className="hz-grid"
            d={data.grid}
            transform={`translate(${r1(FRAME.centerX)} ${r1(FRAME.centerY)})`}
            stroke={scene.grid.hex}
            strokeOpacity={scene.grid.alpha}
            strokeWidth={gridWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {scene.coast ? (
          <path
            d={data.coast}
            stroke={scene.grid.hex}
            strokeOpacity={scene.coast.alpha}
            strokeWidth="0.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
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
            stroke={scene.route.hex}
            strokeOpacity={scene.route.alpha}
            strokeWidth={scene.route.width}
            strokeLinecap={flat ? "round" : undefined}
            vectorEffect="non-scaling-stroke"
          />
          <g className="hz-stations">
            {data.stations.map((station, index) => (
              <g key={index} style={{ ["--hz-i" as string]: index }}>
                <Station
                  x={station.x}
                  y={station.y}
                  size={HORIZON_ROUTE.stationUnits}
                  inset={HORIZON_ROUTE.stationInsetUnits}
                  outer={scene.station.outer}
                  inner={scene.station.inner}
                />
              </g>
            ))}
          </g>
          <path
            className="hz-de-fill"
            d={data.germany}
            fill={scene.germany.hex}
            fillOpacity={scene.germany.fillAlpha * data.fade}
          />
          {scene.germany.strokeAlpha !== null ? (
            <path
              className="hz-de"
              d={data.germany}
              pathLength={1}
              stroke={scene.germany.hex}
              strokeOpacity={scene.germany.strokeAlpha * data.fade}
              strokeWidth="1.5"
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <g className="hz-berlin" opacity={data.fade}>
            <Station
              x={data.berlin.x}
              y={data.berlin.y}
              size={BERLIN_UNITS}
              inset={BERLIN_INSET_UNITS}
              outer={scene.berlin.outer}
              inner={scene.berlin.inner}
            />
          </g>
        </svg>
      ) : null}

      {scene.sky ? (
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
            stroke={scene.grid.hex}
            strokeOpacity="0.22"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="hz-scale"
            d={data.ticks.major}
            stroke={scene.grid.hex}
            strokeOpacity="0.4"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="hz-limb"
            d={data.limbLeft}
            pathLength={1}
            stroke={scene.grid.hex}
            strokeOpacity="0.5"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="hz-limb"
            d={data.limbRight}
            pathLength={1}
            stroke={scene.grid.hex}
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
                stroke={scene.grid.hex}
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
            stroke={scene.grid.hex}
            strokeOpacity="0.9"
            strokeWidth="1.5"
            strokeDasharray="0.12 2"
            strokeDashoffset="0.12"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
    </>
  );
}
