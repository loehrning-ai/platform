import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReaderFocusBar } from "./reader-focus-bar";

/**
 * reader-focus-bar.test.tsx
 *
 * The compact reader bar takes the bottom tab bar's band in reader focus mode
 * below lg. These tests pin its geometry contract (fixed to the bottom edge,
 * exactly the tab bar's height token, gone at lg), the accessible position,
 * and the two action shapes: a link that works without scripting and a button
 * that the no-script sheet removes.
 */

afterEach(() => {
  cleanup();
});

describe("<ReaderFocusBar>", () => {
  it("takes the tab bar's band below lg and is absent from the desktop layout", () => {
    render(<ReaderFocusBar position="3 / 12" />);

    const bar = document.querySelector("[data-reader-focus-bar]");
    expect(bar).toHaveClass(
      "fixed",
      "inset-x-0",
      "bottom-0",
      "z-40",
      "lg:hidden",
      "no-print",
      "pb-safe",
      "px-safe",
    );
    expect(bar?.querySelector("[data-reader-focus-bar-row]")).toHaveClass(
      "h-[var(--tabbar-h)]",
    );
    expect(screen.getByText("3 / 12")).toBeVisible();
    expect(document.querySelector("[data-reader-focus-action]")).toBeNull();
  });

  it("reads a full sentence in place of a bare fraction", () => {
    render(
      <ReaderFocusBar position="3 / 12" positionLabel="Kapitel 3 von 12" />,
    );

    expect(screen.getByText("3 / 12")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Kapitel 3 von 12")).toHaveClass("sr-only");
  });

  it("renders a link action with a 44px target whose name starts with the label", () => {
    render(
      <ReaderFocusBar
        position="3 / 12"
        action={{
          kind: "link",
          label: "Weiter",
          href: "/buecher/ki-landschaft/02_methodik",
          ariaLabel: "Weiter: Methodik",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Weiter: Methodik" });
    expect(link).toHaveAttribute("href", "/buecher/ki-landschaft/02_methodik");
    expect(link).toHaveTextContent("Weiter");
    expect(link).toHaveClass("min-h-11", "min-w-11");
    expect(link).not.toHaveClass("js-shell-only");
  });

  it("renders a button action that needs scripting and marks it for the no-script sheet", () => {
    const onSelect = vi.fn();
    render(
      <ReaderFocusBar
        position="Lektion 3 von 12"
        action={{ kind: "button", label: "Weiter", onSelect }}
      />,
    );

    const button = screen.getByRole("button", { name: "Weiter" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("min-h-11", "min-w-11", "js-shell-only");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("places extra controls between the position and the action", () => {
    render(
      <ReaderFocusBar
        position="3 / 12"
        action={{ kind: "link", label: "Weiter", href: "/buecher/x/02" }}
      >
        <button type="button">Inhalt</button>
      </ReaderFocusBar>,
    );

    const row = document.querySelector("[data-reader-focus-bar-row]");
    const order = Array.from(row?.children ?? []).map((child) =>
      child.hasAttribute("data-reader-focus-position")
        ? "position"
        : child.textContent,
    );
    expect(order).toEqual(["position", "Inhalt", "Weiter"]);
  });

  it("lets a standalone navigation action use the available row without truncating its label", () => {
    render(
      <ReaderFocusBar
        action={{ kind: "button", label: "Kapitelnavigation", onSelect: vi.fn() }}
      />,
    );

    const action = screen.getByRole("button", { name: "Kapitelnavigation" });
    expect(action).toHaveClass("max-w-full", "min-h-11");
    expect(action).not.toHaveClass("max-w-[60%]");
    const row = document.querySelector("[data-reader-focus-bar-row]");
    expect(row).toHaveClass("justify-end");
    expect(row?.children).toHaveLength(1);
    expect(screen.getByText("Kapitelnavigation")).toHaveClass(
      "whitespace-normal",
      "[overflow-wrap:anywhere]",
    );
    expect(screen.getByText("Kapitelnavigation")).not.toHaveClass("truncate");
  });

  it("reserves room for contents controls while retaining the full link label", () => {
    render(
      <ReaderFocusBar
        action={{ kind: "link", label: "Zur Kursübersicht", href: "/kurse" }}
      >
        <button type="button">Inhalt</button>
      </ReaderFocusBar>,
    );

    const action = screen.getByRole("link", { name: "Zur Kursübersicht" });
    expect(action).toHaveClass("max-w-[60%]", "min-h-11");
    expect(action).not.toHaveClass("max-w-full");
    expect(screen.getByText("Zur Kursübersicht")).toHaveClass(
      "whitespace-normal",
      "[overflow-wrap:anywhere]",
    );
    expect(screen.getByText("Zur Kursübersicht")).not.toHaveClass("truncate");
    expect(screen.getByRole("button", { name: "Inhalt" })).toBeVisible();
  });

  it("draws no second progress thread and uses only bounded motion", () => {
    const source = readFileSync(join(__dirname, "reader-focus-bar.tsx"), "utf8");

    expect(source).toContain("h-[var(--tabbar-h)]");
    expect(source).not.toContain("data-scroll-progress");
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/animate-|shadow-\[|hover:-translate/);
    expect(source).not.toMatch(/\b(?:56|48)px\b/);
    expect(source).not.toMatch(/"use client"/);
  });
});
