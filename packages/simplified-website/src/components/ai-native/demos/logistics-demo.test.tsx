import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

/**
 * logistics-demo.test.tsx (regression coverage)
 *
 * Drives the real <LogisticsDemo>. framer-motion is mocked to bare host
 * elements (the m.* wrappers are not the unit under test) so the setTimeout
 * driven run sequence can be exercised deterministically with fake timers.
 * We assert the component's own logic: the always-rendered flow graph, and the
 * simulated log streaming six events before the button re-enables on completion.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileInView",
    "whileFocus",
    "whileDrag",
    "viewport",
    "layout",
    "layoutId",
    "drag",
    "dragConstraints",
    "custom",
    "onAnimationComplete",
    "onAnimationStart",
  ]);
  const clean = (props: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const key in props) if (!DROP.has(key)) out[key] = props[key];
    return out;
  };
  const cache = new Map<string, unknown>();
  const m = new Proxy(
    {},
    {
      get: (_target, tag) => {
        if (typeof tag !== "string") return undefined;
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
  const Passthrough = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: Passthrough,
    LazyMotion: Passthrough,
    MotionConfig: Passthrough,
    domAnimation: {},
    useReducedMotion: () => false,
  };
});

import { LogisticsDemo } from "./logistics-demo";

describe("<LogisticsDemo>", () => {
  it("renders the three-stage flow graph, every node, and an idle log", () => {
    render(<LogisticsDemo />);

    expect(
      screen.getByRole("region", { name: "Praxisbeispiel: Logistik-Auto-Triage" }),
    ).toBeInTheDocument();
    // Column labels (one per stage).
    expect(screen.getByText(/Trigger/)).toBeInTheDocument();
    expect(screen.getByText(/Anreicherung/)).toBeInTheDocument();
    expect(screen.getByText(/Aktionen/)).toBeInTheDocument();
    // A node from each column is always in the DOM regardless of run state.
    expect(screen.getByText("DHL / DB Schenker")).toBeInTheDocument();
    expect(screen.getByText("Verzug klassifizieren")).toBeInTheDocument();
    expect(screen.getByText("Notfall-Bestellung")).toBeInTheDocument();
    // Idle log: zero events, waiting placeholder, run button enabled.
    expect(screen.getByText(/0\/6 Ereignisse/)).toBeInTheDocument();
    expect(screen.getByText(/warte auf Beispiel-Event/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Verzug simulieren/ }),
    ).toBeEnabled();
  });

  it("streams six log events on run, then re-enables the button when finished", () => {
    vi.useFakeTimers();
    try {
      render(<LogisticsDemo />);

      fireEvent.click(
        screen.getByRole("button", { name: /Verzug simulieren/ }),
      );

      // run() flips the running flag synchronously.
      const running = screen.getByRole("button", { name: /Läuft/ });
      expect(running).toBeDisabled();
      expect(screen.getByText(/Webhook eingegangen/)).toBeInTheDocument();

      // Last event fires at 400 + 5 * 500 = 2900ms.
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText(/6\/6 Ereignisse/)).toBeInTheDocument();
      // The final ERP event message is unique to the log (the node note differs).
      expect(
        screen.getByText(/Bestellanforderung 4500-8821 als Vorschlag erzeugt/),
      ).toBeInTheDocument();

      // Completion timer at 5200ms resets running.
      act(() => {
        vi.advanceTimersByTime(2300);
      });
      expect(
        screen.getByRole("button", { name: /Verzug simulieren/ }),
      ).toBeEnabled();
    } finally {
      vi.useRealTimers();
    }
  });
});
