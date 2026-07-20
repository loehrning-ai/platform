import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

/**
 * word-demo.test.tsx (regression coverage)
 *
 * Drives the real <WordDemo>. framer-motion is mocked to bare host elements so
 * the setTimeout-driven generate sequence runs deterministically under fake
 * timers. We assert the component's own logic: the form defaults, the live
 * filename stub derived from the Adressat, and the generated brief being filled
 * from the current form state once the generate timers elapse.
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

import { WordDemo } from "./word-demo";

describe("<WordDemo>", () => {
  it("renders the form defaults, the derived filename, and the empty doc state", () => {
    render(<WordDemo />);

    expect(screen.getByRole("region", { name: "Praxisbeispiel: Word" })).toBeInTheDocument();
    // Default field values.
    expect(screen.getByLabelText("Adressat")).toHaveValue("Fiktivwerk Beispiel GmbH (rein fiktiv)");
    expect(screen.getByLabelText("Projekt-Titel")).toHaveValue(
      "Wartungs-KI Produktionslinie",
    );
    // Filename stub is the first token of the Adressat.
    expect(screen.getByText(/Projektbrief_Fiktivwerk_/)).toBeInTheDocument();
    // Ungenerated: placeholder shown, no generated KPIs yet.
    expect(screen.getByText(/Claude füllt dieses/)).toBeInTheDocument();
    expect(screen.queryByText("Erstellzeit")).not.toBeInTheDocument();
  });

  it("re-derives the doc filename live when the Adressat changes", () => {
    render(<WordDemo />);

    fireEvent.change(screen.getByLabelText("Adressat"), {
      target: { value: "Neukunde AG" },
    });

    expect(screen.getByText(/Projektbrief_Neukunde_/)).toBeInTheDocument();
    expect(screen.queryByText(/Projektbrief_Fiktivwerk_/)).not.toBeInTheDocument();
  });

  it("runs the generate sequence and fills the brief from the form after the timers elapse", () => {
    vi.useFakeTimers();
    try {
      render(<WordDemo />);

      fireEvent.click(
        screen.getByRole("button", { name: /Projektbrief erstellen/ }),
      );

      // generate() enters the busy state synchronously (genStep = 1).
      const genBtn = screen.getByRole("button", { name: /Generiert/ });
      expect(genBtn).toBeDisabled();
      expect(
        screen.getByText(/Stil-Abgleich mit Musterreferenzen/),
      ).toBeInTheDocument();
      // Doc not generated yet -> placeholder still present.
      expect(screen.getByText(/Claude füllt dieses/)).toBeInTheDocument();

      // Final timer fires at 1500ms and sets generated = true.
      act(() => {
        vi.advanceTimersByTime(1600);
      });

      // Brief is filled from the form's default project title + timeframe.
      expect(
        screen.getByText(/Projektbrief: Wartungs-KI Produktionslinie/),
      ).toBeInTheDocument();
      expect(screen.getByText("Juli-September 2026")).toBeInTheDocument();
      // Generated-only KPI grid is now present.
      expect(screen.getByText("Erstellzeit")).toBeInTheDocument();
      expect(screen.getByText("4,2 s")).toBeInTheDocument();
      // Button flips to the re-generate label and is enabled again.
      expect(
        screen.getByRole("button", { name: /Neu generieren/ }),
      ).toBeEnabled();
      // Placeholder replaced by the real doc.
      expect(screen.queryByText(/Claude füllt dieses/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
