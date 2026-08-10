/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

/**
 * flow-particle.test.tsx (regression coverage)
 *
 * Guards the REAL exported <FlowParticle />. The load-bearing logic is the
 * cubic-bezier parse + sample math (parseCubicBezier + sampleBezier are module-
 * private, so we exercise them through the component's static render, whose
 * circle sits at the curve midpoint t = 0.5, index floor(25 / 2) = 12).
 *
 * framer-motion is mocked to plain SVG elements; useReducedMotion is driven off
 * a hoisted flag so we can hit BOTH branches:
 *   - reduced / immediate  -> a positioned static <circle> (cx, cy, opacity 0.6)
 *   - full motion          -> an <m.circle> whose cx/cy are animated (no static
 *                             cx attribute survives the mock), matching the
 *                             component's "infinite loops bypass reducedMotion,
 *                             render static instead" contract.
 *
 * The midpoint values are verified against an independent hand computation:
 * for the collinear path "M 0 0 C 10 10, 20 20, 30 30" the t = 0.5 point is
 * 0.125*p0 + 0.375*p1 + 0.375*p2 + 0.125*p3 = (15, 15).
 */

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const cache = new Map<string, React.ElementType>();
  const make = (tag: any): React.ElementType => {
    const cacheable = typeof tag === "string";
    if (cacheable && cache.has(tag)) return cache.get(tag)!;
    const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        whileInView,
        custom,
        viewport,
        children,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    if (cacheable) cache.set(tag, Comp);
    return Comp;
  };
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

import { FlowParticle } from "./flow-particle";

// A perfectly diagonal cubic whose t=0.5 sample is exactly (15, 15).
const DIAGONAL = "M 0 0 C 10 10, 20 20, 30 30";

beforeEach(() => {
  motionState.reduced = false;
});
afterEach(() => {
  cleanup();
});

describe("<FlowParticle> bezier math (static render)", () => {
  it("places the static circle at the curve midpoint when immediate", () => {
    const { container } = render(<FlowParticle path={DIAGONAL} immediate />);
    const circle = container.querySelector("circle");
    expect(circle).not.toBeNull();
    // t = 0.5 midpoint of the collinear cubic: (15, 15).
    expect(Number(circle!.getAttribute("cx"))).toBeCloseTo(15, 6);
    expect(Number(circle!.getAttribute("cy"))).toBeCloseTo(15, 6);
    // Static branch renders at the documented 0.6 opacity.
    expect(circle!.getAttribute("opacity")).toBe("0.6");
  });

  it("samples a horizontal cubic midpoint on the x-axis only", () => {
    const { container } = render(
      <FlowParticle path="M 0 0 C 10 0, 20 0, 30 0" immediate />,
    );
    const circle = container.querySelector("circle")!;
    expect(Number(circle.getAttribute("cx"))).toBeCloseTo(15, 6);
    expect(Number(circle.getAttribute("cy"))).toBeCloseTo(0, 6);
  });

  it("parses negative coordinates so a symmetric curve midpoints at the origin", () => {
    const { container } = render(
      <FlowParticle path="M -4 -4 C -2 -2, 2 2, 4 4" immediate />,
    );
    const circle = container.querySelector("circle")!;
    expect(Number(circle.getAttribute("cx"))).toBeCloseTo(0, 6);
    expect(Number(circle.getAttribute("cy"))).toBeCloseTo(0, 6);
  });

  it("forwards custom radius and color onto the static circle", () => {
    const { container } = render(
      <FlowParticle path={DIAGONAL} immediate r={6} color="#123456" />,
    );
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("r")).toBe("6");
    expect(circle.getAttribute("fill")).toBe("#123456");
  });
});

describe("<FlowParticle> reduced-motion + invalid input", () => {
  it("renders the static circle (not the animation) when motion is reduced", () => {
    motionState.reduced = true;
    const { container } = render(<FlowParticle path={DIAGONAL} />);
    const circle = container.querySelector("circle")!;
    // A positioned static cx proves the reduced-motion branch was taken.
    expect(Number(circle.getAttribute("cx"))).toBeCloseTo(15, 6);
    expect(circle.getAttribute("opacity")).toBe("0.6");
  });

  it("hands off to the animated circle (no static cx) with full motion", () => {
    motionState.reduced = false;
    const { container } = render(<FlowParticle path={DIAGONAL} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
    // The animated branch drives cx/cy via keyframes, so no static cx attribute
    // survives; radius + fill still flow through as static props.
    expect(circles[0].getAttribute("cx")).toBeNull();
    expect(circles[0].getAttribute("opacity")).toBeNull();
    expect(circles[0].getAttribute("r")).toBe("3");
  });

  it("renders nothing for a path with fewer than 8 numbers", () => {
    const { container } = render(<FlowParticle path="M 0 0 C 1 2 3 4 5" immediate />);
    expect(container.querySelector("circle")).toBeNull();
  });

  it("renders nothing for a path with no coordinates at all", () => {
    const { container } = render(<FlowParticle path="not a path" immediate />);
    expect(container.querySelector("circle")).toBeNull();
  });
});
