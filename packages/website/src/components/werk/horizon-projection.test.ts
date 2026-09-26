import { describe, expect, it } from "vitest";
import {
  BERLIN,
  HORIZON,
  HORIZON_ROUTE,
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
