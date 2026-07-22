// ─── Data Science sim-kit: pure math/RNG helpers ──
//
// Typed port of `src/v8/shared.js`'s non-React exports, replacing the
// source's `window.X` global-export pattern (a plain-script, no-bundler
// convention) with named exports/imports. `mulberry32`/`randn` back every
// seeded simulator (`GaltonSim` seed 42, `ThresholdSim` seed 7) — the exact
// bitwise algorithm is preserved unchanged so both sims reproduce the same
// seeded layout on first paint.

/** Deterministic PRNG factory, seeded — never reseed or swap for Math.random(). */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function (): number {
    a |= 0;
    a = (a + 1831565813) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal sample via Box-Muller, driven by the given RNG. */
export function randn(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function round(v: number, d = 2): number {
  return Math.round(v * 10 ** d) / 10 ** d;
}

/** Abramowitz-Stegun approximation of the standard normal CDF. */
export function normCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const az = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * az);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-az * az);
  return 0.5 * (1 + sign * y);
}

/** Inverse standard normal CDF (Acklam-style rational approximation). */
export function normInv(p: number): number {
  if (p < 0.5) return -normInv(1 - p);
  const c = [2.515517, 0.802853, 0.010328];
  const d = [1.432788, 0.189269, 1308e-6];
  const t = Math.sqrt(-2 * Math.log(1 - p));
  return t - (c[0] + c[1] * t + c[2] * t * t) / (1 + d[0] * t + d[1] * t * t + d[2] * t * t * t);
}

/**
 * Bright-palette -> AA-readable ink twin, for using a data-driven accent
 * color as TEXT on the light paper. Keep the bright original for SVG
 * fills/dots/borders. Ported verbatim from source — this remap is the sole
 * guard against precision/recall/AUC stat labels rendering as low-contrast
 * bright color on white.
 */
export const INK_MAP: Record<string, string> = {
  "#FF6B80": "#B53C4D",
  "#D1FF3A": "#59700D",
  "#1FAF7E": "#067751",
  "#E8A031": "#905D0D",
  "#FF4DA2": "#C22671",
  "#64E2B5": "#297359",
  "#5B9BE8": "#346AAC",
  "#A78BFA": "#7159B6",
  "#FF9F6B": "#995733",
  "#9A6BFF": "#7749DB",
  "#4DE2FF": "#1A7182",
  "#1CA5D9": "#00709A",
  "#6BCF3F": "#347618",
  "#FB923C": "#A15314",
  "#F87171": "#B34343",
  "#F25F3A": "#BD3918",
  "#4ADE80": "#1C783E",
  "#2DD4BF": "#0B7567",
  "#FFC266": "#856029",
  "#FF8080": "#AB4949",
  "#F4C542": "#816515",
  "#FFA94D": "#945B1D",
  "#FFA500": "#915E00",
  "#FF6B6B": "#B83D3D",
  "#FBBF24": "#886202",
  "#F59E0B": "#935C00",
  "#EF4444": "#C92424",
  "#B89DFF": "#715CA6",
  "#7B8CDE": "#5464AD",
  "#80CC80": "#427442",
  "#8080CC": "#6161A9",
  "#E8318F": "#C8136F",
  "#D83A3A": "#CB2020",
  "#5B3EE8": "#4A2FCC",
  // muted grays that were authored light for a dark theme — map to readable ink
  "#8A8680": "#5C5650",
  "#C7C4BC": "#5C5650",
  "#F4F2EC": "#3A3540",
  "#A49D9A": "#6E6763",
  "#D1D5DB": "#5C5650",
  "#F1F5F9": "#3A3540",
  "#E0E0E0": "#5C5650",
};

export function inkOf<T extends string | null | undefined>(c: T): T | string {
  if (!c) return c;
  return INK_MAP[c.toUpperCase()] || c;
}
