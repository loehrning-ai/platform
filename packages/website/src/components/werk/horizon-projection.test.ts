import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GENERIC_BASE64_RE,
  hasBase64SecretShape,
} from "../../../scripts/open-source/export-denylist.mjs";
import { HORIZON_LAND, HORIZON_LAND_SCALE } from "@/lib/horizon-land";
import {
  BERLIN,
  HORIZON,
  HORIZON_ROUTE,
  decodeRings,
  greatCircle,
  horizonFrame,
  horizonPush,
  limbPoint,
  routeLine,
  routeStations,
  scaleTicks,
} from "./horizon-projection";

describe("horizon push-in", () => {
  it("leaves short and square slots at the server frame's scale", () => {
    expect(horizonPush(390, 200)).toBe(1);
    expect(horizonPush(390, 390)).toBe(1);
    expect(horizonPush(0, 0)).toBe(1);
  });

  it("grows with the slot's aspect and stops at the ceiling", () => {
    const phone = horizonPush(390, 483);
    expect(phone).toBeGreaterThan(1);
    expect(phone).toBeLessThan(HORIZON.pushMax);
    expect(horizonPush(390, 2000)).toBe(HORIZON.pushMax);
  });

  it("scales the sphere about the apex, so the limb never moves up or down", () => {
    const flat = horizonFrame(390, 600);
    const pushed = horizonFrame(390, 600, 1.4);
    expect(pushed.radius).toBeCloseTo(flat.radius * 1.4, 9);
    expect(limbPoint(pushed, 0)[1]).toBeCloseTo(limbPoint(flat, 0)[1], 9);
    expect(limbPoint(pushed, 0)[1]).toBeCloseTo(HORIZON.top * 390, 9);
    expect(pushed.centerX).toBe(flat.centerX);
  });
});

describe("Lernroute", () => {
  it("runs as a great circle from Berlin to its end point", () => {
    const line = routeLine();
    expect(line[0][0]).toBeCloseTo(BERLIN[0], 6);
    expect(line[0][1]).toBeCloseTo(BERLIN[1], 6);
    const end = line[line.length - 1];
    expect(end[0]).toBeCloseTo(HORIZON_ROUTE.to[0], 6);
    expect(end[1]).toBeCloseTo(HORIZON_ROUTE.to[1], 6);
    // Heads south-west from Berlin, towards the action.
    expect(line[5][0]).toBeLessThan(BERLIN[0]);
    expect(line[5][1]).toBeLessThan(BERLIN[1]);
  });

  it("samples every degree and marks three stations after Berlin", () => {
    const line = greatCircle([0, 0], [0, 10], 1);
    expect(line).toHaveLength(11);
    expect(line[5][1]).toBeCloseTo(5, 6);
    expect(routeStations()).toHaveLength(HORIZON_ROUTE.stations.length);
  });
});

describe("sky around the limb", () => {
  it("draws a degree scale with major ticks every 10 degrees", () => {
    const ticks = scaleTicks(horizonFrame(1000, 1600));
    expect(ticks.major).toHaveLength(5);
    expect(ticks.minor).toHaveLength(20);
  });
});

describe("decodeRings", () => {
  it("sums each pair onto the previous point and returns [lat, lon] in degrees", () => {
    expect(decodeRings([[100, 520, 5, -3, -10, 0]], 10)).toEqual([
      [
        [52, 10],
        [51.7, 10.5],
        [51.7, 9.5],
      ],
    ]);
  });

  it("starts every ring from zero instead of the previous ring's last point", () => {
    const [a, b] = decodeRings(
      [
        [10, 20, 1, 1],
        [-10, -20, -1, -1],
      ],
      10,
    );
    expect(a).toEqual([
      [2, 1],
      [2.1, 1.1],
    ]);
    expect(b).toEqual([
      [-2, -1],
      [-2.1, -1.1],
    ]);
  });

  it("drops rings under two points and ignores a trailing unpaired value", () => {
    expect(decodeRings([[], [10, 20], [10, 20, 1]], 10)).toEqual([]);
    expect(decodeRings([[10, 20, 1, 1, 7]], 10)).toEqual([
      [
        [2, 1],
        [2.1, 1.1],
      ],
    ]);
  });
});

describe("horizon land data", () => {
  const rings = decodeRings(HORIZON_LAND, HORIZON_LAND_SCALE);

  it("decodes to 162 rings and 4,063 points", () => {
    expect(HORIZON_LAND_SCALE).toBe(10);
    expect(HORIZON_LAND).toHaveLength(162);
    expect(rings).toHaveLength(162);
    expect(rings.reduce((sum, ring) => sum + ring.length, 0)).toBe(4063);
  });

  it("is the same geometry the earlier base-32 packing decoded to, point for point", () => {
    // SHA-256 of JSON.stringify(decodeRings(...)) taken from the base-32 varint
    // string this file replaced. Equal hashes mean every ring, every point and
    // both coordinates of each are unchanged, so the globe draws the same.
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(rings))
      .digest("hex");
    expect(fingerprint).toBe(
      "5825ea579453363e4cb24cb67e2e2cbd2ff4b1136ba395c1c6a25d1d4092491c",
    );
    expect(rings[0][0]).toEqual([-16.2, 180]);
    expect(rings[161].at(-1)).toEqual([83.6, -30]);
  });

  it("holds only integer pairs, with no repeated point and every point on the globe", () => {
    for (const deltas of HORIZON_LAND) {
      expect(deltas.length % 2).toBe(0);
      expect(deltas.every(Number.isSafeInteger)).toBe(true);
      for (let i = 2; i < deltas.length; i += 2) {
        expect(deltas[i] !== 0 || deltas[i + 1] !== 0).toBe(true);
      }
    }
    for (const ring of rings) {
      for (const [lat, lon] of ring) {
        expect(Math.abs(lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      }
    }
  });

  it("gives the publication scanner no base64-shaped run to flag", () => {
    const source = readFileSync(
      join(__dirname, "../../lib/horizon-land.ts"),
      "utf8",
    );
    const runs = source.match(GENERIC_BASE64_RE) ?? [];
    expect(runs.filter((run) => hasBase64SecretShape(run))).toEqual([]);
  });

  it("is exactly what scripts/extract-horizon-land.mjs writes", () => {
    const script = join(__dirname, "../../../scripts/extract-horizon-land.mjs");
    // --check exits 1 (and execFileSync throws) when the committed file is stale.
    const out = execFileSync(process.execPath, [script, "--check"], {
      encoding: "utf8",
    });
    expect(out).toContain("162 rings, 4063 points");
    expect(out).toContain("(up to date)");
  });
});
