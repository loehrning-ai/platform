import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { Nav } from "../nav";
import { LocaleProvider } from "../i18n/locale-context";

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

  it("renders the brand link as one static lockup in the site face", () => {
    const { container } = renderGerman();
    const brand = screen.getByRole("link", { name: /Startseite/ });
    expect(brand).toHaveAttribute("href", "/");
    expect(brand).toHaveAccessibleName("loehrning.ai - Startseite");

    const mark = container.querySelector("[data-logo-mark]");
    expect(mark).toHaveClass("bg-mennige");
    expect(mark).toHaveTextContent("L");
    const wordmark = container.querySelector("[data-logo-wordmark]");
    expect(wordmark).toHaveTextContent(/^loehrning\.ai$/);
    // Werkzeichnung type rules: 700, sentence case, tracking no tighter than
    // -0.015em, and ink only (the square is the chrome's one Mennige mark).
    expect(wordmark).toHaveClass("font-bold", "tracking-[-0.015em]", "text-foreground");
    expect(brand.innerHTML).not.toMatch(
      /uppercase|font-black|Arial Black|brand-orange|rotate/,
    );
    // Nothing is driven by scroll: no inline transform, opacity or font.
    expect(brand.querySelectorAll("[style]")).toHaveLength(0);
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
    // Werkzeichnung: a square overlay sheet. The only shadow in the header is
    // the overlay token, because the menu floats over the page.
    expect(menu).toHaveClass("shadow-overlay", "border-foreground");
    expect(menu.className).not.toMatch(/\brounded-/);
    expect(menu.querySelectorAll("svg")).toHaveLength(0);
    // The sheet fits its rows instead of a fixed 256px of empty paper.
    expect(menu).toHaveClass("w-max");
    expect(menu).not.toHaveClass("w-64");
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
      within(menu).getByRole("link", { name: /Technik/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("uses an ink rule for the current group and a flat paper bar", () => {
    navigationMock.pathname = "/kurse";
    renderGerman();

    const trigger = screen.getByRole("button", { name: /Lernen/ });
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("border-b-foreground");
    expect(trigger.className).not.toContain("brand-orange text-foreground");
    const row = document.querySelector("[data-nav-header-row]");
    // Werkzeichnung: paper ground, one hairline at the bottom, no pill, no
    // shadow and no translucency at any width.
    expect(row).toHaveClass("bg-background", "border-b", "border-hairline");
    expect(row?.className).not.toMatch(/\brounded-|shadow-|backdrop-blur/);
  });

  it("marks the current menu row with an ink square and weight, not a coloured rule", () => {
    navigationMock.pathname = "/kurse";
    renderGerman();
    const menu = openDropdown(/Lernen/);
    const current = within(menu).getByRole("link", { name: "Alle Kurse" });
    expect(current).toHaveClass("font-semibold");
    const marker = current.querySelector('[data-nav-active-marker="true"]');
    expect(marker).toHaveAttribute("aria-hidden", "true");
    // The square hangs in the row's gutter, so it never indents the text.
    expect(marker).toHaveClass("absolute");
    expect(current).toHaveClass("relative");
    expect(menu.innerHTML).not.toMatch(/border-l-\[/);
  });

  it("draws every menu-row and language focus ring in Mennige, never as ring-inset", () => {
    // With the --color-inset theme token, Tailwind v4 compiles `ring-inset`
    // to a Beton ring colour as well, and that rule wins over
    // ring-brand-orange: the ring was 1.12:1 on paper. inset-ring keeps the
    // ring inside the target and in Mennige.
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
      expect(element.className).toContain(
        "focus-visible:inset-ring-brand-orange",
      );
      expect(element.className).not.toMatch(/\bring-inset\b/);
    }
  });

  it("is a flush band, --nav-h-compact below lg and --nav-h from lg", () => {
    renderGerman();
    const nav = document.querySelector("nav.no-js-primary-nav");
    const row = document.querySelector("[data-nav-header-row]");

    // The bar occupies exactly the offset <main> reserves at every width, so
    // it carries no outer inset of its own: content begins directly beneath.
    expect(nav).toHaveClass("w-full");
    expect(nav?.className).not.toMatch(/\b(?:lg:)?p[xt]-/);

    // The height comes from the token, never from a repeated pixel figure.
    expect(row).toHaveClass(
      "h-[var(--nav-h-compact)]",
      "lg:h-[var(--nav-h)]",
      "border-b",
      "w-full",
    );
    expect(row?.className).not.toMatch(/rounded|shadow|border-x|border-t\b/);
    // The header gutter is the page gutter, so the wordmark and the content
    // below start on the same x at every width.
    expect(row).toHaveClass("px-4", "sm:px-6");
  });

  it("separates the desktop places from the utilities, so DE never reads as a current page", () => {
    renderGerman();
    const desktop = document.querySelector<HTMLElement>(".js-desktop-nav");
    expect(desktop?.children).toHaveLength(2);
    const [places, utilities] = Array.from(desktop?.children ?? []);
    expect(
      within(places as HTMLElement).getByRole("button", { name: /Lernen/ }),
    ).toBeInTheDocument();
    expect(
      within(places as HTMLElement).queryByRole("group", { name: "Sprache" }),
    ).toBeNull();
    expect(
      within(utilities as HTMLElement).getByRole("group", { name: "Sprache" }),
    ).toBeInTheDocument();
    expect(utilities).toHaveClass("border-l", "border-hairline");
  });

  it("carries only the wordmark, the language switch and the menu button below lg", () => {
    const { container } = renderGerman();
    const row = container.querySelector("[data-nav-header-row]");
    const compact = container.querySelector<HTMLElement>(".js-compact-nav");
    expect(compact).not.toBeNull();

    // Brand link, desktop cluster, compact cluster. A fourth control in the
    // row would not fit the compact band at 320px.
    expect(row?.children).toHaveLength(3);
    expect(compact?.children).toHaveLength(2);
    expect(
      within(compact as HTMLElement).getByRole("group", { name: "Sprache" }),
    ).toBeInTheDocument();
    expect(
      within(compact as HTMLElement).getByRole("button", {
        name: "Menü öffnen",
      }),
    ).toBeInTheDocument();
  });

  it("derives the mobile dialog ceiling from the compact bar token", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const scroller = dialog.querySelector("div");
    expect(scroller?.className).toContain(
      "max-h-[calc(100dvh-var(--nav-h-compact)-1rem)]",
    );
  });

  it("Praxis contains only workshops and interactive examples", () => {
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
    // row now reads language switch first, close button second.
    expect(close).toHaveFocus();
    const links = within(dialog).getAllByRole("link");
    const first = links[0];
    expect(first).toHaveAttribute("hreflang", "de");
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

  it("puts the close button on the opener's side and shows one language switch while open", () => {
    const { container } = renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const close = within(dialog).getByRole("button", {
      name: "Menü schließen",
    });
    const headerRow = close.parentElement as HTMLElement;
    expect(headerRow.lastElementChild).toBe(close);
    expect(headerRow.firstElementChild).toHaveAttribute(
      "data-language-switch",
    );
    // The bar's own switch hides with the menu button behind the sheet.
    expect(
      container.querySelector(".js-compact-nav [data-language-switch]"),
    ).toHaveClass("invisible");
  });

  it("lines phone-sheet rows up with their group labels and hangs the marker in the gutter", () => {
    navigationMock.pathname = "/workshops";
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const current = within(dialog).getByRole("link", { name: "Workshops" });
    expect(current).toHaveClass("relative", "-mx-4", "px-4", "font-semibold");
    expect(
      current.querySelector('[data-nav-active-marker="true"]'),
    ).toHaveClass("absolute");
    // Rows inside the scrolling sheet draw their ring inside the row, where
    // the sheet cannot clip it.
    expect(current.className).toContain("focus-visible:inset-ring-2");
    expect(current.className).not.toMatch(/ring-offset|\bring-inset\b/);
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
      within(menu).getByRole("link", { name: "Technical courses" }),
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
        name: "Englische Oberfläche öffnen",
      }),
    ).toHaveAttribute("href", "/en");
  });
});
