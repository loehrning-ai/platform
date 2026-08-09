/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

/**
 * animated-path.test.tsx (regression coverage)
 *
 * Guards the REAL exported <AnimatedPath />. The branching logic under test:
 *   - `immediate` -> a plain static <path> (framer-motion untouched)
 *   - otherwise   -> an <m.path> (mocked to a plain <path>)
 *   - `glow`      -> a drop-shadow(0 0 6px currentColor) style filter, else none
 *   - the prop defaults (currentColor stroke, 1.5 stroke width, fill="none")
 *
 * framer-motion is mocked to bare elements so the non-immediate branch resolves
 * to a real <path> we can inspect. Static-render assertions read SVG attributes
 * directly (React maps strokeWidth -> stroke-width, className -> class).
 */

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
    LazyMotion: Pass,
    MotionConfig: Pass,
    domAnimation: {},
  };
});

import { AnimatedPath } from "./animated-path";

const D = "M 0 0 L 10 10";

afterEach(() => {
  cleanup();
});

describe("<AnimatedPath> immediate (static) branch", () => {
  it("renders a plain path with the geometry and stroke defaults", () => {
    const { container } = render(<AnimatedPath d={D} immediate />);
    const path = container.querySelector("path")!;
    expect(path.getAttribute("d")).toBe(D);
    expect(path.getAttribute("stroke")).toBe("currentColor");
    expect(path.getAttribute("stroke-width")).toBe("1.5");
    expect(path.getAttribute("fill")).toBe("none");
  });

  it("applies no filter when glow is off", () => {
    const { container } = render(<AnimatedPath d={D} immediate />);
    expect(container.querySelector("path")!.style.filter).toBe("");
  });

  it("applies the currentColor drop-shadow when glow is on", () => {
    const { container } = render(<AnimatedPath d={D} immediate glow />);
    expect(container.querySelector("path")!.style.filter).toBe(
      "drop-shadow(0 0 6px currentColor)",
    );
  });

  it("honors custom color, stroke width and className", () => {
    const { container } = render(
      <AnimatedPath
        d={D}
        immediate
        color="#0af"
        strokeWidth={3}
        className="my-path"
      />,
    );
    const path = container.querySelector("path")!;
    expect(path.getAttribute("stroke")).toBe("#0af");
    expect(path.getAttribute("stroke-width")).toBe("3");
    expect(path.getAttribute("class")).toBe("my-path");
  });
});

describe("<AnimatedPath> animated (default) branch", () => {
  it("still renders a path carrying the geometry and stroke when not immediate", () => {
    const { container } = render(<AnimatedPath d={D} color="#f80" />);
    const path = container.querySelector("path")!;
    expect(path.getAttribute("d")).toBe(D);
    expect(path.getAttribute("stroke")).toBe("#f80");
    expect(path.getAttribute("fill")).toBe("none");
  });
});
