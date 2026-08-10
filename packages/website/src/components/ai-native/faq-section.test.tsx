import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * faq-section.test.tsx (regression coverage)
 *
 * AiNativeFaqSection is a single-open accordion: `open` holds the active index
 * (0 by default), clicking a row opens it and closes any other, clicking the
 * open row collapses it (open -> null). The answer paragraph is only mounted
 * while its row is open. We drive the real toggle and assert the aria-expanded
 * bookkeeping + that exactly one answer body is mounted at a time. framer-motion
 * and the primitives are stubbed; the FAQ content comes from the real catalog.
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
  };
});

import { AiNativeFaqSection } from "./faq-section";
import { AI_NATIVE_FAQ } from "@/lib/ai-native/content";

const openAnswers = (c: HTMLElement) => c.querySelectorAll(".pl-14").length;

describe("<AiNativeFaqSection>", () => {
  it("renders one button per FAQ item with the first row open by default", () => {
    const { container } = render(<AiNativeFaqSection />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(AI_NATIVE_FAQ.length);
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
    // First question text is visible; exactly one answer body is mounted.
    expect(screen.getByText(AI_NATIVE_FAQ[0].question)).toBeInTheDocument();
    expect(openAnswers(container)).toBe(1);
  });

  it("opening another row closes the previously open one (single-open)", () => {
    const { container } = render(<AiNativeFaqSection />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    expect(openAnswers(container)).toBe(1);
  });

  it("clicking the open row again collapses it, leaving nothing open", () => {
    const { container } = render(<AiNativeFaqSection />);
    const buttons = screen.getAllByRole("button");
    // Row 0 is open by default; click it to collapse.
    fireEvent.click(buttons[0]);

    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    buttons.forEach((b) => expect(b).toHaveAttribute("aria-expanded", "false"));
    expect(openAnswers(container)).toBe(0);
  });
});
