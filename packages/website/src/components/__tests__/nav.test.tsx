import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Nav } from "../nav";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

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
    render(<Nav />);
    const brand = screen.getByRole("link", { name: /Startseite/ });
    expect(brand).toHaveAttribute("href", "/");
    expect(
      [...brand.querySelectorAll<HTMLElement>("[style]")].some(
        (element) => element.style.opacity === "0",
      ),
    ).toBe(false);
  });

  it("exposes exactly two dropdowns (Kurse, Ressourcen) plus Open Source and Über mich", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Kurse/);
    expect(text).toMatch(/Ressourcen/);
    expect(text).toMatch(/Open Source/);
    expect(text).toMatch(/Über mich/);
    // Open Source and Über mich are real top-level links, not dropdown items.
    const openSource = screen
      .getAllByRole("link", { name: /Open Source/ })
      .find((l) => l.getAttribute("href") === "/open-source");
    expect(openSource).toBeDefined();
    const ueber = screen
      .getAllByRole("link", { name: /Über mich/ })
      .find((l) => l.getAttribute("href") === "/ueber-mich");
    expect(ueber).toBeDefined();
  });

  it("server-renders a complete small-screen fallback for no-JavaScript users", () => {
    const { container } = render(<Nav />);
    const fallback = container.querySelector(".no-js-mobile-nav");
    expect(fallback).not.toBeNull();
    const hrefs = Array.from(fallback!.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/kurse",
        "/ki-fuehrerschein",
        "/ki-und-gesellschaft",
        "/eu-ai-act-kurs",
        "/ai-native",
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
    expect(container.querySelector(".no-js-primary-nav")).not.toBeNull();
  });

  it("keeps dropdown-only resource areas out of the top level", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    // Closed dropdowns: these labels are not visible as primary nav text.
    expect(text).not.toMatch(/^Praxisbeispiele$/m);
    expect(text).not.toMatch(/^Lernbücher$/m);
    expect(text).not.toMatch(/Glossar/);
  });

  it("Kurse dropdown holds the courses only — no KI-Check, no Open Source", () => {
    render(<Nav />);
    const menu = openDropdown(/Kurse/);
    const hrefs = within(menu)
      .getAllByRole("link")
      .map((i) => i.getAttribute("href"));
    expect(hrefs.length).toBe(5);
    expect(hrefs).toContain("/kurse");
    expect(hrefs).toContain("/ki-fuehrerschein");
    expect(hrefs).toContain("/ki-und-gesellschaft");
    expect(hrefs).toContain("/eu-ai-act-kurs");
    expect(hrefs).toContain("/ai-native");
    expect(hrefs).not.toContain("/ki-check");
    expect(hrefs).not.toContain("/open-source");
  });

  it("Ressourcen dropdown holds KI-Check plus the reading/applying resources", () => {
    render(<Nav />);
    const menu = openDropdown(/Ressourcen/);
    const hrefs = within(menu)
      .getAllByRole("link")
      .map((i) => i.getAttribute("href"));
    expect(hrefs).toEqual([
      "/ki-check",
      "/blog",
      "/buecher",
      "/demos",
      "/workshops",
    ]);
    within(menu)
      .getAllByRole("link")
      .forEach((i) => expect(i).toHaveAttribute("data-nav-menu-item", "true"));
  });

  it("does not render retired project/contact links in the nav", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Kontakt/);
    expect(text).not.toMatch(/Arbeitsweise/);
    expect(text).not.toMatch(/Über Tim/);
  });

  it("keeps navigation visible on /feedback", () => {
    navigationMock.pathname = "/feedback";
    render(<Nav />);
    expect(
      screen.getByRole("navigation", { name: "Hauptnavigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kurse/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ressourcen/ })).toBeInTheDocument();
  });

  it("contains scroll chaining inside the mobile navigation dialog", () => {
    render(<Nav />);
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

  it("closes the mobile dialog when Login navigation starts", () => {
    render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    const login = within(dialog).getByRole("link", { name: /login/i });

    fireEvent.click(login);

    expect(
      screen.queryByRole("dialog", { name: "Hauptnavigation" }),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(
      screen.getByRole("button", { name: "Menü öffnen" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the current top-level route for assistive navigation", () => {
    navigationMock.pathname = "/ueber-mich";
    render(<Nav />);
    const current = screen
      .getAllByRole("link", { name: /Über mich/ })
      .find((link) => link.getAttribute("href") === "/ueber-mich");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("ArrowDown on the Kurse trigger opens the menu and focuses the first item", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Kurse/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("akademie-nav-menu");
    expect(menu).not.toBeNull();
    const items = within(menu as HTMLElement).getAllByRole("link");
    expect(items[0]).toHaveFocus();
  });

  it("ArrowDown on the Ressourcen trigger opens its own menu and focuses its first item", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Ressourcen/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("ressourcen-nav-menu");
    expect(menu).not.toBeNull();
    const items = within(menu as HTMLElement).getAllByRole("link");
    expect(items[0]).toHaveFocus();
    expect(items[0]).toHaveAttribute("href", "/ki-check");
  });

  it("Escape inside the menu closes it and returns focus to the trigger", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Kurse/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("akademie-nav-menu");
    const items = within(menu as HTMLElement).getAllByRole("link");
    fireEvent.keyDown(items[0], { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ArrowDown/ArrowUp cycle focus and Home/End jump within the menu", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Kurse/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("akademie-nav-menu");
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
});
