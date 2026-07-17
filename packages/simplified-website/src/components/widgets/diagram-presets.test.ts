import { describe, expect, it } from "vitest";
import {
  OBLIGATION_LAYER_NODES,
  RISK_PYRAMID_NODES,
} from "./diagram-presets";

/**
 * diagram-presets.test.ts (regression coverage)
 *
 * Structural contract for the pre-filled EU-AI-Act diagram data that feeds the
 * RiskPyramid + ObligationLayers preset widgets. We assert the invariants the
 * InteractiveDiagram animation relies on (unique ids, strictly descending
 * weights within (0,1], populated labels, the LayerCake detail+consequence
 * pair) rather than the German copy, so a wording refresh keeps the test green.
 * A guard for stray em/en dashes is included because these strings ship to the
 * reader (content:lint enforces the same rule repo-wide).
 */

// En dash (U+2013) and em dash (U+2014), referenced by code point so this
// test file itself stays dash-clean.
const DASH_RE = new RegExp("[\\u2013\\u2014]");

function isDescending(weights: readonly number[]): boolean {
  return weights.every((w, i) => i === 0 || w < weights[i - 1]);
}

describe("RISK_PYRAMID_NODES", () => {
  it("carries the four EU AI Act risk tiers in order, highest risk first", () => {
    expect(RISK_PYRAMID_NODES.map((n) => n.id)).toEqual([
      "verboten",
      "hochrisiko",
      "transparenz",
      "minimal",
    ]);
  });

  it("has strictly descending weights within (0, 1]", () => {
    const weights = RISK_PYRAMID_NODES.map((n) => n.weight ?? 0);
    expect(isDescending(weights)).toBe(true);
    for (const w of weights) {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it("gives every tier a non-empty label and sub-line", () => {
    for (const node of RISK_PYRAMID_NODES) {
      expect(node.label.trim().length).toBeGreaterThan(0);
      expect((node.sub ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("OBLIGATION_LAYER_NODES", () => {
  it("has unique ids", () => {
    const ids = OBLIGATION_LAYER_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has strictly descending weights within (0, 1]", () => {
    const weights = OBLIGATION_LAYER_NODES.map((n) => n.weight ?? 0);
    expect(isDescending(weights)).toBe(true);
    for (const w of weights) {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it("gives every layer the LayerCake detail + consequence pair", () => {
    for (const node of OBLIGATION_LAYER_NODES) {
      expect(node.label.trim().length).toBeGreaterThan(0);
      expect((node.detail ?? "").trim().length).toBeGreaterThan(0);
      expect((node.consequence ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("diagram preset copy", () => {
  it("contains no em or en dashes", () => {
    const allText = [...RISK_PYRAMID_NODES, ...OBLIGATION_LAYER_NODES]
      .flatMap((n) => [n.label, n.sub, n.detail, n.consequence])
      .filter((s): s is string => typeof s === "string");
    for (const text of allText) {
      expect(text).not.toMatch(DASH_RE);
    }
  });
});
