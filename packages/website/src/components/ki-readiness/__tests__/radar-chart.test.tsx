import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RadarChart, type RadarDimension } from "../radar-chart";

type DimensionId =
  | "datenfundament"
  | "technologie"
  | "organisation"
  | "strategie"
  | "compliance";

function dim(id: DimensionId, rawScore: number): RadarDimension {
  return {
    nameDe: id,
    rawScore,
  };
}

const FIVE_DIMS: readonly RadarDimension[] = [
  dim("datenfundament", 10),
  dim("technologie", 12),
  dim("organisation", 8),
  dim("strategie", 14),
  dim("compliance", 6),
];

describe("RadarChart", () => {
  it("renders an SVG with one root <svg> tag", () => {
    const { container } = render(<RadarChart dimensions={FIVE_DIMS} />);
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("draws 4 grid polygons (LEVELS constant)", () => {
    const { container } = render(<RadarChart dimensions={FIVE_DIMS} />);
    expect(container.querySelectorAll("polygon").length).toBeGreaterThanOrEqual(4);
  });

  it("draws an axis <line> per dimension (n = 5)", () => {
    const { container } = render(<RadarChart dimensions={FIVE_DIMS} />);
    expect(container.querySelectorAll("line").length).toBe(5);
  });

  it("renders a label for every dimension", () => {
    const { container } = render(<RadarChart dimensions={FIVE_DIMS} />);
    const texts = Array.from(container.querySelectorAll("text"));
    expect(texts.length).toBe(5);
    expect(container.textContent).toMatch(/datenfundament/);
    expect(container.textContent).toMatch(/compliance/);
  });

  it("handles all-minimum scores (rawScore = 4 → 0% radius) without crashing", () => {
    const minDims: RadarDimension[] = FIVE_DIMS.map((d) => ({ ...d, rawScore: 4 }));
    expect(() => render(<RadarChart dimensions={minDims} />)).not.toThrow();
  });

  it("handles all-maximum scores (rawScore = 16) without crashing", () => {
    const maxDims: RadarDimension[] = FIVE_DIMS.map((d) => ({ ...d, rawScore: 16 }));
    expect(() => render(<RadarChart dimensions={maxDims} />)).not.toThrow();
  });

  it("does not produce NaN coordinates in any rendered points attribute", () => {
    const { container } = render(<RadarChart dimensions={FIVE_DIMS} />);
    const polygons = container.querySelectorAll("polygon");
    for (const p of polygons) {
      const points = p.getAttribute("points") ?? "";
      expect(points).not.toMatch(/NaN/);
    }
  });
});
