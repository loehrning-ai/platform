/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

/**
 * pulsing-dot.test.tsx (regression coverage)
 *
 * Guards the REAL exported <PulsingDot />. The branching contract:
 *   - `immediate` OR reduced motion -> a single static <circle> (opacity 0.8)
 *   - full motion                   -> two <m.circle>s: the pulsing core plus a
 *                                      glow ring of radius r*2 (fill "none",
 *                                      stroked in the dot color)
 * The static branch exists because the infinite r/opacity loop bypasses
 * MotionConfig reducedMotion="user", so the component must degrade itself.
 *
 * framer-motion is mocked to bare SVG elements; useReducedMotion is driven off a
 * hoisted flag so both branches are reachable. Under the mock the animated core
 * circle loses its r (animated) while the ring keeps its static r*2 attribute,
 * which is exactly what we assert against.
 */

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const make = (tag: any): React.ElementType =>
    React.forwardRef(function MotionMock(props: any, ref: any) {
      const { initial, animate, transition, variants, custom, children, ...rest } =
        props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  const m: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === "symbol") return undefined;
        return make(prop as string);
      },
    },
  );
  const Pass = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    m,
    motion: m,
    useReducedMotion: () => motionState.reduced,
    LazyMotion: Pass,
    MotionConfig: Pass,
    domAnimation: {},
  };
});

import { PulsingDot } from "./pulsing-dot";

beforeEach(() => {
  motionState.reduced = false;
});
afterEach(() => {
  cleanup();
});

describe("<PulsingDot> static branch", () => {
  it("renders one static circle at 0.8 opacity when immediate", () => {
    const { container } = render(<PulsingDot cx={12} cy={34} immediate />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    const c = circles[0];
    expect(c.getAttribute("cx")).toBe("12");
    expect(c.getAttribute("cy")).toBe("34");
    expect(c.getAttribute("opacity")).toBe("0.8");
    // Defaults: r = 4, brand-orange fill.
    expect(c.getAttribute("r")).toBe("4");
    expect(c.getAttribute("fill")).toBe("var(--color-brand-orange)");
  });

  it("also renders the single static circle when motion is reduced", () => {
    motionState.reduced = true;
    const { container } = render(<PulsingDot cx={5} cy={6} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    expect(circles[0].getAttribute("opacity")).toBe("0.8");
  });

  it("forwards a custom radius and color to the static circle", () => {
    const { container } = render(
      <PulsingDot cx={0} cy={0} r={7} color="#abc" immediate />,
    );
    const c = container.querySelector("circle")!;
    expect(c.getAttribute("r")).toBe("7");
    expect(c.getAttribute("fill")).toBe("#abc");
  });
});

describe("<PulsingDot> animated branch", () => {
  it("renders the pulsing core plus a glow ring of radius r*2 with full motion", () => {
    const { container } = render(<PulsingDot cx={0} cy={0} r={4} />);
    const circles = Array.from(container.querySelectorAll("circle"));
    expect(circles).toHaveLength(2);

    // The glow ring is the stroked, unfilled circle at twice the radius.
    const ring = circles.find((c) => c.getAttribute("fill") === "none");
    expect(ring).toBeDefined();
    expect(ring!.getAttribute("r")).toBe("8");
    expect(ring!.getAttribute("stroke")).toBe("var(--color-brand-orange)");

    // The pulsing core animates its radius, so no static r attribute survives.
    const core = circles.find((c) => c.getAttribute("fill") !== "none");
    expect(core).toBeDefined();
    expect(core!.getAttribute("r")).toBeNull();
  });

  it("scales the glow ring with a custom radius (r*2)", () => {
    const { container } = render(<PulsingDot cx={0} cy={0} r={5} />);
    const ring = Array.from(container.querySelectorAll("circle")).find(
      (c) => c.getAttribute("fill") === "none",
    )!;
    expect(ring.getAttribute("r")).toBe("10");
  });
});
