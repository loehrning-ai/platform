import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

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

import { Footer } from "./footer";

async function renderFooter(locale: "de" | "en" = "de") {
  getRequestLocaleMock.mockResolvedValueOnce(locale);
  render(await Footer());
}

describe("Footer locale and information architecture", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders the German task groups and unprefixed internal links", async () => {
    await renderFooter("de");

    expect(
      screen.getByRole("navigation", { name: "Navigation in der Fußzeile" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Kurse", "Praxis", "Blog", "Über mich"]);
    expect(screen.getByRole("link", { name: "Alle Kurse" })).toHaveAttribute(
      "href",
      "/kurse",
    );
    expect(
      screen.getByRole("link", { name: "Grundlagenpfad" }),
    ).toHaveAttribute("href", "/kurse#lernpfad");
    expect(screen.getByRole("link", { name: "Technikkurse" })).toHaveAttribute(
      "href",
      "/kurse#tiefer-gehen",
    );
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(screen.getByRole("link", { name: "Über mich" })).toHaveAttribute(
      "href",
      "/ueber-mich",
    );

    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      "a[href^='/']",
    )) {
      expect(link.getAttribute("href")).not.toMatch(/^\/en(?:\/|$)/);
    }
  });

  it("renders reviewed English copy and preserves /en on every internal link", async () => {
    await renderFooter("en");

    expect(
      screen.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Courses", "Practice", "Blog", "About me"]);
    expect(
      screen.queryByText(/Free courses, workshops, and open-source materials/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All courses" })).toHaveAttribute(
      "href",
      "/en/kurse",
    );
    expect(
      screen.getByRole("link", { name: "Foundation path" }),
    ).toHaveAttribute("href", "/en/kurse#lernpfad");
    expect(
      screen.getByRole("link", { name: "Technical courses" }),
    ).toHaveAttribute("href", "/en/kurse#tiefer-gehen");

    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      "a[href^='/']",
    )) {
      expect(link.getAttribute("href")).toMatch(/^\/en(?:\/|#|$)/);
    }
    expect(
      screen.queryByText("Datenstand", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("keeps legal destinations separate and localized", async () => {
    await renderFooter("en");
    const legal = screen.getByRole("navigation", { name: "Legal information" });

    expect(
      within(legal).getByRole("link", { name: "Legal notice" }),
    ).toHaveAttribute("href", "/en/impressum");
    expect(
      within(legal).getByRole("link", { name: "Privacy" }),
    ).toHaveAttribute("href", "/en/datenschutz");
    expect(
      within(legal).getByRole("link", { name: "Licence policy" }),
    ).toHaveAttribute("href", "/en/open-source/lizenzrichtlinie");
  });
});

describe("Footer semantics and stable public dates", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders semantic external links with visible labels and new-tab context", async () => {
    await renderFooter("en");

    const github = screen.getByRole("link", {
      name: "GitHub (opens in a new tab)",
    });
    const linkedIn = screen.getByRole("link", {
      name: "LinkedIn (opens in a new tab)",
    });
    expect(github).toHaveAttribute("href", "https://github.com/loehrning-ai");
    expect(linkedIn).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/timloehr/",
    );
    for (const link of [github, linkedIn]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(link.className).toContain("min-h-11");
    }
  });

  it("uses compact editorial geometry without tiny labels or ambient backdrop", async () => {
    await renderFooter("de");

    const footer = document.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.querySelector(".bg-grid-dark")).toBeNull();
    expect(footer?.textContent).not.toMatch(
      /Freie Kurse, Workshops und quelloffene Materialien/,
    );
    expect(footer?.innerHTML).not.toMatch(/text-\[(?:9|10|11)px\]/);
    expect(footer?.innerHTML).not.toMatch(/rounded-full|shadow-/);
  });

  it("derives the copyright year from reviewed content instead of the wall clock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2042-01-01T00:00:00.000Z"));
    try {
      await renderFooter("de");
      expect(screen.getByTestId("footer-copyright")).toHaveTextContent(
        "© 2026 loehrning.ai · Tim Löhr",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks the reviewed update date as machine-readable in both locales", async () => {
    await renderFooter("en");
    const pill = screen.getByTestId("footer-data-pill");

    expect(pill).toHaveTextContent("Content date: Q3 2026");
    expect(pill).toHaveTextContent(/Updated: \d{4}-\d{2}-\d{2}/);
    expect(within(pill).getByText(/\d{4}-\d{2}-\d{2}/)).toHaveAttribute(
      "datetime",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("disables below-the-fold prefetch for every internal destination", async () => {
    await renderFooter("de");

    for (const link of document.querySelectorAll("a[href^='/']")) {
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });
});
