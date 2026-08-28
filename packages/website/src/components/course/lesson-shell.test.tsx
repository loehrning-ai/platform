/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";

/**
 * lesson-shell.test.tsx
 *
 * LessonShell is the structure-agnostic course workspace: persistent and
 * collapsible desktop rail, focus-trapped mobile drawer, inert-sibling sweep,
 * and reading/stage/workspace width contracts. Content-specific orchestration
 * remains covered in each course reader's tests.
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
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
  };
});

import {
  LESSON_SHELL_SIDEBAR_STORAGE_KEY,
  LessonShell,
  type LessonShellContentMode,
} from "./lesson-shell";
import {
  LEARNING_OWNER_INERT_ATTRIBUTE,
  LESSON_DRAWER_INERT_ATTRIBUTE,
} from "@/lib/a11y/shared-inert";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  document.body.innerHTML = "";
  try {
    window.localStorage.removeItem(LESSON_SHELL_SIDEBAR_STORAGE_KEY);
  } catch {
    // Some test runners intentionally disable durable browser storage.
  }
});

/** A controlled harness so tests can drive navOpen like a real consumer would. */
function Harness({
  navLabel = "Testnavigation",
  contentMode,
  collapseNavLabel,
  expandNavLabel,
}: {
  readonly navLabel?: string;
  readonly contentMode?: LessonShellContentMode;
  readonly collapseNavLabel?: string;
  readonly expandNavLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <LessonShell
      navOpen={open}
      onNavOpenChange={setOpen}
      navLabel={navLabel}
      contentMode={contentMode}
      collapseNavLabel={collapseNavLabel}
      expandNavLabel={expandNavLabel}
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

function DocumentHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header data-testid="site-header">
        <button type="button">Global control</button>
      </header>
      <main data-testid="site-main">
        <LessonShell
          navOpen={open}
          onNavOpenChange={setOpen}
          navLabel="Course navigation"
          sidebar={
            <nav aria-label="Course links">
              <button type="button">Lesson one</button>
            </nav>
          }
        >
          <button type="button">Course action</button>
        </LessonShell>
      </main>
      <footer
        data-testid="externally-locked-footer"
        inert
        {...{ [LEARNING_OWNER_INERT_ATTRIBUTE]: "true" }}
      >
        External lock
      </footer>
      <aside data-testid="independently-inert" inert>
        Independent lock
      </aside>
    </>
  );
}

