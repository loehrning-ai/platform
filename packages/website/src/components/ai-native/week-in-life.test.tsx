import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * week-in-life.test.tsx (regression coverage)
 *
 * AiNativeWeekInLife toggles a `mode` state between the manual ("before") and
 * Claude-assisted ("after") flow, defaulting to "after". The active flow drives
 * which timeline steps, label and total render, and the toggle buttons expose
 * aria-pressed. We assert the real switch by checking flow-specific step titles
 * appear/disappear and the pressed state flips. framer-motion + primitives are
 * stubbed.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set(["initial", "animate", "exit", "transition"]);
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
  const Pass = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return { __esModule: true, m, motion: m, AnimatePresence: Pass };
});

vi.mock("@/components/ai-native/primitives", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    SectionShell: ({ children }: { children: unknown }) =>
      createElement("section", null, children as never),
    ClipHeading: ({ children, as }: { children: unknown; as?: string }) =>
      createElement(as ?? "h2", null, children as never),
    Eyebrow: ({ children }: { children: unknown }) =>
      createElement("p", null, children as never),
    FadeBlock: ({ children }: { children: unknown }) =>
      createElement("div", null, children as never),
  };
});

import { AiNativeWeekInLife } from "./week-in-life";

describe("<AiNativeWeekInLife>", () => {
  it("defaults to the 'after' flow with its toggle pressed", () => {
    render(<AiNativeWeekInLife />);
    // AFTER-specific step titles are shown, BEFORE ones are not.
    expect(screen.getByText("Briefing an Claude")).toBeInTheDocument();
    expect(screen.getByText("Dashboard generiert sich")).toBeInTheDocument();
    expect(screen.queryByText("Anforderungen sammeln")).toBeNull();

    expect(
      screen.getByRole("button", { name: /Mit Claude \+ Notebook/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Manuell/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to the manual 'before' flow when the Manuell toggle is clicked", () => {
    render(<AiNativeWeekInLife />);
    fireEvent.click(screen.getByRole("button", { name: /Manuell/ }));

    // BEFORE-specific step titles now render; AFTER ones are gone.
    expect(screen.getByText("Anforderungen sammeln")).toBeInTheDocument();
    expect(screen.getByText("Feedback-Runde")).toBeInTheDocument();
    expect(screen.queryByText("Briefing an Claude")).toBeNull();

    expect(
      screen.getByRole("button", { name: /Manuell/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Mit Claude \+ Notebook/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
