/**
 * The phone hero's server-rendered globe frame and the geometry it shares
 * with the live globe (hero-network-geometry.ts).
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroGlobeFrame } from "./hero-globe-frame";
import {
  berlinComposition,
  CX,
  CY,
  initialShell,
  KUPFER,
  PHONE_VIEW,
  phoneComposition,
  R,
  relativePath,
} from "./hero-network-geometry";

/** Absolute points of a relative "M x,y l dx,dy ..." path, per sub-path. */
function absolute(d: string): Array<Array<readonly [number, number]>> {
  return d
    .split("M")
    .filter(Boolean)
    .map((part) => {
      const [head, tail = ""] = part.replace(/z$/, "").split("l");
      const [x0, y0] = head.split(",").map(Number);
      const deltas = (tail.match(/-?\d+/g) ?? []).map(Number);
      const points: Array<readonly [number, number]> = [[x0, y0]];
      let x = x0;
      let y = y0;
      for (let i = 0; i + 1 < deltas.length; i += 2) {
        x += deltas[i];
        y += deltas[i + 1];
        points.push([x, y]);
      }
      return points;
    });
}

describe("relativePath", () => {
  it("encodes whole-unit runs as one relative path and round-trips them", () => {
    const run = [
      [0, 0],
      [10, 5],
      [1, 9],
      [-2, 10],
      [-2, 11],
      [5, 5],
    ] as const;
    const d = relativePath([run]);
    expect(d).toBe("M0,0l10,5-9,4-3,1 0,1 7-6");
    expect(absolute(d)).toEqual([run.map(([x, y]) => [x, y])]);
    expect(relativePath([run], true).endsWith("z")).toBe(true);
  });
});

describe("the globe geometry", () => {
  it("keeps the Berlin composition on the front of the sphere", () => {
    const composition = berlinComposition();
    expect(composition.grid.front.length).toBeGreaterThan(40);
    expect(composition.grid.back.length).toBeGreaterThan(40);
    expect(composition.country.length).toBeGreaterThan(0);
    expect(composition.countryFill.every((seg) => seg.d.endsWith(" Z"))).toBe(
      true,
    );
    // Computed once per process.
    expect(berlinComposition()).toBe(composition);
  });

  it("thins the first-paint shell to a fraction of the full grid", () => {
    const shell = initialShell();
    const full = berlinComposition();
    expect(shell.grid.front.length).toBeLessThan(full.grid.front.length / 4);
    expect(shell.country.length).toBeGreaterThan(0);
  });

  it("crops the phone frame to its window and never leaves the sphere", () => {
    const frame = phoneComposition();
    expect(frame.grid.back).toHaveLength(0);
    for (const seg of [...frame.grid.front, ...frame.country]) {
      for (const run of absolute(seg.d)) {
        for (const [x, y] of run) {
          // A margin of one step outside the window at most.
          expect(x).toBeGreaterThan(PHONE_VIEW.x - 120);
          expect(x).toBeLessThan(PHONE_VIEW.x + PHONE_VIEW.width + 120);
          expect(y).toBeGreaterThan(PHONE_VIEW.y - 120);
          expect(y).toBeLessThan(PHONE_VIEW.y + PHONE_VIEW.height + 120);
          expect(Math.hypot(x - CX, y - CY)).toBeLessThanOrEqual(R + 1);
        }
      }
    }
    expect(frame.countryFill.every((seg) => seg.d.endsWith("z"))).toBe(true);
  });
});

describe("HeroGlobeFrame", () => {
  const html = renderToStaticMarkup(<HeroGlobeFrame />);

  it("server-renders the phone window of the line globe", () => {
    expect(html).toContain("data-home-globe-ssr");
    expect(html).toContain(
      `viewBox="${PHONE_VIEW.x} ${PHONE_VIEW.y} ${PHONE_VIEW.width} ${PHONE_VIEW.height}"`,
    );
    expect(html).toContain('preserveAspectRatio="xMidYMax slice"');
    expect(html).toContain(`stroke="${KUPFER}"`);
    expect(html).toContain('fill="url(#hf-hatch)"');
    expect(html).toContain('id="hf-volume"');
    // Ids never collide with the live globes (hn, hp).
    expect(html).not.toMatch(/id="(?!hf-)/);
  });

  it("stays a light first paint: whole units, relative paths, a byte budget", () => {
    expect(html).not.toMatch(/\d\.\d+,\d/);
    // The frame is serialized twice (HTML and the RSC payload): keep it small.
    expect(html.length).toBeLessThan(20_000);
  });

  it("carries no text and nothing focusable", () => {
    expect(html).not.toContain("<text");
    expect(html).toContain('focusable="false"');
  });
});