describe("<LessonShell>", () => {
  it("renders the sidebar slot on desktop and the content slot, with the drawer closed", () => {
    render(<Harness />);
    expect(screen.getAllByText("Item A").length).toBeGreaterThan(0);
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();

    const shell = document.querySelector("[data-lesson-shell]");
    expect(shell).toHaveAttribute("data-content-mode", "stage");

    const desktopSidebar = document.querySelector(
      "[data-lesson-shell-desktop-sidebar]",
    );
    expect(desktopSidebar).toHaveClass(
      "hidden",
      "lg:block",
      "lg:w-60",
      "lg:sticky",
      "lg:h-[calc(100svh-7rem)]",
    );
    expect(desktopSidebar).toHaveAttribute("aria-label", "Testnavigation");
    expect(desktopSidebar).toHaveClass("border-foreground", "bg-card");
    expect(desktopSidebar).not.toHaveClass("md:block");
    expect(
      desktopSidebar?.querySelector(`#mobile-lesson-nav-desktop`),
    ).toHaveClass("overflow-y-auto");
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).toHaveClass("lg:hidden");
    const mobileToolbar = document.querySelector(
      "[data-lesson-shell-mobile-toolbar]",
    ) as HTMLElement;
    expect(mobileToolbar).toHaveClass("sticky", "top-28", "lg:hidden");
    expect(within(mobileToolbar).getByText("Testnavigation")).toBeVisible();
    expect(mobileToolbar).toHaveClass("border-foreground", "bg-card");
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).not.toHaveClass("fixed");

    const stage = document.querySelector("[data-lesson-stage]");
    expect(stage).toHaveClass("border-t-[3px]", "border-brand-orange");
  });

  it("collapses and expands the desktop sidebar with accessible state", () => {
    render(
      <Harness
        collapseNavLabel="Kursnavigation einklappen"
        expandNavLabel="Kursnavigation ausklappen"
      />,
    );

    const desktopSidebar = document.querySelector<HTMLElement>(
      "[data-lesson-shell-desktop-sidebar]",
    )!;
    const collapse = screen.getByRole("button", {
      name: "Kursnavigation einklappen",
    });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(collapse).toHaveAttribute("aria-controls");
    expect(desktopSidebar).toHaveAttribute("data-collapsed", "false");

    fireEvent.click(collapse);

    const expand = screen.getByRole("button", {
      name: "Kursnavigation ausklappen",
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(desktopSidebar).toHaveClass("lg:w-14");
    expect(desktopSidebar).toHaveAttribute("data-collapsed", "true");
    expect(within(desktopSidebar).queryByText("Item A")).toBeNull();

    fireEvent.click(expand);
    expect(
      screen.getByRole("button", { name: "Kursnavigation einklappen" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(desktopSidebar).toHaveClass("lg:w-60");
    expect(within(desktopSidebar).getByText("Item A")).toBeInTheDocument();
  });

  it("restores and updates the namespaced desktop sidebar preference", async () => {
    window.localStorage.setItem(LESSON_SHELL_SIDEBAR_STORAGE_KEY, "collapsed");
    render(<Harness />);

    const expand = await screen.findByRole("button", {
      name: "Seitenleiste ausklappen",
    });
    const desktopSidebar = document.querySelector<HTMLElement>(
      "[data-lesson-shell-desktop-sidebar]",
    )!;
    expect(desktopSidebar).toHaveClass("lg:w-14");

    fireEvent.click(expand);
    await waitFor(() => {
      expect(
        window.localStorage.getItem(LESSON_SHELL_SIDEBAR_STORAGE_KEY),
      ).toBe("expanded");
    });
    expect(desktopSidebar).toHaveClass("lg:w-60");
  });

  it("keeps server and first-client sidebar markup aligned", () => {
    window.localStorage.setItem(LESSON_SHELL_SIDEBAR_STORAGE_KEY, "collapsed");

    const markup = renderToString(
      <LessonShell
        navOpen={false}
        onNavOpenChange={() => undefined}
        navLabel="Testnavigation"
        sidebar={<nav>Server navigation</nav>}
      >
        <p>Server content</p>
      </LessonShell>,
    );

    expect(markup).toContain('data-collapsed="false"');
    expect(markup).toContain("Server navigation");
  });

  it("uses the stage width by default and supports reading and workspace modes", () => {
    const { rerender } = render(<Harness />);
    const content = document.querySelector("[data-lesson-shell-content]")!;
    expect(content).toHaveAttribute("data-content-mode", "stage");
    expect(content).toHaveClass("max-w-[1600px]");

    rerender(<Harness contentMode="reading" />);
    expect(content).toHaveAttribute("data-content-mode", "reading");
    expect(content).toHaveClass("max-w-3xl");

    rerender(<Harness contentMode="workspace" />);
    expect(content).toHaveAttribute("data-content-mode", "workspace");
    expect(content).toHaveClass("max-w-[1600px]");
  });

  it("opens the mobile drawer on toggle, traps focus, and closes on Escape", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(
      screen.getByRole("button", { name: "Navigation schließen" }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog", { name: "Testnavigation" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("lg:hidden", "z-[70]");
    expect(screen.getByRole("presentation")).toHaveClass("z-[60]");

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

  it("closes on backdrop click and restores focus to the toggle", async () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Navigation öffnen" });
    fireEvent.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // The backdrop is the presentation-role overlay behind the drawer.
    fireEvent.click(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Navigation öffnen" }),
      ).toHaveFocus(),
    );
  });

  it("closes an open mobile drawer when the viewport enters the lg desktop range", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let desktopMatches = false;
    const mediaQuery = {
      get matches() {
        return desktopMatches;
      },
      media: "(min-width: 1024px)",
      onchange: null,
      addEventListener: vi.fn(
        (_type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") {
            listeners.add(listener as (event: MediaQueryListEvent) => void);
          }
        },
      ),
      removeEventListener: vi.fn(
        (_type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") {
            listeners.delete(listener as (event: MediaQueryListEvent) => void);
          }
        },
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQuery),
    );

    render(<Harness />);
    const mainContent = screen
      .getByTestId("main-content")
      .closest("div")!.parentElement!;
    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mainContent).toHaveAttribute("inert");

    desktopMatches = true;
    act(() => {
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mainContent).not.toHaveAttribute("inert");
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the main content inert while the drawer is open, and restores it on close", () => {
    render(<Harness />);
    // The desktop aside's parent-of-parent is the main content wrapper — assert
    // on the rendered content directly, mirroring the real inert-sweep target.
    const mainContent = screen
      .getByTestId("main-content")
      .closest("div")!.parentElement!;
    expect(mainContent).not.toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(mainContent).toHaveAttribute("inert");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mainContent).not.toHaveAttribute("inert");
  });

  it("isolates ancestor siblings, contains scripted focus, and restores every inert owner exactly", async () => {
    render(<DocumentHarness />);
    const globalControl = screen.getByRole("button", {
      name: "Global control",
    });
    const siteHeader = screen.getByTestId("site-header");
    const footer = screen.getByTestId("externally-locked-footer");
    const independent = screen.getByTestId("independently-inert");

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Course navigation" });
    const close = within(dialog).getByRole("button", {
      name: "Navigation schließen",
    });

    expect(siteHeader).toHaveAttribute("inert");
    expect(siteHeader).toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE, "true");
    expect(footer).toHaveAttribute("inert");
    expect(footer).toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE, "true");
    expect(independent).toHaveAttribute("inert");
    expect(independent).toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE, "true");
    expect(screen.getByRole("presentation")).not.toHaveAttribute("inert");

    globalControl.focus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Navigation öffnen" }),
      ).toHaveFocus(),
    );
    expect(siteHeader).not.toHaveAttribute("inert");
    expect(siteHeader).not.toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE);
    expect(footer).toHaveAttribute("inert");
    expect(footer).toHaveAttribute(LEARNING_OWNER_INERT_ATTRIBUTE, "true");
    expect(footer).not.toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE);
    expect(independent).toHaveAttribute("inert");
    expect(independent).not.toHaveAttribute(LESSON_DRAWER_INERT_ATTRIBUTE);

    globalControl.focus();
    expect(globalControl).toHaveFocus();
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
