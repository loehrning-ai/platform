/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AI_NATIVE_BUNDLE_ITEMS } from "@/lib/ai-native/content";

/**
 * bundle-showcase.test.tsx (regression coverage)
 *
 * Drives the REAL exported <AiNativeBundleShowcase />. It is a hover/click/focus
 * driven master-detail: a numbered list of the real AI_NATIVE_BUNDLE_ITEMS on
 * the left, a sticky detail pane on the right that mirrors the active index.
 *
 * We assert the component's own wiring against the REAL content module: the
 * initial active=0 selection, aria-pressed bookkeeping, the padded "Baustein NN"
 * counter, and that mouseEnter / focus / click each re-point the detail pane.
 * framer-motion is mocked to plain elements (used via the design primitives);
 * next/link renders as a real anchor here, matching the repo convention.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const cache = new Map<string, React.ElementType>();
  const make = (tag: any): React.ElementType => {
    const cacheable = typeof tag === "string";
    if (cacheable && cache.has(tag)) return cache.get(tag)!;
    const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        whileDrag,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        layout,
        layoutId,
        custom,
        viewport,
        onAnimationStart,
        onAnimationComplete,
        onUpdate,
        children,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    if (cacheable) cache.set(tag, Comp);
    return Comp;
  };
  const m: any = new Proxy(
    { create: (tag: any) => make(tag) },
    {
      get(target, prop) {
        if (prop === "create") return (target as any).create;
        if (typeof prop === "symbol") return undefined;
        return make(prop as string);
      },
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
    useInView: () => false,
    useMotionValue: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useSpring: (v: any) => ({ set: () => {}, get: () => v, on: () => () => {} }),
    useTransform: () => ({ set: () => {}, get: () => 0, on: () => () => {} }),
  };
});

import { AiNativeBundleShowcase } from "./bundle-showcase";

/** The left-hand list buttons carry `aria-pressed`; DOM order == list order. */
function listButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    container.querySelectorAll("button[aria-pressed]"),
  ) as HTMLButtonElement[];
}

/** The detail pane's title is the single <h3> on the page. */
function detailTitle(): string {
  return screen.getByRole("heading", { level: 3 }).textContent ?? "";
}

afterEach(() => {
  cleanup();
});

describe("<AiNativeBundleShowcase> list render", () => {
  it("renders one aria-pressed button per real bundle item", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    expect(listButtons(container)).toHaveLength(AI_NATIVE_BUNDLE_ITEMS.length);
  });

  it("labels each list row with its padded index, title and count", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    const buttons = listButtons(container);
    AI_NATIVE_BUNDLE_ITEMS.forEach((item, i) => {
      const text = buttons[i].textContent ?? "";
      expect(text).toContain(String(i + 1).padStart(2, "0"));
      expect(text).toContain(item.title);
      expect(text).toContain(item.count);
    });
  });

  it("exposes the free-access block and the course CTA link", () => {
    render(<AiNativeBundleShowcase />);
    expect(screen.getByText("Kostenlos")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Kurs starten/ });
    expect(cta).toHaveAttribute("href", "/ai-native/kurs/modul_1");
  });
});

describe("<AiNativeBundleShowcase> active selection", () => {
  it("defaults to the first item selected", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    const first = AI_NATIVE_BUNDLE_ITEMS[0];

    expect(detailTitle()).toBe(first.title);
    expect(screen.getByText(first.description)).toBeInTheDocument();
    expect(screen.getByText("Baustein 01")).toBeInTheDocument();

    const buttons = listButtons(container);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("re-points the detail pane and aria-pressed on click", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    const target = AI_NATIVE_BUNDLE_ITEMS[2];

    fireEvent.click(listButtons(container)[2]);

    expect(detailTitle()).toBe(target.title);
    expect(screen.getByText(target.description)).toBeInTheDocument();
    expect(screen.getByText("Baustein 03")).toBeInTheDocument();

    const buttons = listButtons(container);
    expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("activates an item on hover (mouseEnter)", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    const target = AI_NATIVE_BUNDLE_ITEMS[3];

    fireEvent.mouseEnter(listButtons(container)[3]);

    expect(detailTitle()).toBe(target.title);
    expect(screen.getByText("Baustein 04")).toBeInTheDocument();
  });

  it("activates an item on keyboard focus", () => {
    const { container } = render(<AiNativeBundleShowcase />);
    const target = AI_NATIVE_BUNDLE_ITEMS[1];

    fireEvent.focus(listButtons(container)[1]);

    expect(detailTitle()).toBe(target.title);
    expect(screen.getByText("Baustein 02")).toBeInTheDocument();
  });
});
