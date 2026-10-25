import { describe, expect, it } from "vitest";
import {
  CV_ENGINE_BARS,
  CV_ENGINE_JUMP_CQW,
  CV_ENGINE_REST_FRAME,
  CV_ENGINE_TOY_P,
  EXTRA_ROW,
  ROW_STEP,
  YAML_ROWS,
  cvEngineFrame,
} from "./cv-engine-frame";

const spilled = CV_ENGINE_BARS.map((bar, j) => ({ bar, j })).filter(
  ({ bar }) => bar.role === "spill" || bar.role === "spillHead",
);
const translateX = (transform = "") =>
  Number(/translate\(([-\d.]+)cqw/.exec(transform)?.[1]);
const translateY = (transform = "") =>
  Number(/translate\([-\d.]+cqw,([-\d.]+)cqw/.exec(transform)?.[1]);

describe("CV Engine stage frames", () => {
  it("is a pure function of progress whose end is the server's rest frame", () => {
    expect(cvEngineFrame(1)).toEqual(CV_ENGINE_REST_FRAME);
    expect(cvEngineFrame(0).bar0).not.toEqual(cvEngineFrame(1).bar0);
  });

  it("tells a true story: the insert overflows the page, the tight layout fits", () => {
    const last = spilled[spilled.length - 1].bar;
    expect(last.full).toBeLessThan(0.94);
    expect(last.pushed + 0.024).toBeGreaterThan(0.94);
    expect(last.tight + 0.024).toBeLessThan(0.94);
  });

  it("opens on the data, not on an empty stage, and shows no page count before ink", () => {
    const first = cvEngineFrame(0);
    expect(first.row0.opacity).toBeGreaterThan(0);
    expect(first.badge1.opacity).toBe(0);
    expect(first.badge2.opacity).toBe(0);
    // Ink reaches the sheet within half a second of a 7 s take.
    const inked = cvEngineFrame(0.5 / 7);
    expect(inked.bar0.transform).not.toMatch(/scaleX\(0\.0000\)/);
  });

  it("draws page two only while the build overflows", () => {
    for (const p of [0, 0.3, 0.95, 1]) {
      expect(cvEngineFrame(p).tray.opacity).toBe(0);
      expect(cvEngineFrame(p).sheet2.opacity).toBe(0);
    }
    expect(cvEngineFrame(CV_ENGINE_TOY_P).tray.opacity).toBe(1);
  });

  it("holds two pages and the stopped build at the toy position", () => {
    const frame = cvEngineFrame(CV_ENGINE_TOY_P);
    expect(frame.badge2.opacity).toBe(1);
    expect(frame.badge1.opacity).toBe(0);
    expect(frame.exit1.opacity).toBe(1);
    expect(frame.sheet2.opacity).toBe(1);
    for (const { j } of spilled) {
      expect(translateX(frame[`bar${j}`].transform)).toBeCloseTo(CV_ENGINE_JUMP_CQW, 3);
    }
  });

  it("inserts the new station mid-file: the rows below make room, it stays Mennige while two pages show", () => {
    const below = `row${EXTRA_ROW + 1}`;
    const last = `row${YAML_ROWS.length - 1}`;
    const first = cvEngineFrame(0);
    expect(first[`row${EXTRA_ROW}`].opacity).toBe(0);
    expect(translateY(first[below].transform)).toBe(-ROW_STEP);
    expect(translateY(first[last].transform)).toBe(-ROW_STEP);
    expect(first.band.opacity).toBe(0);
    const toy = cvEngineFrame(CV_ENGINE_TOY_P);
    expect(toy[`row${EXTRA_ROW}`].opacity).toBe(1);
    expect(translateY(toy[below].transform)).toBe(0);
    expect(toy.band.opacity).toBe(1);
    expect(toy.band.transform).toBe("scaleX(1.0000)");
    expect(toy.hotValue.opacity).toBe(1);
    // Fixed: one page again, the row is ordinary data.
    expect(CV_ENGINE_REST_FRAME.band.opacity).toBe(0);
    expect(CV_ENGINE_REST_FRAME.hotValue.opacity).toBe(0);
    expect(translateY(CV_ENGINE_REST_FRAME[below].transform)).toBe(0);
  });

  it("brings the spilled section home to page one at rest", () => {
    expect(CV_ENGINE_REST_FRAME.sheet2.opacity).toBe(0);
    for (const { j } of spilled) {
      expect(translateX(CV_ENGINE_REST_FRAME[`bar${j}`].transform)).toBe(0);
    }
  });
});
