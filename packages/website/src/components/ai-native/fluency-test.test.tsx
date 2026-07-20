import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

/**
 * fluency-test.test.tsx (regression coverage)
 *
 * FluencyTest is a 10-scenario / 5-dimension self-assessment. Its scoring math
 * lives in-component (useMemo), so we drive the REAL quiz: each answer is
 * option index i -> score i (options are ordered 0..3), and answering auto-
 * advances via a 220ms timer. We flush that timer with fake timers, then assert
 * the computed total/percent, the level band (Explorer/User/Practitioner/
 * Operator), and the weakest-dimension routing. framer-motion + the animated
 * primitives (CountUp renders its numeric value flat) + BrandButton + next/link
 * are stubbed so only FluencyTest's own logic runs.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
    "whileInView",
    "whileHover",
    "whileTap",
    "viewport",
    "layout",
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
  const Pass = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return { __esModule: true, m, motion: m, AnimatePresence: Pass };
});

vi.mock("@/components/ai-native/primitives", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    ClipHeading: ({ children, as }: { children: unknown; as?: string }) =>
      createElement(as ?? "h2", null, children as never),
    Eyebrow: ({ children }: { children: unknown }) =>
      createElement("p", null, children as never),
    FadeBlock: ({ children }: { children: unknown }) =>
      createElement("div", null, children as never),
    CountUp: ({ value, suffix }: { value: number; suffix?: string }) =>
      createElement("span", null, `${value}${suffix ?? ""}`),
  };
});

vi.mock("@/components/ui/brand-button", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    BrandButton: ({
      children,
      href,
      onClick,
      disabled,
    }: {
      children: unknown;
      href?: string;
      onClick?: () => void;
      disabled?: boolean;
    }) =>
      href
        ? createElement("a", { href }, children as never)
        : createElement(
            "button",
            { type: "button", onClick, disabled },
            children as never,
          ),
  };
});

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    default: ({ children, href }: { children: unknown; href: string }) =>
      createElement("a", { href }, children as never),
  };
});

import { FluencyTest } from "./fluency-test";

/** The 4 answer buttons for the current scenario (each carries a .flex-1 label). */
function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll("button")].filter((b) =>
    b.querySelector("span.flex-1"),
  ) as HTMLButtonElement[];
}

/** Answer all 10 scenarios, picking option `pick(i)` (= score) for scenario i,
 * flushing the 220ms auto-advance between questions, then open the result. */
function runToResult(
  container: HTMLElement,
  pick: (i: number) => number,
): void {
  for (let i = 0; i < 10; i++) {
    const opts = optionButtons(container);
    fireEvent.click(opts[pick(i)]);
    if (i < 9) act(() => vi.advanceTimersByTime(300));
  }
  fireEvent.click(screen.getByRole("button", { name: /Auswerten/ }));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("<FluencyTest>", () => {
  it("opens on the first scenario with the 01/10 counter", () => {
    render(<FluencyTest />);
    expect(screen.getByText("Wo stehst du?")).toBeInTheDocument();
    expect(screen.getByText("01 / 10")).toBeInTheDocument();
    expect(
      screen.getByText(/Kundenmail auf deinem Desktop/),
    ).toBeInTheDocument();
  });

  it("scores a perfect run as 100% / Operator (30 of 30)", () => {
    const { container } = render(<FluencyTest />);
    runToResult(container, () => 3);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("30 / 30")).toBeInTheDocument();
    expect(screen.getByText("Level: Operator.")).toBeInTheDocument();
  });

  it("scores an all-score-2 run as 67% / Practitioner (20 of 30)", () => {
    const { container } = render(<FluencyTest />);
    runToResult(container, () => 2);
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("20 / 30")).toBeInTheDocument();
    expect(screen.getByText("Level: Practitioner.")).toBeInTheDocument();
  });

  it("scores an all-score-1 run as 33% / User (10 of 30)", () => {
    const { container } = render(<FluencyTest />);
    runToResult(container, () => 1);
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("10 / 30")).toBeInTheDocument();
    expect(screen.getByText("Level: User.")).toBeInTheDocument();
  });

  it("scores a worst-case run as 0% / Explorer (0 of 30)", () => {
    const { container } = render(<FluencyTest />);
    runToResult(container, () => 0);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 / 30")).toBeInTheDocument();
    expect(screen.getByText("Level: Explorer.")).toBeInTheDocument();
  });

  it("routes the weakest dimension to Governance when only the two governance scenarios score 0", () => {
    const { container } = render(<FluencyTest />);
    // Scenario indices 4 (s5) and 9 (s10) are the governance items.
    runToResult(container, (i) => (i === 4 || i === 9 ? 0 : 3));
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("24 / 30")).toBeInTheDocument();
    expect(
      screen.getByText("Schwächste Dimension: Governance"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Du bist bei Compliance unsicher/),
    ).toBeInTheDocument();
  });

  it("returns to the question view when 'Nochmal machen' is clicked", () => {
    window.scrollTo = vi.fn();
    const { container } = render(<FluencyTest />);
    runToResult(container, () => 0);
    // On the result view now.
    expect(screen.getByText("Level: Explorer.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Nochmal machen/ }));
    // Back to the first question.
    expect(screen.getByText("Wo stehst du?")).toBeInTheDocument();
    expect(screen.getByText("01 / 10")).toBeInTheDocument();
    expect(screen.queryByText("Level: Explorer.")).toBeNull();
  });
});
