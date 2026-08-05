import { createElement, forwardRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  const cache = new Map<string, unknown>();
  const motionOnly = new Set([
    "animate",
    "custom",
    "exit",
    "initial",
    "transition",
    "variants",
    "viewport",
    "whileInView",
  ]);

  const m = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
              const domProps: Record<string, unknown> = { ref };
              for (const [key, value] of Object.entries(props)) {
                if (!motionOnly.has(key)) domProps[key] = value;
              }
              if ("initial" in props) {
                domProps["data-motion-initial"] = JSON.stringify(props.initial);
              }
              if ("whileInView" in props) {
                domProps["data-motion-while-in-view"] = JSON.stringify(
                  props.whileInView,
                );
              }
              return createElement(tag, domProps);
            }),
          );
        }
        return cache.get(tag);
      },
    },
  );

  return { m };
});

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

vi.mock("@/lib/books", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/books")>();
  return {
    ...original,
    books: [original.allBooks[0], original.allBooks[1]],
  };
});

import { BuecherContent } from "./buecher-content";

describe("BuecherContent LCP loading policy", () => {
  it("does not hide the above-fold heading behind hydration", () => {
    render(<BuecherContent accountEnabled={false} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "data-motion-initial",
      "false",
    );
    expect(screen.getByText("Bücher")).toHaveAttribute(
      "data-motion-initial",
      "false",
    );
  });

  it("renders only the first card without the in-view hidden state", () => {
    render(<BuecherContent accountEnabled={false} />);

    const cards = screen.getAllByTestId("book-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute("data-motion-initial", "false");
    expect(cards[0]).not.toHaveAttribute("data-motion-while-in-view");
    expect(cards[1]).toHaveAttribute(
      "data-motion-initial",
      JSON.stringify({ opacity: 0, y: 20 }),
    );
    expect(cards[1]).toHaveAttribute(
      "data-motion-while-in-view",
      JSON.stringify({ opacity: 1, y: 0 }),
    );
    expect(cards[1]).toHaveClass("js-reveal");
  });

  it("marks every server-hidden public motion element for the no-script fallback", () => {
    const { container } = render(<BuecherContent accountEnabled={false} />);
    const hiddenMotionNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-motion-initial]"),
    ).filter((element) =>
      element.getAttribute("data-motion-initial")?.includes('"opacity":0'),
    );

    expect(hiddenMotionNodes.length).toBeGreaterThan(0);
    hiddenMotionNodes.forEach((element) =>
      expect(element).toHaveClass("js-reveal"),
    );
  });

  it("requests only the first cover eagerly and at high priority", () => {
    render(<BuecherContent accountEnabled={false} />);

    const covers = screen.getAllByRole("img", { name: /^Titelseite:/ });
    expect(covers).toHaveLength(2);
    expect(covers[0]).toHaveAttribute("loading", "eager");
    expect(covers[0]).toHaveAttribute("fetchpriority", "high");
    expect(covers[1]).toHaveAttribute("loading", "lazy");
    expect(covers[1]).not.toHaveAttribute("fetchpriority");
  });
});
