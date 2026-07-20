import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ScoreBar } from "./score-bar";

/**
 * score-bar.test.tsx (regression coverage)
 *
 * ScoreBar renders a two-element progress bar: a static track <div> wrapping a
 * framer-motion `m.div` fill. Its only branching logic is the `colorMap`
 * lookup that turns the `color` prop ("orange" | "amber" | "sand", default
 * "orange") into the matching brand background class, plus the width clamp
 * `Math.min(100, Math.max(0, value))`.
 *
 * These tests assert the RELIABLY observable behavior in jsdom: the track
 * classes, the color-to-class mapping on the fill, the two-node structure, and
 * that edge/out-of-range `value` inputs render without throwing. The animated
 * width itself is not asserted: `m.div` is rendered without a `LazyMotion`
 * provider (none exists in the test tree, matching the sibling radar-chart
 * suite), so framer-motion does not apply the `animate={{ width }}` target to
 * `style.width` in jsdom. Only pass-through props (className) are guaranteed on
 * a featureless `m.*` node, so the assertions target those.
 */

afterEach(() => cleanup());

function renderBar(props: Parameters<typeof ScoreBar>[0]) {
  const { container } = render(<ScoreBar {...props} />);
  const track = container.firstChild as HTMLElement;
  const fill = track.firstChild as HTMLElement;
  return { container, track, fill };
}

describe("<ScoreBar>", () => {
  it("renders the track wrapper with the rounded, clipped background classes", () => {
    const { track } = renderBar({ value: 50 });
    // The outer track is a plain <div> (not motion) so its className is stable.
    expect(track.tagName).toBe("DIV");
    expect(track.className).toContain("h-1.5");
    expect(track.className).toContain("w-full");
    expect(track.className).toContain("overflow-hidden");
    expect(track.className).toContain("rounded-full");
    expect(track.className).toContain("bg-border/30");
  });

  it("renders exactly one fill element inside the track", () => {
    const { track } = renderBar({ value: 50 });
    expect(track.children.length).toBe(1);
    const fill = track.firstChild as HTMLElement;
    expect(fill.tagName).toBe("DIV");
    // Base fill classes are always present regardless of the color variant.
    expect(fill.className).toContain("h-full");
    expect(fill.className).toContain("rounded-full");
  });

  it("defaults to the brand-orange fill when no color prop is given", () => {
    const { fill } = renderBar({ value: 40 });
    expect(fill.className).toContain("bg-brand-orange");
    expect(fill.className).not.toContain("bg-brand-amber");
    expect(fill.className).not.toContain("bg-brand-sand");
  });

  it("maps color='orange' to the bg-brand-orange class", () => {
    const { fill } = renderBar({ value: 40, color: "orange" });
    expect(fill.className).toContain("bg-brand-orange");
  });

  it("maps color='amber' to the bg-brand-amber class", () => {
    const { fill } = renderBar({ value: 40, color: "amber" });
    expect(fill.className).toContain("bg-brand-amber");
    expect(fill.className).not.toContain("bg-brand-orange");
  });

  it("maps color='sand' to the bg-brand-sand class", () => {
    const { fill } = renderBar({ value: 40, color: "sand" });
    expect(fill.className).toContain("bg-brand-sand");
    expect(fill.className).not.toContain("bg-brand-orange");
  });

  it("renders without throwing across the full value range (0, 100, mid)", () => {
    expect(() => render(<ScoreBar value={0} />)).not.toThrow();
    expect(() => render(<ScoreBar value={100} />)).not.toThrow();
    expect(() => render(<ScoreBar value={73} />)).not.toThrow();
  });

  it("renders without throwing for out-of-range values (negative and > 100)", () => {
    // The clamp `Math.min(100, Math.max(0, value))` guards these; the component
    // must still mount cleanly for values outside the documented 0-100 range.
    expect(() => render(<ScoreBar value={-25} />)).not.toThrow();
    expect(() => render(<ScoreBar value={150} />)).not.toThrow();
  });

  it("accepts a delay prop without altering the rendered structure", () => {
    const { track, fill } = renderBar({ value: 60, color: "amber", delay: 0.4 });
    // delay only feeds the framer-motion transition; the DOM shape is unchanged.
    expect(track.children.length).toBe(1);
    expect(fill.className).toContain("bg-brand-amber");
  });
});
