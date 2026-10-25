import { describe, expect, it } from "vitest";
import { OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES } from "./artifacts";
import {
  autoplayAllowed,
  chapterIndexAt,
  nextToPlay,
  piecewise,
  rulerKeyTarget,
  valueText,
  viewportRatio,
  type PlateState,
} from "./specimen-clock";

const specimen = OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES.find(
  (artifact) => artifact.id === "tool:reelcode",
)?.guide.specimen;
if (specimen?.kind !== "film") throw new Error("reelcode specimen is a film");
const { chapters, endS } = specimen;

const plate = (overrides: Partial<PlateState>): PlateState => ({
  id: "a",
  number: 1,
  ratio: 1,
  played: false,
  userPaused: false,
  running: false,
  ...overrides,
});

describe("specimen clock", () => {
  it("finds the chapter at the start, on a boundary, between and at the end", () => {
    expect(chapterIndexAt(chapters, 0)).toBe(0);
    expect(chapterIndexAt(chapters, 2.5)).toBe(2);
    expect(chapterIndexAt(chapters, 2.49)).toBe(1);
    expect(chapterIndexAt(chapters, endS)).toBe(chapters.length - 1);
  });

  it("speaks the ruler position in both languages", () => {
    expect(valueText("de", chapters, 2.5, endS)).toBe(
      "Kapitel 3 von 8: slam, 2,5 s",
    );
    expect(valueText("en", chapters, 2.5, endS)).toBe(
      "Chapter 3 of 8: slam, 2.5 s",
    );
    expect(valueText("de", chapters, 99, endS)).toBe(
      "Kapitel 8 von 8: end, 15,2 s",
    );
    // A scrubbed second is spoken as held, not rounded to a tenth.
    expect(valueText("de", chapters, 2.75, endS)).toBe(
      "Kapitel 3 von 8: slam, 2,75 s",
    );
  });

  it("steps the ruler on the beat grid and always reaches the rest frame", () => {
    const key = (k: string, s: number) => rulerKeyTarget(k, s, 0.5, chapters, endS);
    // 15.2 s is not a whole number of 0.5 s beats: End and the last step
    // still land on the rest frame, and the way back finds the grid again.
    expect(key("End", 0)).toBe(endS);
    expect(key("ArrowRight", 15)).toBe(endS);
    expect(key("ArrowRight", endS)).toBe(endS);
    expect(key("ArrowLeft", endS)).toBe(15);
    // A scrubbed position off the grid steps to the neighbouring beats.
    expect(key("ArrowRight", 2.75)).toBe(3);
    expect(key("ArrowLeft", 2.75)).toBe(2.5);
    expect(key("ArrowLeft", 2.5)).toBe(2);
    expect(key("Home", 9)).toBe(0);
    expect(key("ArrowLeft", 0)).toBe(0);
    // Page keys: next chapter, the last one runs on to the rest frame;
    // back goes to the current chapter's start first.
    expect(key("PageDown", 2.75)).toBe(4.5);
    expect(key("PageDown", 14.2)).toBe(endS);
    expect(key("PageUp", 3.5)).toBe(2.5);
    expect(key("PageUp", 2.5)).toBe(1);
    expect(key("Tab", 3)).toBeNull();
  });

  it("hands autoplay to the most visible eligible plate, newest on a tie", () => {
    expect(
      nextToPlay([
        plate({ id: "half", ratio: 0.7 }),
        plate({ id: "full", ratio: 0.95 }),
        plate({ id: "low", ratio: 0.5 }),
      ]),
    ).toBe("full");
    expect(
      nextToPlay([
        plate({ id: "played", played: true }),
        plate({ id: "paused", userPaused: true }),
      ]),
    ).toBeNull();
    expect(
      nextToPlay([plate({ id: "busy", running: true }), plate({ id: "next" })]),
    ).toBeNull();
    expect(
      nextToPlay([
        plate({ id: "old", number: 1 }),
        plate({ id: "new", number: 2 }),
      ]),
    ).toBe("new");
    expect(
      nextToPlay([
        plate({ id: "old", number: 1, ratio: 0.89 }),
        plate({ id: "new", number: 2, ratio: 0.85 }),
      ]),
    ).toBe("new");
  });

  it("measures a stage taller than the free viewport against the viewport", () => {
    // 1440x900 laptop: a 708 px stage with 403 px in view used to read 0.57.
    expect(viewportRatio({ visible: 403, target: 708, root: 820 })).toBeCloseTo(0.57, 2);
    // Scrolled so the stage fills the free viewport: fully in view.
    expect(viewportRatio({ visible: 820, target: 900, root: 820 })).toBe(1);
    // A short stage still needs most of itself in view.
    expect(viewportRatio({ visible: 177, target: 368, root: 708 })).toBeCloseTo(0.48, 2);
    expect(viewportRatio({ visible: 0, target: 0, root: 708 })).toBe(0);
  });

  it("never autoplays for reduced motion, Save-Data or a hidden tab", () => {
    const base = { reducedMotion: false, saveData: false, hidden: false };
    expect(autoplayAllowed(base)).toBe(true);
    expect(autoplayAllowed({ ...base, reducedMotion: true })).toBe(false);
    expect(autoplayAllowed({ ...base, saveData: true })).toBe(false);
    expect(autoplayAllowed({ ...base, hidden: true })).toBe(false);
  });

  it("holds outside its keys and hits every key exactly", () => {
    const keys = [
      [0.2, 10],
      [0.5, 20],
      [0.8, 0],
    ] as const;
    expect(piecewise(keys, -1)).toBe(10);
    expect(piecewise(keys, 2)).toBe(0);
    for (const [p, v] of keys) expect(piecewise(keys, p)).toBe(v);
    expect(piecewise(keys, 0.35)).toBeCloseTo(15, 9);
  });
});
