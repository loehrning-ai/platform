import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * section-reader.test.tsx (regression coverage)
 *
 * Drives the real <SectionReader>. It renders a lesson section's title +
 * read-time badge, the markdown body, an optional "Kernaussage" callout, an
 * navigation-only section checkpoint. The
 * behaviour under test:
 *   - the read-time badge and title come straight from the section;
 *   - keyTakeaway renders the "Kernaussage" block only when present;
 *   - when open, the button says the section can be confirmed as reviewed and
 *     clicking it fires onMarkRead(section.id);
 *   - when checked, the disabled control states that the section was reviewed,
 *     without presenting the marker as mastery evidence.
 *
 * framer-motion is stubbed to plain elements (the "Gelesen" label is an m.span);
 * the MarkdownRenderer child is stubbed to a passthrough so this unit stays
 * focused on SectionReader's own logic (the markdown pipeline has its own test).
 * We omit `sources`/claimId so the legal-claim badge branch (its own
 * registry-backed component) stays out of scope.
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
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "layout",
    "layoutId",
    "viewport",
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

import { SectionReader } from "./section-reader";
import type { LessonSection } from "@/lib/course/types";

const baseSection: LessonSection = {
  id: "s1",
  title: "Was ist KI?",
  readTimeMinutes: 4,
  content: "Ein einfacher Absatz zum Testen.",
  keyTakeaway: "Die zentrale Aussage.",
};

afterEach(cleanup);

describe("<SectionReader>", () => {
  it("renders the section title, read-time badge and markdown body", () => {
    render(
      <SectionReader
        section={baseSection}
        isRead={false}
        onMarkRead={() => {}}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Was ist KI?" }),
    ).toHaveClass("min-w-0", "break-words");
    expect(screen.getByText("~4 Min")).toBeInTheDocument();
    expect(
      screen.getByText("Ein einfacher Absatz zum Testen."),
    ).toBeInTheDocument();
  });

  it("renders the 'Kernaussage' callout when keyTakeaway is present", () => {
    render(
      <SectionReader
        section={baseSection}
        isRead={false}
        onMarkRead={() => {}}
      />,
    );
    expect(screen.getByText("Kernaussage")).toBeInTheDocument();
    expect(screen.getByText("Die zentrale Aussage.")).toBeInTheDocument();
  });

  it("omits the 'Kernaussage' callout when keyTakeaway is absent", () => {
    const withoutTakeaway: LessonSection = {
      id: "s2",
      title: "Ohne Kernaussage",
      readTimeMinutes: 3,
      content: "Nur Text, keine Kernaussage.",
    };
    render(
      <SectionReader
        section={withoutTakeaway}
        isRead={false}
        onMarkRead={() => {}}
      />,
    );
    expect(screen.queryByText("Kernaussage")).toBeNull();
  });

  it("shows an enabled review checkpoint and fires onMarkRead on click", () => {
    const onMarkRead = vi.fn();
    render(
      <SectionReader
        section={baseSection}
        isRead={false}
        onMarkRead={onMarkRead}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Abschnitt als geprüft bestätigen",
    });
    expect(button).toBeEnabled();
    expect(button).toHaveClass("min-h-11");
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onMarkRead).toHaveBeenCalledTimes(1);
    expect(onMarkRead).toHaveBeenCalledWith("s1");
  });

  it("shows a disabled reviewed checkpoint without a mastery claim", () => {
    render(
      <SectionReader section={baseSection} isRead onMarkRead={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Abschnitt geprüft" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/beherrscht|mastered/i)).toBeNull();
  });

  it("does not call onMarkRead when the read button is already disabled", () => {
    const onMarkRead = vi.fn();
    render(
      <SectionReader section={baseSection} isRead onMarkRead={onMarkRead} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Abschnitt geprüft" }));
    // The button is disabled, so the click handler is a no-op.
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("renders English reader chrome when the English bundle is selected", () => {
    render(
      <SectionReader
        section={{
          ...baseSection,
          title: "What is AI?",
          content: "A short explanation.",
          keyTakeaway: "Check the system and its output.",
        }}
        isRead={false}
        locale="en"
        onMarkRead={() => {}}
      />,
    );

    expect(screen.getByText("~4 min")).toBeInTheDocument();
    expect(screen.getByText("Key point")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm section reviewed" }),
    ).toBeEnabled();
    expect(screen.queryByText("Kernaussage")).toBeNull();
  });
});
