#!/usr/bin/env node
/**
 * One-off extract: pulls 6 country outlines from world-atlas (50m resolution),
 * keeps raw lat/lon polylines, and writes them to
 * src/lib/country-polylines-3d.ts so HeroNetwork can project them onto the
 * spinning globe each frame using the same project(lat, lon, rLon, rLat) math
 * the graticule uses.
 *
 * Re-run only when the country list in the hero changes:
 *
 *   $ node scripts/extract-country-outlines.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 50m resolution — Natural Earth medium scale via Mike Bostock's world-atlas.
// The country outlines drive the hero globe's per-city draw-in animation, so
// we want recognizable shapes (USA's Florida peninsula, Italy's boot, Brazil's
// eastern bulge), not stick-figure polygons.
const ATLAS_PATH = resolve(
  __dirname,
  "../node_modules/world-atlas/countries-50m.json",
);
const OUT_PATH = resolve(__dirname, "../src/lib/country-polylines-3d.ts");

/** Minimum bbox area (in deg²) for a ring to be kept — strips tiny islands. */
const MIN_RING_AREA_DEG2 = 4;
/** Douglas-Peucker tolerance (in deg) for the 3D pass. 0.10° ≈ 11 km — keeps
 *  recognizable coastline kinks without ballooning vertex count. */
const DP_TOLERANCE_DEG_3D = 0.1;
/** Per-country visual scale factor — applied around the polygon centroid
 *  in lat/lon space. Used to bump small countries (Germany) up to a
 *  comparable visual size with the giants in the cycle (USA, China, Brazil). */
const COUNTRY_SCALE = {
  BERLIN: 2.2,  // Germany is ~360k km² — geographically smallest in the cycle.
};

const TARGETS = {
  // ISO 3166-1 numeric codes (string) → city key shown in the sidebar
  "276": "BERLIN",         // Germany
  "076": "SAO_PAULO",      // Brazil
  "156": "BEIJING",        // China (huge — replaces fragmented Japan archipelago)
  "840": "SAN_FRANCISCO",  // United States
  "356": "MUMBAI",         // India (iconic triangular shape, EU AI Act extraterritorial)
  "392": "TOKYO",          // Japan
};

/** Compute bbox of all rings together. */
function bboxOf(rings) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLon, minLat, maxLon, maxLat];
}

/** Drop rings whose bbox area is below the threshold. */
function dropTinyRings(rings) {
  return rings.filter((ring) => {
    const [a, b, c, d] = bboxOf([ring]);
    return (c - a) * (d - b) >= MIN_RING_AREA_DEG2;
  });
}

/** Pull only exterior rings out of a GeoJSON Polygon/MultiPolygon geometry.
 *  TopoJSON-derived geometries don't reliably follow RFC 7946 winding order,
 *  so we use *structure* not orientation: for a Polygon, coordinates[0] is
 *  the outer boundary; for a MultiPolygon, each polygon[0] is its outer
 *  boundary. Holes (e.g. Great Lakes inside the lower-48) are dropped. */
function exteriorRings(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((p) => p[0]);
  return [];
}

/** Perpendicular distance from point p to segment ab. */
function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    const px = p[0] - a[0], py = p[1] - a[1];
    return Math.sqrt(px * px + py * py);
  }
  const num = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]);
  const den = Math.sqrt(dx * dx + dy * dy);
  return num / den;
}

/** Iterative Douglas-Peucker — drops points within `eps` of a chord. */
function douglasPeucker(points, eps) {
  if (points.length < 3) return points.slice();
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > eps && maxI !== -1) {
      keep[maxI] = true;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function simplifyRings(rings, eps) {
  return rings.map((r) => douglasPeucker(r, eps));
}

/** USA needs Alaska and Hawaii pruned for a tidy lower-48 silhouette. */
function pruneUS(rings) {
  const inLower48 = (ring) => {
    const [a, b, c, d] = bboxOf([ring]);
    return a >= -130 && c <= -65 && b >= 24 && d <= 50;
  };
  return rings.filter(inLower48);
}

const atlas = JSON.parse(readFileSync(ATLAS_PATH, "utf8"));
const fc = feature(atlas, atlas.objects.countries);

const out = {};
const meta = {};
for (const f of fc.features) {
  const id = String(f.id ?? "").padStart(3, "0");
  if (!TARGETS[id]) continue;
  const key = TARGETS[id];

  // Take only the *exterior* ring of each polygon — never interior holes.
  let rings = exteriorRings(f.geometry);

  if (key === "SAN_FRANCISCO") {
    rings = pruneUS(rings);
  }
  rings = dropTinyRings(rings);
  rings = simplifyRings(rings, DP_TOLERANCE_DEG_3D);

  // Visual scale (lat/lon space, around the country centroid). Approximate —
  // good enough for shapes far from the poles. Bumps small countries so they
  // hold their own visually next to USA / China / Brazil.
  const scale = COUNTRY_SCALE[key] ?? 1;
  if (scale !== 1) {
    let cLon = 0, cLat = 0, n = 0;
    for (const ring of rings) {
      for (const [lon, lat] of ring) { cLon += lon; cLat += lat; n++; }
    }
    cLon /= n; cLat /= n;
    rings = rings.map((ring) =>
      ring.map(([lon, lat]) => [
        cLon + (lon - cLon) * scale,
        cLat + (lat - cLat) * scale,
      ]),
    );
  }

  // Convert each ring from [lon, lat] (GeoJSON) to [lat, lon] so consumers
  // can call project(lat, lon, …) without re-ordering tuples per-frame.
  const polylines = rings.map((ring) =>
    ring.map(([lon, lat]) => [
      Number(lat.toFixed(3)),
      Number(lon.toFixed(3)),
    ]),
  );

  out[key] = polylines;
  meta[key] = {
    name: f.properties.name,
    rings: polylines.length,
    vertices: polylines.reduce((s, r) => s + r.length, 0),
  };
}

const header = `/**
 * Auto-generated by scripts/extract-country-outlines.mjs.
 * DO NOT edit by hand — re-run the script to regenerate.
 *
 * Source: world-atlas/countries-50m.json (ISC, Michael Bostock).
 * Transformation: topojson-client (ISC, Michael Bostock).
 * Full upstream notices: LICENSES/world-atlas-ISC.txt and
 * LICENSES/topojson-client-ISC.txt at the repository root.
 * Each entry is one country's set of polylines. Tuple order is [lat, lon]
 * so consumers can call project(lat, lon, rLon, rLat) directly without
 * re-ordering per-frame.
 *
 * Holes (interior rings, e.g. Great Lakes inside the USA) are removed by
 * selecting only the exterior ring from each GeoJSON polygon structure.
 */

export type LatLon = readonly [number, number];
export type Polyline = readonly LatLon[];

export const COUNTRY_POLYLINES_3D = ${JSON.stringify(out)} as const;

export type CountryKey3D = keyof typeof COUNTRY_POLYLINES_3D;
`;

writeFileSync(OUT_PATH, header);
console.log(`✓ wrote ${OUT_PATH}`);
for (const [k, v] of Object.entries(meta)) {
  console.log(
    `  ${k.padEnd(16)} ${v.name.padEnd(30)} ${String(v.rings).padStart(2)} ring(s)  ${String(v.vertices).padStart(4)} vert`,
  );
}
