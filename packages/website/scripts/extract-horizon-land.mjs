#!/usr/bin/env node
/**
 * Build-time extract for the phone home hero's horizon globe.
 *
 * Reads the Natural Earth land polygons from world-atlas (land-50m.json),
 * keeps exterior rings only, simplifies them with Douglas-Peucker and writes
 * them into src/lib/horizon-land.ts. The runtime never imports world-atlas or
 * topojson-client; both stay devDependencies.
 *
 *   $ node scripts/extract-horizon-land.mjs           write src/lib/horizon-land.ts
 *   $ node scripts/extract-horizon-land.mjs --check   exit 1 if it is stale
 *
 * Licences: world-atlas (ISC, Michael Bostock) redistributes Natural Earth
 * data (public domain); topojson-client (ISC, Michael Bostock). The full
 * upstream notices are in LICENSES/world-atlas-ISC.txt and
 * LICENSES/topojson-client-ISC.txt at the repository root.
 *
 * Encoding: one plain array of integers per ring, like the numeric tuples in
 * src/lib/country-polylines-3d.ts. Coordinates are lon/lat times 10, and each
 * pair is the delta from the previous point of the same ring (the first pair
 * is the delta from 0, so it is the absolute start point):
 *   [lon0, lat0, dLon1, dLat1, dLon2, dLat2, ...]
 * Numbers and commas only, so the data never looks like an encoded secret to
 * the publication scanner. The decoder is decodeRings() in
 * src/components/werk/horizon-projection.ts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ATLAS_PATH = resolve(__dirname, "../node_modules/world-atlas/land-50m.json");
const OUT_PATH = resolve(__dirname, "../src/lib/horizon-land.ts");

/** Douglas-Peucker tolerance in degrees. 0.25 deg is about 28 km. */
const TOLERANCE_DEG = Number(process.env.HZ_EPS ?? 0.25);
/** Rings whose bounding box is smaller than this (deg2) are dropped. */
const MIN_RING_AREA_DEG2 = Number(process.env.HZ_MIN_AREA ?? 0.6);
/**
 * The horizon view never shows anything south of about 15 deg S (the slot
 * crops the sphere below the horizon), so rings that stay further south are
 * dropped.
 */
const MIN_RING_MAX_LAT = -20;
const SCALE = 10;

function exteriorRings(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((p) => p[0]);
  return [];
}

function bboxArea(ring) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return (maxLon - minLon) * (maxLat - minLat);
}

function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / len;
}

function douglasPeucker(points, eps) {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > eps && maxI > 0) {
      keep[maxI] = 1;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A closed ring simplified in two halves, so its start point is not the only anchor. */
function simplifyRing(ring, eps) {
  let far = 0;
  let farDist = 0;
  ring.forEach((p, i) => {
    const d = Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]);
    if (d > farDist) {
      farDist = d;
      far = i;
    }
  });
  return douglasPeucker(ring.slice(0, far + 1), eps).concat(
    douglasPeucker(ring.slice(far), eps).slice(1),
  );
}

const CHECK = process.argv.includes("--check");

const topology = JSON.parse(readFileSync(ATLAS_PATH, "utf8"));
const land = feature(topology, topology.objects.land);
const geometries = land.features ? land.features.map((f) => f.geometry) : [land.geometry];

const rings = [];
for (const geometry of geometries) {
  for (const ring of exteriorRings(geometry)) {
    if (bboxArea(ring) < MIN_RING_AREA_DEG2) continue;
    if (Math.max(...ring.map((p) => p[1])) < MIN_RING_MAX_LAT) continue;
    const simplified = simplifyRing(ring, TOLERANCE_DEG);
    if (simplified.length < 4) continue;
    rings.push(simplified);
  }
}

let points = 0;
const deltaRings = rings.map((ring) => {
  let prevLon = 0;
  let prevLat = 0;
  const deltas = [];
  for (const [lon, lat] of ring) {
    const x = Math.round(lon * SCALE);
    const y = Math.round(lat * SCALE);
    // A point that rounds onto its predecessor adds nothing to the outline.
    if (deltas.length && x === prevLon && y === prevLat) continue;
    // `+ 0` folds -0 into 0, so the output never spells "-0".
    deltas.push(x - prevLon + 0, y - prevLat + 0);
    prevLon = x;
    prevLat = y;
    points++;
  }
  return deltas;
});

for (const deltas of deltaRings) {
  if (!deltas.every(Number.isSafeInteger)) throw new Error("horizon-land: non-integer delta");
}

const body = deltaRings.map((deltas) => `  [${deltas.join(",")}],`).join("\n");

const source = `/**
 * Auto-generated by scripts/extract-horizon-land.mjs.
 * DO NOT edit by hand; re-run the script to regenerate.
 *
 * Source: world-atlas/land-50m.json (ISC, Michael Bostock), which
 * redistributes Natural Earth land polygons (public domain).
 * Transformation: topojson-client (ISC, Michael Bostock), exterior rings only,
 * Douglas-Peucker ${TOLERANCE_DEG} deg, rings under ${MIN_RING_AREA_DEG2} deg2 or wholly south of
 * ${-MIN_RING_MAX_LAT} deg S dropped. ${rings.length} rings, ${points} points.
 * Full upstream notices: LICENSES/world-atlas-ISC.txt and
 * LICENSES/topojson-client-ISC.txt at the repository root.
 *
 * Encoding: one array per ring, lon/lat x ${SCALE} as integers,
 * [lon0, lat0, dLon1, dLat1, ...] with every pair the delta from the previous
 * point (the first from 0); see decodeRings() in
 * src/components/werk/horizon-projection.ts.
 */
export const HORIZON_LAND_SCALE = ${SCALE};

export const HORIZON_LAND: readonly (readonly number[])[] = [
${body}
];
`;

const summary = `horizon-land: ${rings.length} rings, ${points} points, ${source.length} bytes, ${gzipSync(source, { level: 9 }).length} bytes gzip`;

if (CHECK) {
  let current = "";
  try {
    current = readFileSync(OUT_PATH, "utf8");
  } catch {
    // A missing file is stale too.
  }
  if (current !== source) {
    console.error(`${summary}\nsrc/lib/horizon-land.ts is stale; run node scripts/extract-horizon-land.mjs`);
    process.exit(1);
  }
  console.log(`${summary} (up to date)`);
} else {
  writeFileSync(OUT_PATH, source);
  console.log(summary);
}
