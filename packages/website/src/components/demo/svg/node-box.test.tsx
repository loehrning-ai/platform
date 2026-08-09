/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * node-box.test.tsx (regression coverage)
 *
 * Guards the REAL exported <NodeBox /> SVG primitive. framer-motion is mocked to
 * plain elements; we render with `immediate` so the top-level node is the bare
 * interaction <g> (no m.g wrapper) and its handlers are directly reachable.
 *
 * Assertions target the component's own logic, cross-checked against the real
 * DEMO tokens imported from @/lib/demo-tokens (not copied string literals):
 *   - variant -> rect fill / stroke / text fill mapping
 *   - active / glow -> stroke width, active stroke, drop-shadow filter
 *   - sublabel -> conditional second <text> + the y-offset geometry
 *   - onInteract -> hover(true/false) + click(!active) callbacks and the
 *     pointer-cursor affordance that only appears when a handler is wired.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const make = (tag: any): React.ElementType =>
    React.forwardRef(function MotionMock(props: any, ref: any) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        custom,
        children,
        ...rest
      } = props;
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

import { NodeBox } from "./node-box";
import { DEMO } from "@/lib/demo-tokens";

afterEach(() => {
  cleanup();
});

/** With `immediate`, NodeBox returns the interaction <g> as the tree root. */
function interactionGroup(container: HTMLElement): SVGGElement {
  const g = container.querySelector("g");
  if (!g) throw new Error("interaction <g> not found");
  return g as unknown as SVGGElement;
}

describe("<NodeBox> structure + geometry", () => {
  it("renders the label text and a rect", () => {
    const { container } = render(
      <NodeBox x={10} y={20} label="Quelle" immediate />,
    );
    expect(screen.getByText("Quelle")).toBeInTheDocument();
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("centers the label horizontally and, without a sublabel, vertically", () => {
    // x=10, y=20, defaults w=100 h=44 -> center x = 60, center y = 42.
    render(<NodeBox x={10} y={20} label="Quelle" immediate />);
    const label = screen.getByText("Quelle");
    expect(label.getAttribute("x")).toBe("60");
    expect(label.getAttribute("y")).toBe("42");
  });

  it("shifts the label up and adds a second text when a sublabel is present", () => {
    // With a sublabel: label y = center - 5 = 37, sublabel y = center + 9 = 51.
    render(
      <NodeBox x={10} y={20} label="Quelle" sublabel="CSV" immediate />,
    );
    expect(screen.getByText("Quelle").getAttribute("y")).toBe("37");
    const sub = screen.getByText("CSV");
    expect(sub.getAttribute("y")).toBe("51");
    expect(sub.getAttribute("x")).toBe("60");
  });

  it("renders only one text element when there is no sublabel", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Nur Label" immediate />,
    );
    expect(container.querySelectorAll("text")).toHaveLength(1);
  });
});

describe("<NodeBox> variant styling (real DEMO tokens)", () => {
  it("maps the default source variant to its node fill and active stroke", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" immediate />,
    );
    const rect = container.querySelector("rect")!;
    expect(rect.getAttribute("fill")).toBe(DEMO.fill.node);
    expect(rect.getAttribute("stroke")).toBe(DEMO.stroke.active);
    expect(screen.getByText("Q").getAttribute("fill")).toBe(DEMO.text.primary);
  });

  it("maps the output variant to the accent fill and accent text", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" variant="output" immediate />,
    );
    expect(container.querySelector("rect")!.getAttribute("fill")).toBe(
      DEMO.fill.accent,
    );
    expect(screen.getByText("Q").getAttribute("fill")).toBe(DEMO.text.accent);
  });

  it("maps the processing variant to the sand-tinted fill and soft accent text", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" variant="processing" immediate />,
    );
    expect(container.querySelector("rect")!.getAttribute("fill")).toBe(
      "rgba(168,144,112,0.06)",
    );
    expect(screen.getByText("Q").getAttribute("fill")).toBe(
      DEMO.text.accentSoft,
    );
  });
});

