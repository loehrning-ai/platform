/**
 * The phone hero's one-time signal from Berlin: geometry and markup.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HeroSignalFrame,
  signalArcs,
  signalOrigin,
} from "./hero-signal-frame";
import { CX, CY, PHONE_VIEW, R } from "./hero-network-geometry";

describe("signal geometry", () => {
  it("connects Berlin to peer nodes inside the phone window", () => {
    const [ox, oy] = signalOrigin();
    const arcs = signalArcs();
    expect(arcs).toHaveLength(10);
    for (const arc of arcs) {
      expect(arc.d.startsWith(`M${ox},${oy}L`)).toBe(true);
      const [ex, ey] = arc.end;
      expect(ex).toBeGreaterThan(PHONE_VIEW.x);
      expect(ex).toBeLessThan(PHONE_VIEW.x + PHONE_VIEW.width);
      expect(ey).toBeGreaterThan(PHONE_VIEW.y);
      expect(ey).toBeLessThan(PHONE_VIEW.y + PHONE_VIEW.height);
    }
  });

  it("keeps each sampled connection on the projected globe surface", () => {
    for (const arc of signalArcs()) {
      const points = [...arc.d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)];
      expect(points).toHaveLength(25);
      for (const [, x, y] of points) {
        expect(Math.hypot(Number(x) - CX, Number(y) - CY)).toBeLessThanOrEqual(R + 0.1);
      }
      expect(arc.d.endsWith(`L${arc.end[0]},${arc.end[1]}`)).toBe(true);
    }
  });
});

describe("HeroSignalFrame", () => {
  it("shares the globe frame's viewBox and slice, and carries no text", () => {
    const html = renderToStaticMarkup(<HeroSignalFrame />);
    expect(html).toContain(
      `viewBox="${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}"`,
    );
    expect(html).toContain('preserveAspectRatio="xMidYMax slice"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain("data-home-signals");
    expect(html).not.toMatch(/<text|<a |<button/);
    // Persistent links and fixed nodes; no travelling heads or impact rings.
    expect(html.match(/class="sig-arc"/g)).toHaveLength(10);
    expect(html).not.toMatch(/sig-comet|sig-land|sig-ring|pathLength/);
    expect(html.match(/class="sig-line"/g)).toHaveLength(10);
    expect(html.match(/class="sig-node"/g)).toHaveLength(10);
    expect(html).toContain("--sig-i:9");
  });

  it("stays small: a few kilobytes of server HTML", () => {
    const html = renderToStaticMarkup(<HeroSignalFrame />);
    expect(html.length).toBeLessThan(6000);
  });
});
