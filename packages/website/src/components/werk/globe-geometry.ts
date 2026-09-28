/**
 * Orthographic globe geometry for <GlobeLines>.
 *
 * Every parallel and meridian is a circle on the sphere, and an orthographic
 * projection is affine, so each one lands on screen as an ellipse. That lets
 * the graticule be written as one SVG elliptical arc per circle (the visible
 * half, or the visible stretch of a parallel) instead of hundreds of sampled
 * points, which keeps the whole drawing to a few kilobytes of markup.
 *
 * Pure functions, no DOM: the SVG is computed on the server.
 */

type Vec3 = readonly [number, number, number];

export type GlobeView = {
  /** Latitude that faces the viewer, in degrees. */
  readonly centerLat: number;
  /** Longitude that faces the viewer, in degrees. */
  readonly centerLon: number;
  /** Sphere radius in SVG user units. The sphere is centred on 0,0. */
  readonly radius: number;
};

const DEG = Math.PI / 180;

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function onSphere(lat: number, lon: number): Vec3 {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
  ];
}

/** View basis: x points east, y points north, z points at the viewer. */
function viewBasis(view: GlobeView): readonly [Vec3, Vec3, Vec3] {
  const phi = view.centerLat * DEG;
  const lambda = view.centerLon * DEG;
  const east: Vec3 = [-Math.sin(lambda), Math.cos(lambda), 0];
  const north: Vec3 = [
    -Math.sin(phi) * Math.cos(lambda),
    -Math.sin(phi) * Math.sin(lambda),
    Math.cos(phi),
  ];
  return [east, north, onSphere(view.centerLat, view.centerLon)];
}

function toView(point: Vec3, basis: readonly [Vec3, Vec3, Vec3]): Vec3 {
  return [dot(point, basis[0]), dot(point, basis[1]), dot(point, basis[2])];
}

