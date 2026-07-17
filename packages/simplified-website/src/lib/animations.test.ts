/**
 * animations.test.ts (regression coverage)
 *
 * Exercises the shared Framer Motion variant library in `@/lib/animations`.
 * The file is pure data plus a handful of custom-index resolver functions: the
 * `visible` state of the staggered variants is a `(i = 0) => Variant` function
 * whose only real logic is computing `transition.delay = i * FACTOR`. Those
 * per-variant FACTORs (0.12, 0.1, 0.06, 0.15, 0.2) and durations are the
 * behaviour under test - they are hard-coded here as the golden spec so that a
 * change to the source constant fails, and the linear-scaling relation
 * (delay(0) = 0, delay(2) = 2 * delay(1)) is asserted formula-independently.
 *
 * `animations.ts` only imports a *type* from framer-motion, so nothing here
 * touches the motion runtime.
 */

import { describe, expect, it } from "vitest";
import {
  EASE_OUT_EXPO,
  revealUp,
  fadeUp,
  staggerContainer,
  staggerItem,
  tableRowReveal,
  drawLine,
  svgDrawOn,
  nodeAppear,
} from "@/lib/animations";

/** The resolved target-and-transition shape returned by a `visible` resolver. */
type Resolved = {
  transition: { delay: number; duration: number; ease: readonly number[] };
  [key: string]: unknown;
};

/** Narrow a `Variants["visible"]` entry (Variant | resolver) to its function form. */
const asResolver = (v: unknown) => v as (i?: number) => Resolved;

describe("EASE_OUT_EXPO", () => {
  it("is the Apple/Linear cubic-bezier control points", () => {
    expect(EASE_OUT_EXPO).toEqual([0.16, 1, 0.3, 1]);
  });

  it("is shared by reference across every staggered variant's transition", () => {
    // A single easing constant is reused - not copied - so all reveals share
    // one curve. Assert identity, not just value equality.
    expect(asResolver(revealUp.visible)(0).transition.ease).toBe(EASE_OUT_EXPO);
    expect(asResolver(fadeUp.visible)(0).transition.ease).toBe(EASE_OUT_EXPO);
    expect(asResolver(tableRowReveal.visible)(0).transition.ease).toBe(
      EASE_OUT_EXPO,
    );
    expect(asResolver(drawLine.visible)(0).transition.ease).toBe(EASE_OUT_EXPO);
    expect(asResolver(svgDrawOn.visible)(0).transition.ease).toBe(EASE_OUT_EXPO);
    expect(asResolver(nodeAppear.visible)(0).transition.ease).toBe(
      EASE_OUT_EXPO,
    );
  });
});

/**
 * Shared contract for the six function-form variants: their `visible` state is
 * a resolver whose delay scales linearly with the custom index. `factor` and
 * `duration` are the golden per-variant constants.
 */
const staggered: ReadonlyArray<{
  name: string;
  visible: unknown;
  factor: number;
  duration: number;
}> = [
  { name: "revealUp", visible: revealUp.visible, factor: 0.12, duration: 0.7 },
  { name: "fadeUp", visible: fadeUp.visible, factor: 0.1, duration: 0.6 },
  {
    name: "tableRowReveal",
    visible: tableRowReveal.visible,
    factor: 0.06,
    duration: 0.45,
  },
  { name: "drawLine", visible: drawLine.visible, factor: 0.15, duration: 0.8 },
  { name: "svgDrawOn", visible: svgDrawOn.visible, factor: 0.2, duration: 1.2 },
  { name: "nodeAppear", visible: nodeAppear.visible, factor: 0.12, duration: 0.5 },
];

