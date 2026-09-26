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
    expect(screen.getByText("Ressourcen")).toBeInTheDocument();
    expect(
      screen.getByText(/Nachlesen, prüfen, übertragen/),
    ).toBeInTheDocument();
  });

  it("renders English resource copy and preserves the locale in every route", () => {
    const { container } = render(<Workflow locale="en" />);

    expect(
      screen.getByRole("heading", { name: "Read, test, transfer." }),
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

  it("gives each destination one path on a phone and never truncates a row", async () => {
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
    // Phone rows carry their own short line, one line at 320px.
    expect(screen.getByText("KI und Recht, mit Quellen")).toHaveClass("lg:hidden");
    // The Kopflinie heads the section below lg; the kicker is for assistive
    // tech only there.
    expect(screen.getByText("Ressourcen")).toHaveClass("max-lg:sr-only");
  });
});
