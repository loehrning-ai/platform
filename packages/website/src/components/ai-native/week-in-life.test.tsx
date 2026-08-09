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
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: Pass,
    LazyMotion: Pass,
    MotionConfig: Pass,
    domAnimation: {},
  };
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
    expect(screen.getByText("Briefing und Kriterien festhalten")).toBeInTheDocument();
    expect(screen.getByText("Ergebnisse verifizieren")).toBeInTheDocument();
    expect(screen.queryByText("Anforderungen zusammentragen")).toBeNull();

    expect(
      screen.getByRole("button", { name: /Mit Claude/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Ad hoc/ }),
    ).toHaveAttribute("aria-pressed", "false");

    const manual = screen.getByRole("button", { name: /Ad hoc/ });
    expect(manual).toHaveClass("min-w-0");
    expect(manual.parentElement).toHaveClass("grid", "w-full", "grid-cols-2");
  });

  it("renders and switches the English process comparison", () => {
    render(<AiNativeWeekInLife locale="en" />);
    expect(screen.getByText("Record the brief and criteria")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ad hoc/ }));

    // BEFORE-specific step titles now render; AFTER ones are gone.
    expect(screen.getByText("Collect requirements")).toBeInTheDocument();
    expect(screen.getByText("Propagate changes")).toBeInTheDocument();
    expect(screen.queryByText("Record the brief and criteria")).toBeNull();

    expect(
      screen.getByRole("button", { name: /Ad hoc/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Claude-assisted/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