/** Rounds to one decimal and drops a trailing ".0" to keep markup small. */
function fmt(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * Screen position of a lat/lon, with SVG's y axis pointing down. `visible` is
 * false on the far hemisphere.
 */
export function projectPoint(
  lat: number,
  lon: number,
  view: GlobeView,
): { x: number; y: number; visible: boolean } {
  const [x, y, z] = toView(onSphere(lat, lon), viewBasis(view));
  return { x: x * view.radius, y: -y * view.radius, visible: z >= 0 };
}

/**
 * One circle on the unit sphere: centre `center`, orthonormal in-plane axes
 * `u` and `v`, radius `r`. Returns the SVG path data of its visible part.
 */
function circleArc(
  center: Vec3,
  u: Vec3,
  v: Vec3,
  r: number,
  view: GlobeView,
): string {
  const basis = viewBasis(view);
  const c = toView(center, basis);
  const a = toView(u, basis);
  const b = toView(v, basis);
  const R = view.radius;

  // Screen coordinates (y down) of the ellipse p(t) = c + r (cos t a + sin t b).
  const point = (t: number): readonly [number, number] => [
    (c[0] + r * (Math.cos(t) * a[0] + Math.sin(t) * b[0])) * R,
    -(c[1] + r * (Math.cos(t) * a[1] + Math.sin(t) * b[1])) * R,
  ];

  // Conjugate semi-diameters on screen.
  const m00 = r * a[0] * R;
  const m10 = -r * a[1] * R;
  const m01 = r * b[0] * R;
  const m11 = -r * b[1] * R;
  const p = m00 * m00 + m01 * m01;
  const q = m00 * m10 + m01 * m11;
  const s = m10 * m10 + m11 * m11;
  const mean = (p + s) / 2;
  const spread = Math.sqrt(((p - s) / 2) ** 2 + q * q);
  const rx = Math.sqrt(Math.max(mean + spread, 0));
  const ry = Math.sqrt(Math.max(mean - spread, 0));
  if (rx < 0.5) return "";
  const rotation = (0.5 * Math.atan2(2 * q, p - s)) / DEG;
  // Increasing t runs clockwise on screen when the determinant is positive.
  const sweep = m00 * m11 - m01 * m10 > 0 ? 1 : 0;

  // Visible where depth z(t) = c.z + r (A cos t + B sin t) >= 0.
  const A = r * a[2];
  const B = r * b[2];
  const amplitude = Math.hypot(A, B);
  const arc = (from: number, to: number): string => {
    const start = point(from);
    const end = point(to);
    const large = to - from > Math.PI ? 1 : 0;
    return `M${fmt(start[0])} ${fmt(start[1])}A${fmt(rx)} ${fmt(ry)} ${fmt(rotation)} ${large} ${sweep} ${fmt(end[0])} ${fmt(end[1])}`;
  };

  if (amplitude <= Math.abs(c[2]) || amplitude < 1e-9) {
    if (c[2] < 0) return "";
    // Wholly visible: two half arcs make the full ellipse.
    return `${arc(0, Math.PI)}${arc(Math.PI, 2 * Math.PI).replace(/^M[^A]+/, "")}`;
  }

  // Depth peaks at t0; visible for |t - t0| <= half.
  const t0 = Math.atan2(B, A);
  const half = Math.acos(Math.max(-1, Math.min(1, -c[2] / amplitude)));
  return arc(t0 - half, t0 + half);
}

/** Path data for the graticule: parallels and meridians every `step` degrees. */
export function graticulePath(view: GlobeView, step = 10): string {
  const parts: string[] = [];
  for (let lat = -90 + step; lat < 90; lat += step) {
    const phi = lat * DEG;
    parts.push(
      circleArc([0, 0, Math.sin(phi)], [1, 0, 0], [0, 1, 0], Math.cos(phi), view),
    );
  }
  // A great circle through both poles covers the meridians lon and lon + 180.
  for (let lon = 0; lon < 180; lon += step) {
    const lambda = lon * DEG;
    parts.push(
      circleArc(
        [0, 0, 0],
        [Math.cos(lambda), Math.sin(lambda), 0],
        [0, 0, 1],
        1,
        view,
      ),
    );
  }
  return parts.join("");
}

/** Path data for a closed lat/lon outline; empty when any point is hidden. */
export function outlinePath(
  outline: readonly (readonly [number, number])[],
  view: GlobeView,
): string {
  const points = outline.map(([lat, lon]) => projectPoint(lat, lon, view));
  if (points.length < 3 || points.some((point) => !point.visible)) return "";
  const [first, ...rest] = points;
  return `M${fmt(first.x)} ${fmt(first.y)}L${rest
    .map((point) => `${fmt(point.x)} ${fmt(point.y)}`)
    .join(" ")}Z`;
}

/**
 * Germany, simplified by hand to about 70 vertices (lat, lon). Precise enough
 * to be recognised at the 60 to 150px it is drawn at; not a map.
 */
export const GERMANY_OUTLINE: readonly (readonly [number, number])[] = [
  [53.56, 6.9], [53.7, 7.2], [53.72, 8.0], [53.87, 8.68], [54.3, 8.6],
  [54.5, 8.9], [54.91, 8.6], [54.83, 9.4], [54.8, 9.95], [54.47, 10.02],
  [54.35, 10.9], [54.0, 10.85], [54.2, 11.2], [54.0, 11.6], [54.18, 12.1],
  [54.45, 12.5], [54.58, 13.3], [54.1, 13.8], [53.93, 14.2], [53.3, 14.4],
  [52.85, 14.13], [52.55, 14.6], [52.0, 14.75], [51.55, 14.72], [51.05, 15.0],
  [50.87, 14.8], [50.9, 14.3], [50.7, 13.5], [50.3, 12.95], [50.2, 12.2],
  [49.95, 12.5], [49.5, 12.6], [49.0, 13.4], [48.77, 13.8], [48.57, 13.44],
  [48.2, 12.95], [47.7, 13.0], [47.47, 13.0], [47.68, 12.2], [47.6, 11.4],
  [47.4, 11.1], [47.55, 10.5], [47.5, 9.7], [47.66, 9.2], [47.7, 8.6],
  [47.6, 7.6], [48.1, 7.6], [48.6, 7.8], [48.97, 8.2], [49.1, 7.4],
  [49.15, 6.7], [49.45, 6.35], [49.8, 6.5], [50.13, 6.13], [50.3, 6.4],
  [50.75, 6.02], [51.05, 5.9], [51.25, 6.2], [51.85, 5.95], [51.85, 6.8],
  [52.2, 7.05], [52.45, 7.0], [52.65, 6.7], [52.9, 7.1], [53.2, 7.2],
];
