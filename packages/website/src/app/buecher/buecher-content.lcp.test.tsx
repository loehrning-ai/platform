import { createElement, forwardRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

describe("BuecherContent visibility, loading, and locale behavior", () => {
  it("renders the German heading and every card in the initial document state", () => {
    const { container } = render(
      <BuecherContent accountEnabled={false} locale="de" />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sachbücher mit sichtbaren Quellen und Grenzen.",
      }),
    ).toBeVisible();
    expect(screen.getAllByTestId("book-card")).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-motion-initial*="opacity"]').length,
    ).toBe(0);
    expect(container.querySelectorAll('[style*="opacity: 0"]').length).toBe(0);
  });

  it("requests only the first cover eagerly and at high priority", () => {
    render(<BuecherContent accountEnabled={false} locale="de" />);

    const covers = screen.getAllByRole("img", {
      name: /^Deutsche Titelseite:/,
    });
    expect(covers).toHaveLength(2);
    expect(covers[0]).toHaveAttribute("loading", "eager");
    expect(covers[0]).toHaveAttribute("fetchpriority", "high");
    expect(covers[1]).toHaveAttribute("loading", "lazy");
    expect(covers[1]).not.toHaveAttribute("fetchpriority");
  });

  it("renders reviewed English interface copy and locale-preserving page links", () => {
    const { container } = render(
      <BuecherContent accountEnabled={false} locale="en" />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Reference books with visible sources and limits.",
      }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Material language", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Open book and chapters" })[0],
    ).toHaveAttribute("href", "/en/buecher/ki-landschaft");
    expect(screen.getByRole("link", { name: "View courses" })).toHaveAttribute(
      "href",
      "/en/kurse",
    );

    const pageLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'),
    );
    expect(
      pageLinks.every((link) => link.getAttribute("href")?.startsWith("/en")),
    ).toBe(true);
  });

  it("localizes the cover-preview dialog and keeps its material language explicit", () => {
    render(<BuecherContent accountEnabled={false} locale="en" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open the cover preview for “AI in German SMEs”",
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Cover preview: AI in German SMEs",
    });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByText(
        "Source cover in German · English HTML reader",
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Open book and chapters" }),
    ).toHaveAttribute("href", "/en/buecher/ki-landschaft");
  });
});
