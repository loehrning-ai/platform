import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * section-reader.test.tsx (regression coverage)
 *
 * Drives the real <SectionReader>. It renders a lesson section's title +
 * read-time badge, the markdown body, an optional "Kernaussage" callout, an
 * always-present aria-live status region, and a mark-as-read toggle button. The
 * behaviour under test:
 *   - the read-time badge and title come straight from the section;
 *   - keyTakeaway renders the "Kernaussage" block only when present;
 *   - when not read, the button reads "Als gelesen markieren", is enabled, and
 *     clicking it fires onMarkRead(section.id); the status region stays empty;
 *   - when read, the button reads "Gelesen", is disabled, and the status region
 *     announces "Abschnitt als gelesen markiert" (accessibility and quality hardening 7f).
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
      <SectionReader section={baseSection} isRead={false} onMarkRead={() => {}} />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Was ist KI?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("~4 Min")).toBeInTheDocument();
    expect(
      screen.getByText("Ein einfacher Absatz zum Testen."),
    ).toBeInTheDocument();
  });

  it("renders the 'Kernaussage' callout when keyTakeaway is present", () => {
    render(
      <SectionReader section={baseSection} isRead={false} onMarkRead={() => {}} />,
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

  it("shows an enabled 'Als gelesen markieren' button and fires onMarkRead on click", () => {
    const onMarkRead = vi.fn();
    render(
      <SectionReader
        section={baseSection}
        isRead={false}
        onMarkRead={onMarkRead}
      />,
    );

    const button = screen.getByRole("button", { name: "Als gelesen markieren" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onMarkRead).toHaveBeenCalledTimes(1);
    expect(onMarkRead).toHaveBeenCalledWith("s1");

    // While unread the live region carries no announcement.
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Abschnitt als gelesen markiert",
    );
  });

  it("shows a disabled 'Gelesen' button and announces the read state when isRead", () => {
    render(
      <SectionReader section={baseSection} isRead onMarkRead={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Gelesen" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Abschnitt als gelesen markiert",
    );
  });

  it("does not call onMarkRead when the read button is already disabled", () => {
    const onMarkRead = vi.fn();
    render(
      <SectionReader section={baseSection} isRead onMarkRead={onMarkRead} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gelesen" }));
    // The button is disabled, so the click handler is a no-op.
    expect(onMarkRead).not.toHaveBeenCalled();
  });
});
