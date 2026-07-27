import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * career-timeline.test.tsx (regression coverage)
 *
 * CareerTimeline paints a fixed 5-milestone career strip in two responsive
 * layouts (a desktop lg+ 5-col grid and a mobile vertical list), so every
 * milestone's text is mounted TWICE under jsdom (CSS `hidden` / `lg:hidden`
 * does not remove nodes and jsdom applies no CSS). The only real branching is:
 *   - the loehrning.ai milestone is highlighted: its company heading carries
 *     `text-brand-orange` (mil.color) and its dot carries `bg-brand-orange`,
 *     while the four earlier roles stay muted (`text-muted-foreground` /
 *     `bg-border`);
 *   - the mobile list draws a vertical connector under every milestone except
 *     the last (`i < milestones.length - 1`).
 * We render the real component (framer-motion stubbed to plain DOM) and assert
 * those derivations, not the surrounding prose.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
    "whileInView",
    "viewport",
  ]);
  const clean = (p: Record<string, unknown>) => {
    const o: Record<string, unknown> = {};
    for (const k in p) if (!DROP.has(k)) o[k] = p[k];
    return o;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
              createElement(tag, { ...clean(props), ref }),
            ),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return { __esModule: true, m, motion: m };
});

import { CareerTimeline } from "./career-timeline";

describe("<CareerTimeline>", () => {
  it("renders the section heading once", () => {
    render(<CareerTimeline />);
    expect(
      screen.getByRole("heading", { name: "Karriere", level: 2 }),
    ).toBeInTheDocument();
  });

  it("mounts every milestone period and company in both responsive layouts", () => {
    render(<CareerTimeline />);
    // Desktop grid + mobile list both stay in the DOM under jsdom, so each
    // milestone's period and company string appears exactly twice.
    for (const period of [
      "2021",
      "2022-2024",
      "2024-2025",
      "2025-2026",
      "2026-heute",
    ]) {
      expect(screen.getAllByText(period)).toHaveLength(2);
    }
    for (const company of [
      "Amazon",
      "Apple",
      "Red Bull",
      "Meta",
      "loehrning.ai",
    ]) {
      expect(screen.getAllByText(company)).toHaveLength(2);
    }
  });

  it("gives the desktop grid exactly one column per milestone", () => {
    const { container } = render(<CareerTimeline />);
    // Tailwind cannot build a class from a runtime value, so the column count
    // is a literal in the component and silently stops matching when a
    // milestone is added. Deriving the expected count from the rendered
    // milestones catches that: the mobile list mounts each company once, so
    // its count is the milestone count.
    const milestoneCount = container.querySelectorAll(".h-3.w-3").length;
    expect(milestoneCount).toBeGreaterThan(0);
    expect(
      container.querySelector(`.grid.grid-cols-${milestoneCount}`),
    ).not.toBeNull();
  });

  it("highlights the loehrning.ai company heading and keeps the earlier roles muted", () => {
    render(<CareerTimeline />);
    // mil.color === "text-brand-orange" only for the loehrning.ai milestone.
    for (const heading of screen.getAllByText("loehrning.ai")) {
      expect(heading.className).toContain("text-brand-orange");
    }
    // Every earlier company keeps the muted color, never the accent.
    for (const heading of screen.getAllByText("Apple")) {
      expect(heading.className).toContain("text-muted-foreground");
      expect(heading.className).not.toContain("text-brand-orange");
    }
  });

  it("paints an accent dot only for the loehrning.ai milestone", () => {
    const { container } = render(<CareerTimeline />);
    // `company === "loehrning.ai" ? "bg-brand-orange" : "bg-border"`.
    // One highlighted milestone x two layouts -> two accent dots; the four
    // muted milestones x two layouts -> eight default dots. (The
    // rails/connectors use the distinct `bg-border/50` token, so they are not
    // counted here.)
    expect(container.querySelectorAll(".bg-brand-orange")).toHaveLength(2);
    expect(container.querySelectorAll(".bg-border")).toHaveLength(8);
  });

  it("draws a mobile connector under every milestone except the last", () => {
    const { container } = render(<CareerTimeline />);
    // `i < milestones.length - 1` -> 4 connectors for 5 milestones. The
    // vertical connector is the only `h-full w-px` node (the desktop rail is
    // `h-px`, full width).
    expect(container.querySelectorAll(".h-full.w-px")).toHaveLength(4);
  });
});
