import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly prefetch?: boolean;
    readonly children?: ReactNode;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

import { Workflow } from "./workflow";

describe("Ressourcen section (Workflow)", () => {
  it("exposes the ressourcen-section anchor and heading", () => {
    render(<Workflow />);
    expect(screen.getByTestId("ressourcen-section")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Material zum Nachlesen und Ausprobieren",
      }),
    ).toBeInTheDocument();
    // No kicker; the acid pill is a fact.
    expect(screen.queryByText("Ressourcen")).not.toBeInTheDocument();
    expect(screen.getByText("5 Bereiche · ohne Konto")).toBeInTheDocument();
  });

  it("renders English resource copy and preserves the locale in every route", () => {
    const { container } = render(<Workflow locale="en" />);

    expect(
      screen.getByRole("heading", { name: "Material to read and try" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Learning books").closest("a")).toHaveAttribute(
      "href",
      "/en/buecher",
    );
    expect(screen.getByRole("link", { name: /Go to account/ })).toHaveAttribute(
      "href",
      "/en/konto",
    );
    expect(container.textContent).not.toMatch(
      /\b(?:Ressourcen|Lernbücher|Praxisbeispiele|Quellstand|Konto|Fortschritt)\b/,
    );
  });

  it("surfaces every supporting resource area as a single linked set", () => {
    render(<Workflow />);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ["Blog", "/blog"],
      ["Lernbücher", "/buecher"],
      ["Praxisbeispiele", "/demos"],
      ["Workshops", "/workshops"],
      ["Open Source", "/open-source"],
    ];
    for (const [label, href] of expected) {
      const link = screen.getByText(label).closest("a");
      expect(link).toHaveAttribute("href", href);
    }
    expect(
      screen.getByRole("list", { name: "Werkzeuge und Lernressourcen" }),
    ).toBeInTheDocument();
  });

  it("showcases the account feature without prefetching the protected route", () => {
    render(<Workflow />);
    expect(
      screen.getByText(
        /synchronisiert Fortschritt und Arbeitsbelege geräteübergreifend/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zum Konto/ })).toMatchObject({
      href: expect.stringMatching(/\/konto$/),
      dataset: expect.objectContaining({ prefetch: "false" }),
    });
  });

  it("stacks the account band below 360px instead of squeezing the sentence", () => {
    render(<Workflow />);
    const band = screen.getByRole("link", { name: /Zum Konto/ }).parentElement;
    // A rem query: it sorts after max-lg in Tailwind's cascade (a px query
    // would sort before it and lose), and it follows the browser font size.
    expect(band).toHaveClass("max-[22.5rem]:grid-cols-1");
  });

  it("gives each destination one path on a phone and never truncates a card", async () => {
    const { BOOK_RAIL_SHOWN } = await import("./mobile-rails");
    const { container } = render(<Workflow />);
    const rowFor = (href: string) =>
      container.querySelector(`a[href="${href}"]`)?.closest("li");
    // The demos rail above owns /demos below lg; /buecher only while the
    // books rail is shown (a rail of one is no rail).
    expect(rowFor("/demos")).toHaveClass("max-lg:hidden");
    expect(rowFor("/buecher")?.classList.contains("max-lg:hidden")).toBe(
      BOOK_RAIL_SHOWN,
    );
    for (const href of ["/blog", "/workshops", "/open-source"]) {
      expect(rowFor(href)).not.toHaveClass("max-lg:hidden");
    }
    expect(container.innerHTML).not.toContain("max-lg:truncate");
    // Every card carries its one short line at every width; no desktop-only
    // body repeats it.
    const short = screen.getByText("KI und Recht, mit Quellen");
    expect(short).not.toHaveClass("lg:hidden");
    expect(short.className).not.toMatch(/truncate|line-clamp/);
    expect(screen.queryByText("KI und Recht, mit Primärquellen.")).toBeNull();
    // Resource names are the pastel cards' 20px title (16px on a phone),
    // never a section-sized heading.
    const name = screen.getByText("Blog");
    expect(name).toHaveClass("text-xl", "max-lg:text-base");
    expect(name).not.toHaveClass("text-fluid-h3");
  });
});

describe("Ressourcen board: the paper look", () => {
  it("sets each destination on its own pastel card with an icon tile", () => {
    const { container } = render(<Workflow />);
    const cards = container.querySelectorAll("[data-home-resource-card]");
    expect(cards).toHaveLength(5);
    const tones = Array.from(cards).map((card) =>
      card.className.match(/bg-brand-[a-z]+\/\d+/)?.[0],
    );
    expect(new Set(tones).size).toBe(5);
    for (const card of cards) {
      expect(card.className).toContain("rounded-[1.5rem]");
      expect(card.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
    // The section itself is a peach wash, never a dark band.
    expect(screen.getByTestId("ressourcen-section")).toHaveClass(
      "bg-brand-peach/20",
    );
  });
});