describe("<NodeBox> active + glow state", () => {
  it("thickens the stroke, swaps to the active fill/stroke and applies the glow when active", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" active immediate />,
    );
    const rect = container.querySelector("rect")!;
    expect(rect.getAttribute("fill")).toBe(DEMO.fill.accentStrong);
    expect(rect.getAttribute("stroke")).toBe("rgba(249,115,22,0.6)");
    expect(rect.getAttribute("stroke-width")).toBe("1.5");
    expect(rect.style.filter).toContain("drop-shadow");
    // Active text switches to the orange accent.
    expect(screen.getByText("Q").getAttribute("fill")).toBe(DEMO.text.accent);
  });

  it("applies the glow filter without activating when glow is set alone", () => {
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" glow immediate />,
    );
    const rect = container.querySelector("rect")!;
    expect(rect.style.filter).toContain("drop-shadow");
    // Not active -> stays at the thin 1px stroke.
    expect(rect.getAttribute("stroke-width")).toBe("1");
  });

  it("has no filter and a thin stroke in the resting (inactive, no glow) state", () => {
    const { container } = render(<NodeBox x={0} y={0} label="Q" immediate />);
    const rect = container.querySelector("rect")!;
    expect(rect.style.filter).toBe("");
    expect(rect.getAttribute("stroke-width")).toBe("1");
  });
});

describe("<NodeBox> onInteract callbacks", () => {
  it("reports hover enter (true) and leave (false)", () => {
    const onInteract = vi.fn();
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" onInteract={onInteract} immediate />,
    );
    const g = interactionGroup(container);
    fireEvent.mouseEnter(g);
    expect(onInteract).toHaveBeenNthCalledWith(1, true);
    fireEvent.mouseLeave(g);
    expect(onInteract).toHaveBeenNthCalledWith(2, false);
  });

  it("toggles active on click (false -> true)", () => {
    const onInteract = vi.fn();
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" active={false} onInteract={onInteract} immediate />,
    );
    fireEvent.click(interactionGroup(container));
    expect(onInteract).toHaveBeenCalledWith(true);
  });

  it("toggles active on click (true -> false)", () => {
    const onInteract = vi.fn();
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" active onInteract={onInteract} immediate />,
    );
    fireEvent.click(interactionGroup(container));
    expect(onInteract).toHaveBeenCalledWith(false);
  });

  it("exposes interactive nodes as keyboard-operable pressed buttons", () => {
    const onInteract = vi.fn();
    const { container } = render(
      <NodeBox x={0} y={0} label="Q" active={false} onInteract={onInteract} immediate />,
    );
    const group = interactionGroup(container);
    expect(group).toHaveAttribute("role", "button");
    expect(group).toHaveAttribute("tabindex", "0");
    expect(group).toHaveAttribute("aria-label", "Q");
    expect(group).toHaveAttribute("aria-pressed", "false");

    fireEvent.focus(group);
    expect(onInteract).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(group, { key: "Enter" });
    expect(onInteract).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(group, { key: " " });
    expect(onInteract).toHaveBeenLastCalledWith(true);
    fireEvent.blur(group);
    expect(onInteract).toHaveBeenLastCalledWith(false);
  });

  it("does not add button semantics when the node is informational", () => {
    const { container } = render(<NodeBox x={0} y={0} label="Q" immediate />);
    const group = interactionGroup(container);
    expect(group).not.toHaveAttribute("role");
    expect(group).not.toHaveAttribute("tabindex");
  });

  it("shows a pointer cursor only when onInteract is wired", () => {
    const withHandler = render(
      <NodeBox x={0} y={0} label="Q" onInteract={() => {}} immediate />,
    );
    expect(interactionGroup(withHandler.container).style.cursor).toBe("pointer");
    withHandler.unmount();

    const withoutHandler = render(<NodeBox x={0} y={0} label="Q" immediate />);
    expect(interactionGroup(withoutHandler.container).style.cursor).toBe("");
  });

  it("does not throw when clicked without an onInteract handler", () => {
    const { container } = render(<NodeBox x={0} y={0} label="Q" immediate />);
    expect(() => fireEvent.click(interactionGroup(container))).not.toThrow();
  });
});