describe.each(staggered)(
  "$name visible resolver",
  ({ visible, factor, duration }) => {
    it("is a custom-index resolver function, not a static target", () => {
      expect(typeof visible).toBe("function");
    });

    it("has zero delay at index 0", () => {
      expect(asResolver(visible)(0).transition.delay).toBeCloseTo(0, 8);
    });

    it("defaults the index to 0 when called with no argument", () => {
      expect(asResolver(visible)().transition.delay).toBeCloseTo(0, 8);
    });

    it("delays index 1 by exactly one stagger factor", () => {
      expect(asResolver(visible)(1).transition.delay).toBeCloseTo(factor, 8);
    });

    it("scales the delay linearly with the index (index 2 = 2x)", () => {
      const one = asResolver(visible)(1).transition.delay;
      const two = asResolver(visible)(2).transition.delay;
      expect(two).toBeCloseTo(2 * factor, 8);
      expect(two).toBeCloseTo(2 * one, 8);
    });

    it("keeps a constant duration regardless of the index", () => {
      expect(asResolver(visible)(0).transition.duration).toBe(duration);
      expect(asResolver(visible)(5).transition.duration).toBe(duration);
    });
  },
);

describe("revealUp clip-path target fields", () => {
  it("hidden clips the element fully from the bottom", () => {
    expect(revealUp.hidden).toEqual({
      clipPath: "inset(0 0 100% 0)",
      y: 8,
    });
  });

  it("visible ends with a negative bottom inset so descenders are not clipped", () => {
    const out = asResolver(revealUp.visible)(1);
    expect(out.clipPath).toBe("inset(0 0 -0.3em 0)");
    expect(out.y).toBe(0);
  });
});

describe("fadeUp target fields", () => {
  it("hidden starts transparent and offset down", () => {
    expect(fadeUp.hidden).toEqual({ opacity: 0, y: 20 });
  });

  it("visible resolves to opaque and settled", () => {
    const out = asResolver(fadeUp.visible)(3);
    expect(out.opacity).toBe(1);
    expect(out.y).toBe(0);
    expect(out.transition.delay).toBeCloseTo(0.3, 8);
  });
});

describe("staggerContainer (static variant)", () => {
  it("hidden is an empty target", () => {
    expect(staggerContainer.hidden).toEqual({});
  });

  it("visible orchestrates children via stagger + delay children timings", () => {
    expect(staggerContainer.visible).toEqual({
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    });
  });
});

describe("staggerItem (static variant)", () => {
  it("hidden starts transparent and offset down", () => {
    expect(staggerItem.hidden).toEqual({ opacity: 0, y: 16 });
  });

  it("visible resolves to a fixed target and transition (no index dependence)", () => {
    expect(typeof staggerItem.visible).toBe("object");
    expect(staggerItem.visible).toEqual({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    });
  });
});

describe("tableRowReveal target fields", () => {
  it("hidden slides in from the left", () => {
    expect(tableRowReveal.hidden).toEqual({ opacity: 0, x: -8 });
  });

  it("visible settles to x:0 and full opacity", () => {
    const out = asResolver(tableRowReveal.visible)(2);
    expect(out.opacity).toBe(1);
    expect(out.x).toBe(0);
    expect(out.transition.delay).toBeCloseTo(0.12, 8);
  });
});

describe("drawLine target fields", () => {
  it("hidden collapses scaleX to 0", () => {
    expect(drawLine.hidden).toEqual({ scaleX: 0 });
  });

  it("visible grows scaleX to 1", () => {
    const out = asResolver(drawLine.visible)(2);
    expect(out.scaleX).toBe(1);
    expect(out.transition.delay).toBeCloseTo(0.3, 8);
  });
});

describe("svgDrawOn target fields", () => {
  it("hidden hides the path with zero pathLength and opacity", () => {
    expect(svgDrawOn.hidden).toEqual({ pathLength: 0, opacity: 0 });
  });

  it("visible strokes the full path in", () => {
    const out = asResolver(svgDrawOn.visible)(3);
    expect(out.pathLength).toBe(1);
    expect(out.opacity).toBe(1);
    expect(out.transition.delay).toBeCloseTo(0.6, 8);
  });
});

describe("nodeAppear target fields", () => {
  it("hidden starts scaled down and transparent", () => {
    expect(nodeAppear.hidden).toEqual({ opacity: 0, scale: 0.8 });
  });

  it("visible pops to full scale and opacity", () => {
    const out = asResolver(nodeAppear.visible)(2);
    expect(out.scale).toBe(1);
    expect(out.opacity).toBe(1);
    expect(out.transition.delay).toBeCloseTo(0.24, 8);
  });
});
