import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/figures/palette";
import { PLAKAT, type PlakatKey } from "@/lib/plakat/palettes";
import {
  GLAS_LIVE_BUDGET,
  GLAS_MATERIALS,
  GLAS_MAX_BLUR,
  GLAS_POOLS,
  GLAS_PROOFS,
  GLAS_RADIUS,
  glasAllPaints,
  glasToneFor,
  innerRadius,
  plateAlpha,
  poolComposite,
  worstGlasContrast,
} from "./glas";
import { GLAS_EASE_CSS, GLAS_SPRINGS, isSettled, springProfile, stepSpring } from "./glas-motion";

const SRC = join(__dirname, "..");
const GLAS_CSS = readFileSync(join(SRC, "components/demos/glas/glas.css"), "utf8");

function cssNumber(name: string): number {
  const match = new RegExp(`${name}:\\s*([0-9.]+)`).exec(GLAS_CSS);
  if (!match) throw new Error(`${name} missing in glas.css`);
  return Number(match[1]);
}

describe("Glas materials (glass-spec 2)", () => {
  it("proves every text colour on every material against every palette's worst paint, blur never credited", () => {
    const paints = glasAllPaints();
    for (const proof of GLAS_PROOFS) {
      const worst = worstGlasContrast(proof.colour, proof.tone, proof.material, paints);
      expect(worst, `${proof.role} on ${proof.tone} ${proof.material}`).toBeGreaterThanOrEqual(proof.floor);
    }
  });

  it("composites rim plus plate to the proven text alpha", () => {
    for (const tone of ["hell", "dunkel"] as const) {
      for (const material of ["regular", "thick"] as const) {
        const spec = GLAS_MATERIALS[tone][material];
        const plate = plateAlpha(spec);
        expect(1 - (1 - spec.rim) * (1 - plate)).toBeCloseTo(spec.text, 6);
      }
      expect(plateAlpha(GLAS_MATERIALS[tone].thin)).toBe(0);
    }
  });

  it("keeps the alphas in glas.css in lockstep with glas.ts", () => {
    for (const tone of ["hell", "dunkel"] as const) {
      for (const material of ["clear", "thin", "regular", "thick"] as const) {
        expect(cssNumber(`--glas-a-${tone}-${material}`), `${tone} ${material}`).toBe(GLAS_MATERIALS[tone][material].text);
      }
      expect(cssNumber(`--glas-a-${tone}-rim`)).toBe(GLAS_MATERIALS[tone].regular.rim);
    }
    const plates = [...GLAS_CSS.matchAll(/--glas-plate-(regular|thick):\s*([0-9.]+)/g)].map((match) => Number(match[2]));
    expect(plates).toHaveLength(4);
    const want = (["hell", "dunkel"] as const).flatMap((tone) => (["regular", "thick"] as const).map((material) => plateAlpha(GLAS_MATERIALS[tone][material])));
    plates.forEach((plate, index) => expect(plate).toBeCloseTo(want[index] as number, 3));
  });

  it("never blurs beyond 28px and never animates a filter", () => {
    for (const tone of ["hell", "dunkel"] as const) {
      for (const spec of Object.values(GLAS_MATERIALS[tone])) expect(spec.blur).toBeLessThanOrEqual(GLAS_MAX_BLUR);
    }
    expect(GLAS_CSS).not.toMatch(/transition[^;]*backdrop|@keyframes[^}]*backdrop/);
  });

  it("keeps the live budget at 3 on a phone and 5 on a desktop", () => {
    expect(GLAS_LIVE_BUDGET).toEqual({ phone: 3, desktop: 5 });
  });

  it("nests corners concentrically, never below 10px", () => {
    expect(innerRadius(GLAS_RADIUS.stage, 12)).toBe(24);
    expect(innerRadius(16, 12)).toBe(10);
  });
});

describe("Glas field (glass-spec 3)", () => {
  it("keeps the palette ink readable over every pool at its alpha", () => {
    for (const [plakat, pools] of Object.entries(GLAS_POOLS) as [PlakatKey, (typeof GLAS_POOLS)[PlakatKey]][]) {
      for (const pool of pools) {
        expect(contrastRatio(PLAKAT[plakat].ink, poolComposite(plakat, pool)), `${plakat} ${pool.colour}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("picks the glass tone from the ground statically", () => {
    for (const plakat of Object.keys(GLAS_POOLS) as PlakatKey[]) expect(["hell", "dunkel"]).toContain(glasToneFor(plakat));
  });
});

describe("Glas motion (glass-spec 5)", () => {
  it("settles each spring near its CSS twin and overshoots only where it may", () => {
    const quick = springProfile(GLAS_SPRINGS.quick);
    const smooth = springProfile(GLAS_SPRINGS.smooth);
    const bouncy = springProfile(GLAS_SPRINGS.bouncy);
    const follow = springProfile(GLAS_SPRINGS.follow);
    expect(follow.settleMs).toBeLessThan(250);
    expect(Math.abs(quick.settleMs - GLAS_EASE_CSS.quick.ms)).toBeLessThan(80);
    expect(Math.abs(smooth.settleMs - GLAS_EASE_CSS.smooth.ms)).toBeLessThan(80);
    expect(Math.abs(bouncy.settleMs - GLAS_EASE_CSS.bouncy.ms)).toBeLessThan(80);
    // Numbers ride smooth: it never passes its value.
    expect(smooth.overshoot).toBeLessThan(0.001);
    expect(quick.overshoot).toBeLessThan(0.01);
    expect(bouncy.overshoot).toBeGreaterThan(0.02);
    expect(bouncy.overshoot).toBeLessThan(0.06);
  });

  it("starts from the current velocity, so a drag can interrupt it", () => {
    const moving = stepSpring({ value: 0, velocity: 5 }, 0, GLAS_SPRINGS.smooth, 16);
    expect(moving.value).toBeGreaterThan(0);
    expect(isSettled({ value: 1.0005, velocity: 0 }, 1, 1)).toBe(true);
    expect(isSettled({ value: 0.9, velocity: 0 }, 1, 1)).toBe(false);
  });

  it("writes every CSS curve as 25 samples from 0 to 1", () => {
    for (const { curve } of Object.values(GLAS_EASE_CSS)) {
      const values = curve.replace(/^linear\(|\)$/g, "").split(",").map(Number);
      expect(values).toHaveLength(25);
      expect(values[0]).toBe(0);
      expect(values.at(-1)).toBe(1);
    }
  });
});

describe("Glas stays inside the demos", () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path, out);
      else if (/\.(css|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
    }
    return out;
  }

  it("uses --glas- tokens and [data-glas] only in the demo routes, the demo components and src/lib/glas*", () => {
    const allowed = /^(?:app\/demos\/|components\/demos\/|lib\/glas(?:-motion)?\.ts$|lib\/demo-cases\/)/;
    const offenders = walk(SRC)
      .map((path) => ({ file: relative(SRC, path), text: readFileSync(path, "utf8") }))
      .filter(({ file, text }) => !allowed.test(file) && /--glas-|\[data-glas\]|data-glas=/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
