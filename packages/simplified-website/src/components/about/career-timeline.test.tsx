import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * career-timeline.test.tsx (regression coverage)
 *
 * CareerTimeline paints a fixed 4-milestone career strip in two responsive
 * layouts (a desktop lg+ 4-col grid and a mobile vertical list), so every
 * milestone's text is mounted TWICE under jsdom (CSS `hidden` / `lg:hidden`
 * does not remove nodes and jsdom applies no CSS). The only real branching is:
 *   - the loehrning.ai milestone is highlighted: its company heading carries
 *     `text-brand-orange` (mil.color) and its dot carries `bg-brand-orange`,
 *     while the three earlier roles stay muted (`text-muted-foreground` /
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
    for (const period of ["2019-2022", "2022-2024", "2024-heute", "2025-heute"]) {
      expect(screen.getAllByText(period)).toHaveLength(2);
    }
    for (const company of ["Apple", "Red Bull", "Meta", "loehrning.ai"]) {
      expect(screen.getAllByText(company)).toHaveLength(2);
    }
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
    // One highlighted milestone x two layouts -> two accent dots; the three
    // muted milestones x two layouts -> six default dots. (The rails/connectors
    // use the distinct `bg-border/50` token, so they are not counted here.)
    expect(container.querySelectorAll(".bg-brand-orange")).toHaveLength(2);
    expect(container.querySelectorAll(".bg-border")).toHaveLength(6);
  });

  it("draws a mobile connector under every milestone except the last", () => {
    const { container } = render(<CareerTimeline />);
    // `i < milestones.length - 1` -> 3 connectors for 4 milestones. The
    // vertical connector is the only `h-full w-px` node (the desktop rail is
    // `h-px`, full width).
    expect(container.querySelectorAll(".h-full.w-px")).toHaveLength(3);
  });
});
