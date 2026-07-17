import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Nav } from "../nav";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

describe("<Nav />", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
  });

  it("renders the brand link", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders Open Source, Workshops and Blog as primary nav links", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Open Source/);
    expect(text).toMatch(/Workshops/);
    expect(text).toMatch(/Blog/);
    expect(text).not.toMatch(/Glossar/);
    expect(text).not.toMatch(/KI-Check/);
  });

  it("does not render Demos, Vorlagen or Bücher as primary nav links", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/^Praxisbeispiele$/m);
    expect(text).not.toMatch(/^Arbeitsvorlagen$/m);
    expect(text).not.toMatch(/^Lernbücher$/m);
  });

  it("renders the Kurse dropdown trigger", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Kurse/);
  });

  it("contains scroll chaining inside the mobile navigation dialog", () => {
    render(<Nav />);
    const toggle = screen.getByRole("button", { name: "Menü öffnen" });
    toggle.focus();
    fireEvent.click(toggle);
    const dialog = screen.getByRole("dialog", { name: "Hauptnavigation" });
    expect(dialog).toHaveClass(
      "overscroll-contain",
    );
    const links = within(dialog).getAllByRole("link");
    expect(links[0]).toHaveFocus();
    links.at(-1)?.focus();
    fireEvent.keyDown(links.at(-1)!, { key: "Tab" });
    expect(links[0]).toHaveFocus();
    fireEvent.keyDown(links[0], { key: "Escape" });
    expect(toggle).toHaveFocus();
  });

  it("does not render the removed Ressourcen dropdown trigger", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Ressourcen/);
  });

  it("does not render project/profile links in primary navigation", () => {
    render(<Nav />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Über Tim/);
    expect(text).not.toMatch(/Kontakt/);
    expect(text).not.toMatch(/Arbeitsweise/);
  });

  it("keeps navigation visible on /feedback", () => {
    navigationMock.pathname = "/feedback";
    render(<Nav />);
    expect(
      screen.getByRole("navigation", { name: "Hauptnavigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Blog/ })).toBeInTheDocument();
  });

  it("exposes a course-only Kurse dropdown without the duplicate Open Source link", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Kurse/ });
    expect(trigger).toHaveAttribute("aria-controls", "akademie-nav-menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById("akademie-nav-menu");
    expect(menu).not.toBeNull();
    const items = within(menu as HTMLElement).getAllByRole("link");
    expect(items.length).toBe(6);
    const hrefs = items.map((item) => item.getAttribute("href"));
    expect(hrefs).toContain("/ki-check");
    expect(hrefs).toContain("/ki-und-gesellschaft");
    // Open Source is a top-level link only — no longer duplicated in the dropdown.
    expect(hrefs).not.toContain("/open-source");
    items.forEach((item) => expect(item).toHaveAttribute("data-nav-menu-item", "true"));
  });

  it("Workshops link has href /workshops in the nav", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link", { name: /Workshops/ });
    const found = links.some((l) => l.getAttribute("href") === "/workshops");
    expect(found).toBe(true);
  });

  it("marks the current primary route for assistive navigation", () => {
    navigationMock.pathname = "/blog/eu-ai-act-grundlagen";
    render(<Nav />);
    const current = screen
      .getAllByRole("link", { name: "Blog" })
      .find((link) => link.getAttribute("href") === "/blog");
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

  it("Escape inside the menu closes it and returns focus to the trigger", () => {
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Kurse/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = document.getElementById("akademie-nav-menu");
    expect(menu).not.toBeNull();
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
    expect(menu).not.toBeNull();
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
