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

  it("renders the brand link", () => {
    renderGerman();
    const brand = screen.getByRole("link", { name: /Startseite/ });
    expect(brand).toHaveAttribute("href", "/");
    expect(
      [...brand.querySelectorAll<HTMLElement>("[style]")].some(
        (element) => element.style.opacity === "0",
      ),
    ).toBe(false);
  });

  it("exposes task-based Lernen, Praxis, and Wissen groups plus Open Source", () => {
    renderGerman();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Lernen/);
    expect(text).toMatch(/Praxis/);
    expect(text).toMatch(/Wissen/);
    expect(text).toMatch(/Open Source/);
    // Open Source is the only editorial top-level link.
    const openSource = screen
      .getAllByRole("link", { name: /Open Source/ })
      .find((l) => l.getAttribute("href") === "/open-source");
    expect(openSource).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /Lernen|Praxis|Wissen/ }),
    ).toHaveLength(3);
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
        "/wie-ki-funktioniert",
        "/bekannte-grenzen",
        "/ueber-die-plattform",
        "/demos",
        "/workshops",
        "/open-source",
        "/ueber-mich",
        "/login",
      ]),
    );
    expect(fallback).toHaveClass("hidden");
    expect(container.querySelector(".js-desktop-nav")).not.toBeNull();
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

  it("Wissen contains explanations, editorial context, and platform limits", () => {
    renderGerman();
    const menu = openDropdown(/Wissen/);
    const hrefs = within(menu)
      .getAllByRole("link")
      .map((item) => item.getAttribute("href"));
    expect(hrefs).toEqual([
      "/wie-ki-funktioniert",
      "/blog",
      "/bekannte-grenzen",
      "/ueber-die-plattform",
      "/ueber-mich",
    ]);
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
    expect(screen.getByRole("button", { name: /Wissen/ })).toBeInTheDocument();
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
    expect(close).toHaveFocus();
    const links = within(dialog).getAllByRole("link");
    links.at(-1)?.focus();
    fireEvent.keyDown(links.at(-1)!, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Escape" });
    expect(toggle).toHaveFocus();
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

  it("closes the mobile dialog when Login navigation starts", () => {
    renderGerman();
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const login = within(dialog).getByRole("link", { name: /login/i });

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

  it("marks the current task group for assistive navigation", () => {
    navigationMock.pathname = "/ueber-mich";
    renderGerman();
    expect(screen.getByRole("button", { name: /Wissen/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
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
