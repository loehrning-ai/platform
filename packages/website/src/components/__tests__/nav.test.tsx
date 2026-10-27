import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { Nav } from "../nav";
import { LocaleProvider } from "../i18n/locale-context";
import {
  EXAMPLE_ROUTES,
  LEARNING_ROUTES,
  OPEN_SOURCE_ROUTES,
  WORKSHOP_ROUTES,
} from "@/lib/navigation/site-sections";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

function renderGerman(children: ReactNode = <Nav />) {
  return render(<LocaleProvider locale="de">{children}</LocaleProvider>);
}

/** Open a desktop dropdown by its trigger label and return its menu element. */
function openDropdown(label: RegExp): HTMLElement {
  const trigger = screen.getByRole("button", { name: label });
  fireEvent.click(trigger);
  const menu = trigger.getAttribute("aria-controls");
  const el = menu ? document.getElementById(menu) : null;
  expect(el).not.toBeNull();
  return el as HTMLElement;
}

describe("<Nav />", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
  });

  it("renders the brand link as the studio lockup with a scroll-driven wordmark", () => {
    const { container } = renderGerman();
    const brand = screen.getByRole("link", { name: /Startseite/ });
    expect(brand).toHaveAttribute("href", "/");
    expect(brand).toHaveAccessibleName("loehrning.ai - Startseite");

    const mark = container.querySelector("[data-logo-mark]");
    expect(mark).toHaveClass("bg-brand-orange", "rounded-xl");
    expect(mark).toHaveTextContent("L");
    expect(
      container.querySelector("[data-logo-wordmark-leading-l]"),
    ).toHaveTextContent("L");
    expect(
      container.querySelector("[data-logo-wordmark-remainder]"),
    ).toHaveTextContent("OEHRNING.AI");
    // At the top of the page the whole lockup is visible: nothing starts
    // faded out.
    expect(
      [...brand.querySelectorAll<HTMLElement>("[style]")].some(
        (element) => element.style.opacity === "0",
      ),
    ).toBe(false);
    // The wordmark joins the tile from 360px; below that the compact bar
    // needs the room for the language pill and the menu button.
    const wordmark = container.querySelector("[data-logo-wordmark]");
    expect(wordmark).toHaveClass("hidden", "min-[360px]:flex", "uppercase");
    expect(wordmark).toHaveAttribute("translate", "no");
    // The leading L folds away in em, so the move matches every font size.
    expect(
      container.querySelector("[data-logo-wordmark-leading-l]"),
    ).toHaveClass("w-[0.64em]", "origin-right", "overflow-hidden");
  });

  it("exposes task-based disclosures plus direct Blog, Open Source, and Über mich links", () => {
    renderGerman();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Lernen/);
    expect(text).toMatch(/Praxis/);
    expect(text).toMatch(/Blog/);
    expect(text).toMatch(/Über mich/);
    expect(text).toMatch(/Open Source/);
    for (const [name, href] of [
      ["Blog", "/blog"],
      ["Open Source", "/open-source"],
      ["Über mich", "/ueber-mich"],
    ] as const) {
      expect(
        screen
          .getAllByRole("link", { name })
          .some((link) => link.getAttribute("href") === href),
      ).toBe(true);
    }
    expect(
      screen.getAllByRole("button", { name: /Lernen|Praxis/ }),
    ).toHaveLength(2);
    // The desktop row reads Lernen, Praxis, then the three direct places.
    const desktop = document.querySelector(".js-desktop-nav") as HTMLElement;
    const directHrefs = within(desktop)
      .getAllByRole("link")
      .filter((link) => !link.closest("[data-language-switch]"))
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/") && href !== "/login");
    expect(directHrefs).toEqual(["/blog", "/open-source", "/ueber-mich"]);
  });

  it("server-renders a complete small-screen fallback for no-JavaScript users", () => {
    const { container } = renderGerman();
    const fallback = container.querySelector(".no-js-mobile-nav");
    expect(fallback).not.toBeNull();
    const hrefs = Array.from(fallback!.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/kurse",
        "/kurse#lernpfad",
        "/kurse#tiefer-gehen",
        "/ki-check",
        "/blog",
        "/buecher",
        "/demos",
        "/workshops",
        "/open-source",
        "/ueber-mich",
        "/login",
      ]),
    );
    expect(fallback).toHaveClass("hidden");
    // The fallback is the sheet's own compact grid, not a stacked list, and
    // leaves GitHub to the footer.
    const grids = fallback!.querySelectorAll(".grid-flow-col.grid-cols-2");
    expect(grids).toHaveLength(3);
    for (const link of fallback!.querySelectorAll("a")) {
      expect(link.className).toContain("min-h-11");
      const host = new URL(link.getAttribute("href") ?? "", "https://loehrning.ai").hostname;
      expect(host).not.toMatch(/(?:^|\.)github\.com$/);
    }
    expect(container.querySelector(".js-desktop-nav")).not.toBeNull();
    expect(fallback!.querySelector("[data-language-switch]")).toBeNull();
    expect(
      container.querySelector(".js-compact-nav [data-language-switch]"),
    ).not.toBeNull();
    expect(container.querySelector(".no-js-primary-nav")).not.toBeNull();
  });

  it("keeps grouped learning and practice areas out of the top level", () => {
    renderGerman();
    const text = document.body.textContent ?? "";
    // Closed dropdowns: these labels are not visible as primary nav text.
    expect(text).not.toMatch(/^Praxisbeispiele$/m);
    expect(text).not.toMatch(/^Lernbücher$/m);
    expect(text).not.toMatch(/Glossar/);
  });

  it("Lernen links to the catalog collections, diagnostic, and books", () => {
    renderGerman();
    const menu = openDropdown(/Lernen/);
    const hrefs = within(menu)
      .getAllByRole("link")
      .map((i) => i.getAttribute("href"));
    expect(hrefs.length).toBe(5);
    expect(hrefs).toContain("/kurse");
    expect(hrefs).toContain("/kurse#lernpfad");
    expect(hrefs).toContain("/kurse#tiefer-gehen");
    expect(hrefs).toContain("/ki-check");
    expect(hrefs).toContain("/buecher");
    expect(hrefs).not.toContain("/open-source");
    // The studio dropdown: a rounded paper card with the soft hover shadow.
    expect(menu).toHaveClass("rounded-2xl", "bg-paper", "shadow-card-hover");
    expect(menu.querySelectorAll("svg")).toHaveLength(0);
  });

  it("marks only the canonical course link current on the course hub", () => {
    navigationMock.pathname = "/kurse";
    renderGerman();
    const menu = openDropdown(/Lernen/);
    const currentLinks = within(menu)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute("href", "/kurse");
    expect(
      within(menu).getByRole("link", { name: /Grundlagen/ }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(menu).getByRole("link", { name: /Visuelles Lernen/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("uses a copper rule for the current group, an opaque phone bar and a translucent studio pill", () => {
    navigationMock.pathname = "/kurse";
    renderGerman();

    const trigger = screen.getByRole("button", { name: /Lernen/ });
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("border-brand-orange");
    const row = document.querySelector("[data-nav-header-row]");
    // The studio pill is the desktop treatment only. Below lg the same row
    // is the flush companion bar: opaque paper, because a backdrop blur on a
    // fixed bar flickers in iOS WebKit while content scrolls under it. The
    // rounding, shadow, translucency and blur are lg-scoped.
    expect(row).toHaveClass(
      "bg-background",
      "lg:rounded-2xl",
      "lg:bg-background/85",
      "lg:shadow-card",
      "lg:backdrop-blur-xl",
    );
    expect(row?.className).not.toMatch(/(?<![:\w-])backdrop-blur/);
    expect(row?.className).not.toMatch(/(?<![:\w-])bg-background\/\d+/);
    // Never a dark surface.
    expect(row?.className).not.toMatch(/bg-(?:foreground|black|graphit)\b/);
  });

  it("marks the current menu row with a copper rule and ink text", () => {
    navigationMock.pathname = "/kurse";
    renderGerman();
    const menu = openDropdown(/Lernen/);
    const current = within(menu).getByRole("link", { name: "Alle Kurse" });
    expect(current).toHaveClass(
      "border-l-[3px]",
      "border-brand-orange",
      "text-foreground",
    );
    const other = within(menu).getByRole("link", { name: "KI-Check" });
    expect(other).toHaveClass("border-transparent", "text-muted-foreground");
  });

  it("draws every menu-row focus ring inside the row, never as ring-inset", () => {
    // With the --color-inset theme token, Tailwind v4 compiles `ring-inset`
    // to a Beton ring colour as well, and that rule wins over the intended
    // ring colour. inset-ring keeps the ring inside the target.
    renderGerman();
    const menu = openDropdown(/Lernen/);
    const focusables = [
      ...within(menu).getAllByRole("link"),
      ...within(
        document.querySelector(".js-desktop-nav") as HTMLElement,
      ).getAllByRole("link", { name: /Oberfläche|Sprache/ }),
    ];
    expect(focusables.length).toBeGreaterThan(5);
    for (const element of focusables) {
      expect(element.className).toContain("focus-visible:inset-ring-2");
      expect(element.className).toMatch(
        /focus-visible:inset-ring-brand-(?:orange|cobalt)/,
      );
      expect(element.className).not.toMatch(/\bring-inset\b/);
    }
  });

  it("is a flush --nav-h-compact band below lg and the studio pill from lg", () => {
    renderGerman();
    const nav = document.querySelector("nav.no-js-primary-nav");
    const row = document.querySelector("[data-nav-header-row]");

    // Below lg the bar occupies exactly the offset <main> reserves, so it may
    // carry no outer inset of its own: content begins directly beneath it.
    expect(nav).toHaveClass("w-full", "lg:px-3", "lg:pt-2");
    expect(nav).not.toHaveClass("px-2");
    expect(nav).not.toHaveClass("pt-2");

    // The height comes from the token, never from a repeated pixel figure.
    expect(row).toHaveClass("h-[var(--nav-h-compact)]", "border-b");
    expect(row).not.toHaveClass("rounded-2xl");
    expect(row).not.toHaveClass("shadow-card");
    expect(row).toHaveClass(
      "lg:h-12",
      "lg:rounded-2xl",
      "lg:border-x",
      "lg:border-t",
      "max-w-6xl",
    );
  });

  it("keeps the desktop cluster a size container so a zoomed layout never overflows", () => {
    renderGerman();
    const desktop = document.querySelector<HTMLElement>(".js-desktop-nav");
    expect(desktop).toHaveClass("@container/desktop-nav", "lg:flex-1");
    const github = within(desktop as HTMLElement).getByRole("link", {
      name: "loehrning-ai auf GitHub",
    });
    expect(github).toHaveClass("@max-[44rem]/desktop-nav:hidden");
  });

  it("carries only the brand, the language pill and the menu button below lg", () => {
    const { container } = renderGerman();
    const row = container.querySelector("[data-nav-header-row]");
    const compact = container.querySelector<HTMLElement>(".js-compact-nav");
    expect(compact).not.toBeNull();

    // Brand link, desktop cluster, compact cluster. A fourth control in the
    // row would not fit the compact band at 320px.
    expect(row?.children).toHaveLength(3);
    expect(compact?.children).toHaveLength(2);
    const [pill, menuButton] = Array.from(compact?.children ?? []);
    expect(pill).toHaveAttribute("role", "group");
    expect(pill).toHaveAccessibleName("Sprache");
    expect(
      within(pill as HTMLElement).getByRole("link", {
        name: "EN, englische Oberfläche öffnen",
      }),
    ).toHaveAttribute("href", "/en");
    expect(menuButton).toHaveAccessibleName("Menü öffnen");
    // The menu button sits on the flush bar's top edge, so its ring is drawn
    // inside the target where the viewport cannot clip it.
    expect(menuButton.className).toContain("focus-visible:inset-ring-2");
    expect(menuButton).toHaveClass("min-h-11", "min-w-11");
  });

  it("ends the phone sheet above the tab bar band, derived from the tokens", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    // The sheet lies over the compact bar from the top edge and stops at the
    // tab bar band, so the tab bar is never covered. Both figures come from
    // the shell tokens, never from a repeated pixel value.
    expect(dialog).toHaveClass(
      "top-0",
      "max-h-[calc(100dvh-var(--tabbar-band-h))]",
    );
    const header = dialog.querySelector("[data-mobile-menu-header]");
    expect(header).toHaveClass("h-[var(--nav-h-compact)]");
    // Only the link list scrolls (landscape phones), never the header row.
    const list = header?.nextElementSibling;
    expect(list).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(header).toHaveClass("shrink-0");
  });

  it("Praxis contains only workshops and applied examples", () => {
    renderGerman();
    const menu = openDropdown(/Praxis/);
    const hrefs = within(menu)
      .getAllByRole("link")
      .map((i) => i.getAttribute("href"));
    expect(hrefs).toEqual(["/workshops", "/demos"]);
    within(menu)
      .getAllByRole("link")
      .forEach((i) => expect(i).toHaveAttribute("data-nav-menu-item", "true"));
  });

  it("does not hide Blog or Über mich inside a disclosure", () => {
    renderGerman();
    expect(screen.queryByRole("button", { name: /Wissen/ })).toBeNull();
    expect(document.getElementById("wissen-nav-menu")).toBeNull();
  });

  it("does not render retired project/contact labels in the nav", () => {
    renderGerman();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Kontakt/);
    expect(text).not.toMatch(/Arbeitsweise/);
  });

  it("keeps navigation visible on /feedback", () => {
    navigationMock.pathname = "/feedback";
    renderGerman();
    expect(
      screen.getByRole("navigation", { name: "Hauptnavigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lernen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Praxis/ })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Blog" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Über mich" }).length,
    ).toBeGreaterThan(0);
  });

  it("contains scroll chaining inside the mobile navigation dialog", () => {
    renderGerman();
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    toggle.focus();
    fireEvent.click(toggle);
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    expect(dialog).toHaveClass("overscroll-contain");
    const close = within(dialog).getByRole("button", {
      name: "Menü schließen",
    });
    // Initial focus lands on the close button, although the sheet's header
    // row reads brand link and language pill first, close button last.
    expect(close).toHaveFocus();
    const links = within(dialog).getAllByRole("link");
    const first = links[0];
    expect(first).toHaveAttribute("href", "/");
    // Tab from the last control wraps to the first one in reading order,
    // Shift+Tab from the first wraps back to the last.
    links.at(-1)?.focus();
    fireEvent.keyDown(links.at(-1)!, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(links.at(-1)).toHaveFocus();
    fireEvent.keyDown(links.at(-1)!, { key: "Escape" });
    expect(toggle).toHaveFocus();
  });

  it("puts the close button where the menu button was, beside the same language pill", () => {
    const { container } = renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const close = within(dialog).getByRole("button", {
      name: "Menü schließen",
    });
    // The sheet's header row is the compact bar again: same height token and
    // gutter, so the X lands on the menu button's 44px square.
    const header = dialog.querySelector<HTMLElement>(
      "[data-mobile-menu-header]",
    );
    const barRow = container.querySelector("[data-nav-header-row]");
    expect(header).toHaveClass("h-[var(--nav-h-compact)]", "px-3", "sm:px-5");
    expect(barRow).toHaveClass("h-[var(--nav-h-compact)]", "px-3", "sm:px-5");
    expect(header?.lastElementChild?.lastElementChild).toBe(close);
    expect(close.className).toContain("min-h-11");
    expect(close.className).toContain("min-w-11");
    expect(
      within(header as HTMLElement).getByRole("link", {
        name: "loehrning.ai - Startseite",
      }),
    ).toHaveAttribute("href", "/");
    // The pill in the sheet lies exactly over the bar's pill, which hides
    // while the sheet is open, so exactly one language control is visible.
    expect(
      within(header as HTMLElement).getByRole("group", { name: "Sprache" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".js-compact-nav [data-language-switch]"),
    ).toHaveClass("invisible");
    // Sign-in is the cobalt pill at the foot of the links, never ink-filled.
    const login = within(dialog).getByRole("link", { name: "Anmelden" });
    expect(login).toHaveAttribute("href", "/login");
    expect(login).toHaveClass("bg-brand-cobalt", "w-full", "min-h-11");
    expect(login.className).not.toMatch(/bg-(?:foreground|black|graphit)\b/);
  });

  it("lays every phone-menu group out as a two-column grid read down each column", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const grids = Array.from(
      dialog.querySelectorAll<HTMLElement>(".grid-cols-2"),
    );
    // Lernen, Praxis, and the direct links.
    expect(grids).toHaveLength(3);
    // From sm (landscape phones) the groups stand side by side as single
    // columns, so the sheet never scrolls inside a 390px-high screen.
    const groups = grids[0].parentElement?.parentElement;
    expect(groups).toHaveClass("sm:grid", "sm:grid-cols-3");
    for (const grid of grids) {
      expect(grid).toHaveClass(
        "sm:grid-flow-row",
        "sm:grid-cols-1",
        "sm:grid-rows-none",
      );
      expect(grid.parentElement).toHaveClass("sm:border-t-0");
    }
    let rows = 0;
    for (const grid of grids) {
      expect(grid).toHaveClass("grid", "grid-flow-col");
      const cells = grid.querySelectorAll("a");
      const rowClass = Array.from(grid.classList).find((name) =>
        /^grid-rows-\d$/.test(name),
      );
      expect(rowClass, "every grid names its row count").toBeDefined();
      const rowCount = Number(rowClass?.slice("grid-rows-".length));
      // Column-major: the rows are half the cells, rounded up.
      expect(rowCount).toBe(Math.ceil(cells.length / 2));
      rows += rowCount;
      for (const cell of cells) {
        expect(cell.className).toContain("min-h-11");
      }
    }
    // Six 44px rows, the group labels and the sign-in pill are what fits
    // 320x568 above the tab bar with the header row.
    expect(rows).toBeLessThanOrEqual(6);
    // GitHub lives in the footer and on /open-source, not in the sheet.
    expect(
      within(dialog)
        .getAllByRole("link")
        .some((link) =>
          /(?:^|\.)github\.com$/.test(
            new URL(link.getAttribute("href") ?? "", "https://loehrning.ai").hostname,
          ),
        ),
    ).toBe(false);
  });

  it("labels the phone-menu groups in copper mono capitals", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const labels = Array.from(dialog.querySelectorAll("section > p")).filter(
      (label) => label.getAttribute("aria-hidden") !== "true",
    );
    expect(labels.map((label) => label.textContent)).toEqual([
      "Lernen",
      "Praxis",
    ]);
    for (const label of labels) {
      expect(label).toHaveClass(
        "font-ui-mono",
        "uppercase",
        "text-xs",
        "text-brand-orange",
      );
    }
    const cells = dialog.querySelectorAll("section .grid a");
    expect(cells).toHaveLength(10);
    for (const cell of cells) {
      expect(cell).toHaveClass("text-sm", "min-h-11", "border-l-[3px]");
    }
  });

  it("closes the phone menu from a tap on the scrim beside the sheet", () => {
    renderGerman();
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    fireEvent.click(toggle);
    const scrim = document.querySelector("[data-mobile-menu-scrim]");
    expect(scrim).toHaveAttribute("aria-hidden", "true");
    expect(scrim).toHaveClass("fixed", "inset-0", "lg:hidden");
    fireEvent.click(scrim as Element);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the current phone-sheet row with the copper rule and an inset focus ring", () => {
    navigationMock.pathname = "/workshops";
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const current = within(dialog).getByRole("link", { name: "Workshops" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass(
      "border-l-[3px]",
      "border-brand-orange",
      "text-foreground",
    );
    // Rows inside the scrolling sheet draw their ring inside the row, where
    // the sheet cannot clip it.
    expect(current.className).toContain("focus-visible:inset-ring-2");
    expect(current.className).not.toMatch(/ring-offset|\bring-inset\b/);
  });

  it("veils the page behind the phone sheet in paper, never in black", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const scrim = document.querySelector("[data-mobile-menu-scrim]");
    expect(scrim?.className).toMatch(/\bbg-background\//);
    expect(scrim?.className).not.toMatch(/bg-(?:foreground|black|graphit)/);
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    expect(dialog).toHaveClass("bg-paper", "rounded-b-2xl");
  });

  it("removes the background from navigation and the accessibility tree while mobile is open", () => {
    const { container } = renderGerman(
      <>
        <Nav />
        <main>Inhalt</main>
        <footer>Fußzeile</footer>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));

    expect(container.querySelector("main")).toHaveAttribute("inert");
    expect(container.querySelector("footer")).toHaveAttribute("inert");
    expect(container.querySelector("[data-nav-header-row]")).toHaveAttribute(
      "inert",
    );
  });

  it("removes the companion tab bar from the accessibility tree with it", () => {
    const { container } = renderGerman(
      <>
        <Nav />
        <main>Inhalt</main>
        <nav data-mobile-tab-bar="true" aria-label="Schnellnavigation" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));

    expect(container.querySelector("[data-mobile-tab-bar]")).toHaveAttribute(
      "inert",
    );
  });

  it("does not clear an unresolved learning-owner gate when the mobile dialog closes", () => {
    const { container } = renderGerman(
      <>
        <Nav />
        <main inert aria-busy="true" data-learning-owner-unresolved="true">
          Course
        </main>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Hauptnavigation" })).getByRole(
        "button",
        { name: "Menü schließen" },
      ),
    );

    const main = container.querySelector("main");
    expect(main).toHaveAttribute("inert");
    expect(main).toHaveAttribute("data-learning-owner-unresolved", "true");
    expect(main).not.toHaveAttribute("data-nav-menu-inert");
  });

  it("closes the mobile dialog when Anmelden navigation starts", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const login = within(dialog).getByRole("link", { name: "Anmelden" });

    fireEvent.click(login);

    expect(
      screen.queryByRole("dialog", { name: "Hauptnavigation" }),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByRole("button", { name: "Menü öffnen" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("marks the current direct navigation page", () => {
    navigationMock.pathname = "/ueber-mich";
    renderGerman();
    const current = screen
      .getAllByRole("link", { name: "Über mich" })
      .find((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveAttribute("href", "/ueber-mich");
  });

  it("dismisses a desktop disclosure when pointer interaction leaves it", () => {
    renderGerman();
    const trigger = screen.getByRole("button", { name: /Lernen/ });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ArrowDown on the Lernen trigger opens the menu and focuses the first item", () => {
    renderGerman();
    const trigger = screen.getByRole("button", { name: /Lernen/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("lernen-nav-menu");
    expect(menu).not.toBeNull();
    const items = within(menu as HTMLElement).getAllByRole("link");
    expect(items[0]).toHaveFocus();
  });

  it("ArrowDown on the Praxis trigger opens its own menu and focuses its first item", () => {
    renderGerman();
    const trigger = screen.getByRole("button", { name: /Praxis/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("praxis-nav-menu");
    expect(menu).not.toBeNull();
    const items = within(menu as HTMLElement).getAllByRole("link");
    expect(items[0]).toHaveFocus();
    expect(items[0]).toHaveAttribute("href", "/workshops");
  });

  it("Escape inside the menu closes it and returns focus to the trigger", () => {
    renderGerman();
    const trigger = screen.getByRole("button", { name: /Lernen/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("lernen-nav-menu");
    const items = within(menu as HTMLElement).getAllByRole("link");
    fireEvent.keyDown(items[0], { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ArrowDown/ArrowUp cycle focus and Home/End jump within the menu", () => {
    renderGerman();
    const trigger = screen.getByRole("button", { name: /Lernen/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("lernen-nav-menu");
    const items = within(menu as HTMLElement).getAllByRole("link");
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: "End" });
    expect(items[items.length - 1]).toHaveFocus();
    fireEvent.keyDown(items[items.length - 1], { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(items[items.length - 1]).toHaveFocus();
    fireEvent.keyDown(items[items.length - 1], { key: "Home" });
    expect(items[0]).toHaveFocus();
  });

  it("renders English global navigation and keeps internal links in /en", () => {
    navigationMock.pathname = "/en/kurse";
    render(
      <LocaleProvider locale="en">
        <Nav />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByRole("button", { name: "Learning" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    const menu = openDropdown(/^Learning$/);
    expect(
      within(menu).getByRole("link", { name: "All courses" }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(
      within(menu).getByRole("link", { name: "Visual learning" }),
    ).toHaveAttribute("href", "/en/kurse#tiefer-gehen");
    expect(screen.getAllByRole("link", { name: "Blog" })[0]).toHaveAttribute(
      "href",
      "/en/blog",
    );
    expect(
      screen.getAllByRole("link", { name: "About me" })[0],
    ).toHaveAttribute("href", "/en/ueber-mich");
  });

  it("keeps breakpoint-specific language controls in the header and one inside the mobile dialog", () => {
    render(
      <LocaleProvider locale="de">
        <Nav />
      </LocaleProvider>,
    );

    const headerRow = document.querySelector("[data-nav-header-row]");
    expect(
      within(headerRow as HTMLElement).getAllByRole("group", {
        name: "Sprache",
      }),
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const mobileLanguage = within(dialog).getByRole("group", {
      name: "Sprache",
    });
    expect(
      within(mobileLanguage).getByRole("link", {
        name: "EN, englische Oberfläche öffnen",
      }),
    ).toHaveAttribute("href", "/en");
  });

  it("marks the Lernen and Praxis groups from the site-section table", () => {
    for (const route of LEARNING_ROUTES) {
      navigationMock.pathname = `${route}/kapitel`;
      const { unmount } = renderGerman();
      expect(
        screen.getByRole("button", { name: /Lernen/ }),
        route,
      ).toHaveAttribute("aria-current", "true");
      expect(
        screen.getByRole("button", { name: /Praxis/ }),
        route,
      ).not.toHaveAttribute("aria-current");
      unmount();
    }
    for (const route of [...WORKSHOP_ROUTES, ...EXAMPLE_ROUTES]) {
      navigationMock.pathname = route;
      const { unmount } = renderGerman();
      expect(
        screen.getByRole("button", { name: /Praxis/ }),
        route,
      ).toHaveAttribute("aria-current", "true");
      expect(
        screen.getByRole("button", { name: /Lernen/ }),
        route,
      ).not.toHaveAttribute("aria-current");
      unmount();
    }
  });

  it("marks Open Source by its own direct link, not by the Praxis trigger", () => {
    for (const route of OPEN_SOURCE_ROUTES) {
      navigationMock.pathname = route;
      const { unmount } = renderGerman();
      expect(
        screen.getByRole("button", { name: /Praxis/ }),
      ).not.toHaveAttribute("aria-current");
      const desktop = document.querySelector(".js-desktop-nav") as HTMLElement;
      const link = within(desktop).getByRole("link", { name: "Open Source" });
      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveClass("border-brand-orange");
      unmount();
    }
  });
});
