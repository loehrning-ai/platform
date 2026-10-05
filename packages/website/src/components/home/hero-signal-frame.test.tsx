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
import { PHONE_VIEW } from "./hero-network-geometry";

describe("signal geometry", () => {
  it("starts every arc at Berlin and lands it inside the phone window", () => {
    const [ox, oy] = signalOrigin();
    const arcs = signalArcs();
    expect(arcs).toHaveLength(10);
    for (const arc of arcs) {
      expect(arc.d.startsWith(`M${ox},${oy}Q`)).toBe(true);
      const [ex, ey] = arc.end;
      expect(ex).toBeGreaterThan(PHONE_VIEW.x);
      expect(ex).toBeLessThan(PHONE_VIEW.x + PHONE_VIEW.width);
      expect(ey).toBeGreaterThan(PHONE_VIEW.y);
      expect(ey).toBeLessThan(PHONE_VIEW.y + PHONE_VIEW.height);
    }
  });

  it("bows every arc to the upper side of its chord", () => {
    const [ox, oy] = signalOrigin();
    for (const arc of signalArcs()) {
      const match = /Q(-?[\d.]+),(-?[\d.]+) /.exec(arc.d);
      expect(match).not.toBeNull();
      const cy = Number(match?.[2]);
      const midY = (oy + arc.end[1]) / 2;
      // Upward (smaller y) or, for an arc that runs straight up, level.
      expect(cy).toBeLessThanOrEqual(midY + 0.05 * Math.hypot(arc.end[0] - ox, arc.end[1] - oy));
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
    // One staggered group per arc, each with its line, light and node.
    expect(html.match(/class="sig-arc"/g)).toHaveLength(10);
    expect(html.match(/class="sig-comet"/g)).toHaveLength(10);
    expect(html.match(/class="sig-node"/g)).toHaveLength(10);
    expect(html).toContain("--sig-i:9");
  });

  it("stays small: a few kilobytes of server HTML", () => {
    const html = renderToStaticMarkup(<HeroSignalFrame />);
    expect(html.length).toBeLessThan(6000);
  });
});
