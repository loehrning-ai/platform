/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { useState } from "react";

/**
 * lesson-shell.test.tsx 
 *
 * LessonShell is the structure-agnostic mobile-nav-drawer chrome extracted
 * from lesson-layout.tsx: mobile toggle, backdrop, focus-trapped dialog
 * drawer, inert-sibling sweep, aria wiring. It knows nothing about lessons —
 * `sidebar` and `children` are opaque ReactNode slots — so any course plan's
 * bespoke content module can consume it. Content-specific orchestration
 * (active lesson, progress) stays covered end-to-end in lesson-layout.test.tsx,
 * which now renders through this same component.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_ONLY_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "custom",
    "viewport",
    "layout",
    "layoutId",
    "mode",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
        const rest: Record<string, unknown> = {};
        for (const key in props) {
          if (key !== "children" && !MOTION_ONLY_PROPS.has(key)) {
            rest[key] = props[key];
          }
        }
        return React.createElement(tag, { ...rest, ref }, props.children);
      });
      cache.set(tag, Comp);
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, prop) =>
        prop === "create"
          ? (tag: unknown) => make(typeof tag === "string" ? tag : "div")
          : typeof prop === "string"
            ? make(prop)
            : undefined,
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    useReducedMotion: () => true,
  };
});

import { LessonShell } from "./lesson-shell";

afterEach(cleanup);
beforeEach(() => {
  document.body.innerHTML = "";
});

/** A controlled harness so tests can drive navOpen like a real consumer would. */
function Harness({
  navLabel = "Testnavigation",
}: {
  readonly navLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <LessonShell
      navOpen={open}
      onNavOpenChange={setOpen}
      navLabel={navLabel}
      sidebar={
        <nav aria-label="Fake nav">
          <button type="button">Item A</button>
          <button type="button">Item B</button>
        </nav>
      }
    >
      <p data-testid="main-content">Main content</p>
    </LessonShell>
  );
}

describe("<LessonShell>", () => {
  it("renders the sidebar slot on desktop and the content slot, with the drawer closed", () => {
    render(<Harness />);
    expect(screen.getAllByText("Item A").length).toBeGreaterThan(0);
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the mobile drawer on toggle, traps focus, and closes on Escape", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(
      screen.getByRole("button", { name: "Navigation schließen" }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog", { name: "Testnavigation" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const items = within(dialog).getAllByRole("button");
    expect(items[0]).toHaveAccessibleName("Navigation schließen");
    expect(items[0]).toHaveFocus();
    items.at(-1)?.focus();
    fireEvent.keyDown(items.at(-1)!, { key: "Tab" });
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on backdrop click and restores focus to the toggle", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Navigation öffnen" });
    fireEvent.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // The backdrop is the presentation-role overlay behind the drawer.
    fireEvent.click(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Navigation öffnen" })).toHaveFocus();
  });

  it("marks the main content inert while the drawer is open, and restores it on close", () => {
    render(<Harness />);
    // The desktop aside's parent-of-parent is the main content wrapper — assert
    // on the rendered content directly, mirroring the real inert-sweep target.
    const mainContent = screen.getByTestId("main-content").closest("div")!.parentElement!;
    expect(mainContent).not.toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(mainContent).toHaveAttribute("inert");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mainContent).not.toHaveAttribute("inert");
  });

  it("wires aria-expanded and aria-controls on the toggle button", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Navigation öffnen" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls");

    fireEvent.click(toggle);
    const opened = screen.getByRole("button", { name: "Navigation schließen" });
    expect(opened).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog");
    expect(dialog.id).toBe(opened.getAttribute("aria-controls"));
  });
});
