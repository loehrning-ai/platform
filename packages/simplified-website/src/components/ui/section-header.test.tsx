import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * section-header.test.tsx (regression coverage)
 *
 * SectionHeader's logic is conditional structure: the heading always renders as
 * an <h2>, the eyebrow + description paragraphs only render when their props are
 * given, `eyebrowColor` defaults to text-brand-orange, and `centered` (default
 * true) toggles the text-center wrapper class. framer-motion m.* is stubbed to
 * plain DOM elements so those decisions are what we assert.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileInView",
    "whileHover",
    "whileTap",
    "custom",
    "viewport",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      const Comp = React.forwardRef(function MotionMock(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref: any,
      ) {
        const rest: Record<string, unknown> = {};
        for (const key in props) {
          if (key !== "children" && !DROP.has(key)) rest[key] = props[key];
        }
        return React.createElement(tag, { ...rest, ref }, props.children);
      });
      cache.set(tag, Comp);
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    { get: (_t, tag: string) => make(tag) },
  );
  return { __esModule: true, m, motion: m };
});

import { SectionHeader } from "./section-header";

describe("<SectionHeader>", () => {
  it("always renders the heading as an <h2>", () => {
    render(<SectionHeader heading="Unsere Leistungen" />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Unsere Leistungen");
  });

  it("omits both paragraphs when neither eyebrow nor description is given", () => {
    const { container } = render(<SectionHeader heading="Nur Titel" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders the eyebrow paragraph with the default brand-orange color", () => {
    render(<SectionHeader eyebrow="Kapitel 1" heading="Titel" />);
    const eyebrow = screen.getByText("Kapitel 1");
    expect(eyebrow.tagName).toBe("P");
    expect(eyebrow.className).toContain("text-brand-orange");
  });

  it("honors a custom eyebrowColor instead of the default", () => {
    render(
      <SectionHeader
        eyebrow="Kapitel"
        heading="Titel"
        eyebrowColor="text-brand-sand"
      />,
    );
    const eyebrow = screen.getByText("Kapitel");
    expect(eyebrow.className).toContain("text-brand-sand");
    expect(eyebrow.className).not.toContain("text-brand-orange");
  });

  it("renders the description paragraph when provided", () => {
    render(
      <SectionHeader heading="Titel" description="Ein kurzer Untertitel." />,
    );
    expect(screen.getByText("Ein kurzer Untertitel.")).toBeInTheDocument();
  });

  it("centers the header by default and drops text-center when centered=false", () => {
    const { container, rerender } = render(<SectionHeader heading="T" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "text-center",
    );

    rerender(<SectionHeader heading="T" centered={false} />);
    expect((container.firstChild as HTMLElement).className).not.toContain(
      "text-center",
    );
  });
});
