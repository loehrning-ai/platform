/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";

/**
 * before-after-slider.test.tsx (regression coverage)
 *
 * Drives the REAL exported <AiNativeBeforeAfter /> drag-slider. framer-motion
 * is mocked down to plain elements (via the design primitives) so the only
 * behavior under test is the component's own: the static before/after task
 * render, the zero-padded step numbering, and the pointer-drag handler with its
 * `Math.max(4, Math.min(96, pct))` clamp.
 *
 * The hint animation never fires here: the shared test setup installs a no-op
 * IntersectionObserver, so the one-shot rAF jiggle is never scheduled and the
 * slider stays at its 50% rest position until the user drags. getBoundingClient-
 * Rect is stubbed to a known 200px-wide box so the drag math is deterministic
 * (jsdom otherwise reports a zero-width rect).
 */

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
        whileFocus,
        whileInView,
        whileDrag,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        layout,
        layoutId,
        custom,
        viewport,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        children,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    if (cacheable) cache.set(tag, Comp);
    return Comp;
  };
  const m: any = new Proxy(
    { create: (tag: any) => make(tag) },
    {
      get(target, prop) {
        if (prop === "create") return (target as any).create;
        if (typeof prop === "symbol") return undefined;
        return make(prop as string);
      },
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
    useInView: () => false,
    useMotionValue: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useSpring: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useTransform: () => ({ set: () => {}, get: () => 0, on: () => () => {} }),
  };
});

import { AiNativeBeforeAfter } from "./before-after-slider";

/** Stub the wrapper rect so drag math resolves against a 200px-wide box. */
function stubWrapRect(container: HTMLElement): void {
  const wrap = container.querySelector(".select-none") as HTMLElement | null;
  if (!wrap) throw new Error("slider wrap element not found");
  wrap.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 420,
      width: 200,
      height: 420,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

function afterPane(): HTMLElement {
  return screen.getByText("nachher · AI-native").parentElement as HTMLElement;
}
function beforePane(): HTMLElement {
  return screen.getByText("vorher · ohne AI").parentElement as HTMLElement;
}

afterEach(() => {
  cleanup();
});

describe("<AiNativeBeforeAfter> static render", () => {
  it("renders the eyebrow, the disclaimer and the drag affordance", () => {
    render(<AiNativeBeforeAfter />);
    expect(screen.getByText("Warum überhaupt")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Beispiel aus unserer Pilotphase. Zeiten variieren. Die Richtung nicht.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Vergleichs-Slider ziehen" }),
    ).toBeInTheDocument();
  });

  it("shows the same task in both panes with their respective durations", () => {
    render(<AiNativeBeforeAfter />);
    // Task title is duplicated across the before + after panes.
    expect(screen.getAllByText("Wettbewerber-Briefing")).toHaveLength(2);
    expect(screen.getByText("4 h 30 min")).toBeInTheDocument();
    expect(screen.getByText("18 min")).toBeInTheDocument();
    // A representative step from each side.
    expect(screen.getByText("Google-Suche")).toBeInTheDocument();
    expect(screen.getByText("Claude mit 5 URLs briefen")).toBeInTheDocument();
    expect(screen.getByText("Fertig")).toBeInTheDocument();
  });

  it("zero-pads step indices per pane (before has 6 steps, after has 4)", () => {
    render(<AiNativeBeforeAfter />);
    // "01" appears once per pane -> two matches total.
    expect(screen.getAllByText("01")).toHaveLength(2);
    // "05" and "06" only exist in the six-step before pane.
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("06")).toBeInTheDocument();
    // The after pane stops at "04", so "06" is unique to before.
    expect(screen.getAllByText("06")).toHaveLength(1);
  });

  it("starts the divider at the 50% rest position", () => {
    render(<AiNativeBeforeAfter />);
    // before pane clips from the right by (100 - x)% -> 50% at rest.
    expect(beforePane().style.clipPath).toContain("50%");
    // after pane clips from the left by x% -> 50% at rest.
    expect(afterPane().style.clipPath).toContain("50%");
  });
});

describe("<AiNativeBeforeAfter> drag interaction", () => {
  it("ignores pointer movement until the handle is pressed", () => {
    const { container } = render(<AiNativeBeforeAfter />);
    stubWrapRect(container);

    // No mousedown first: the handler's `dragging` guard should bail out.
    fireEvent.mouseMove(window, { clientX: 20 });

    expect(afterPane().style.clipPath).toContain("50%");
    expect(afterPane().style.clipPath).not.toContain("10%");
  });

  it("maps the pointer x to a percentage while dragging", () => {
    const { container } = render(<AiNativeBeforeAfter />);
    stubWrapRect(container);

    fireEvent.mouseDown(
      screen.getByRole("button", { name: "Vergleichs-Slider ziehen" }),
    );
    // clientX 20 / width 200 -> 10%.
    fireEvent.mouseMove(window, { clientX: 20 });

    expect(afterPane().style.clipPath).toContain("10%");
    // before pane uses the complement (100 - 10 = 90).
    expect(beforePane().style.clipPath).toContain("90%");
  });

  it("clamps below 4% up to the 4% floor", () => {
    const { container } = render(<AiNativeBeforeAfter />);
    stubWrapRect(container);

    fireEvent.mouseDown(
      screen.getByRole("button", { name: "Vergleichs-Slider ziehen" }),
    );
    // clientX 0 -> 0%, clamped up to the 4% floor.
    fireEvent.mouseMove(window, { clientX: 0 });

    expect(afterPane().style.clipPath).toContain("4%");
    expect(beforePane().style.clipPath).toContain("96%");
  });

  it("clamps beyond 96% down to the 96% ceiling", () => {
    const { container } = render(<AiNativeBeforeAfter />);
    stubWrapRect(container);

    fireEvent.mouseDown(
      screen.getByRole("button", { name: "Vergleichs-Slider ziehen" }),
    );
    // clientX 400 / width 200 -> 200%, clamped down to the 96% ceiling.
    fireEvent.mouseMove(window, { clientX: 400 });

    expect(afterPane().style.clipPath).toContain("96%");
    expect(beforePane().style.clipPath).toContain("4%");
  });

  it("reads clientX from the touch point on touch drags", () => {
    const { container } = render(<AiNativeBeforeAfter />);
    stubWrapRect(container);

    fireEvent.touchStart(
      screen.getByRole("button", { name: "Vergleichs-Slider ziehen" }),
    );
    // Dispatch a touchmove carrying a touches list -> the handler reads
    // touches[0].clientX (40 / 200 -> 20%).
    act(() => {
      const ev = new Event("touchmove", { bubbles: true });
      Object.defineProperty(ev, "touches", {
        value: [{ clientX: 40 }],
        configurable: true,
      });
      window.dispatchEvent(ev);
    });

    expect(afterPane().style.clipPath).toContain("20%");
    expect(beforePane().style.clipPath).toContain("80%");
  });
});
