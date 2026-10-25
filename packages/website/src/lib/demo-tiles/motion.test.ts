import { describe, expect, it } from "vitest";
import { compileAllCss, compileSceneCss, easeAt, sample } from "./motion";
import { tileNumber } from "./format";
import type { TileMotion, Track } from "./types";

const grow: Track = {
  id: "bar",
  prop: "sy",
  origin: "50% 100%",
  keys: [
    [0, 0],
    [0.5, 1, "ease"],
    [1, 1],
  ],
};

describe("tile motion sampling", () => {
  it("is a pure function of progress: clamped, monotone between keys, equal at the ends", () => {
    expect(sample(grow, -1)).toBe(0);
    expect(sample(grow, 0)).toBe(0);
    expect(sample(grow, 0.25)).toBeGreaterThan(0);
    expect(sample(grow, 0.25)).toBeLessThan(1);
    expect(sample(grow, 0.5)).toBe(1);
    expect(sample(grow, 2)).toBe(1);
    expect(sample(grow, 0.3)).toBe(sample(grow, 0.3));
  });

  it("keeps linear easing linear and lets snap overshoot", () => {
    expect(easeAt("linear", 0.37)).toBeCloseTo(0.37, 6);
    expect(easeAt("ease", 0)).toBeCloseTo(0, 6);
    expect(easeAt("ease", 1)).toBeCloseTo(1, 4);
    expect(Math.max(...Array.from({ length: 101 }, (_, step) => easeAt("snap", step / 100)))).toBeGreaterThan(1);
  });

  it("rejects a track with one key, a duplicate prop and groups with different key times", () => {
    const motion = (tracks: readonly Track[]): TileMotion => ({ storyMs: 3000, tracks });
    expect(() => compileSceneCss("t", motion([{ id: "a", prop: "o", keys: [[0, 1]] }]))).toThrow(/two keys/);
    const o: Track = { id: "a", prop: "o", keys: [[0, 0], [1, 1]] };
    expect(() => compileSceneCss("t", motion([o, o]))).toThrow(/twice/);
    const tx: Track = { id: "a", prop: "tx", keys: [[0, 0], [1, 5]] };
    const ty: Track = { id: "a", prop: "ty", keys: [[0, 0], [0.5, 2], [1, 5]] };
    expect(() => compileSceneCss("t", motion([tx, ty]))).toThrow(/same key times/);
  });
});

describe("tile css compilation", () => {
  const motion: TileMotion = {
    storyMs: 3200,
    tracks: [
      { id: "a", prop: "tx", keys: [[0, 10], [0.5, 0, "ease"]] },
      { id: "a", prop: "ty", keys: [[0, 4], [0.5, 0, "ease"]] },
      { id: "a", prop: "o", keys: [[0, 0], [1, 1]] },
      grow,
    ],
  };
  const css = compileSceneCss("w9", motion);

  it("emits the last key as the base style, outside the motion media query", () => {
    const [base] = css.split("@media");
    expect(base).toContain('[data-t="a"] { translate: 0px 0px; opacity: 1; }');
    expect(base).toContain("scale: 1 1; transform-box: fill-box; transform-origin: 50% 100%;");
    expect(base).toContain("--tile-t: 3200ms");
  });

  it("merges tx and ty into one translate animation and keeps every keyframe in the media query", () => {
    expect(css.match(/@keyframes dt-w9-a-translate/g)).toHaveLength(1);
    expect(css).toContain("0% { translate: 10px 4px;");
    const media = css.slice(css.indexOf("@media"));
    expect(media.match(/@keyframes/g)).toHaveLength(css.match(/@keyframes/g)?.length ?? -1);
    expect(css).toContain("@media screen and (prefers-reduced-motion: no-preference)");
    // The finished frame is also the last keyframe, so a partial story still ends on it.
    expect(css).toMatch(/100% \{ opacity: 1; \}/);
  });

  it("is deterministic", () => {
    expect(compileSceneCss("w9", motion)).toBe(css);
    expect(compileAllCss([{ scene: "w9", motion }])).toBe(compileAllCss([{ scene: "w9", motion }]));
  });
});

describe("tile figures", () => {
  it("formats per locale with a real minus sign", () => {
    expect(tileNumber(1050, "de")).toBe("1.050");
    expect(tileNumber(1050, "en")).toBe("1,050");
    expect(tileNumber(-320, "de")).toBe("−320");
    expect(tileNumber(0.8, "de", { digits: 1, sign: true })).toBe("+0,8");
    expect(tileNumber(0.8, "en", { digits: 1, sign: true })).toBe("+0.8");
    expect(tileNumber(-19960, "en")).toBe("−19,960");
  });
});
