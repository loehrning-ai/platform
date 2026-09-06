import { readFileSync } from "node:fs";
import { join } from "node:path";
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
      "https://www.linkedin.com/in/tim-loehr-821ba8188/",
    );
    for (const link of [github, linkedIn]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(link.className).toContain("min-h-11");
    }
  });

  it("uses compact editorial geometry with a restrained Berlin backdrop", async () => {
    await renderFooter("de");

    const footer = document.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.querySelector(".bg-grid-dark")).toBeNull();
    expect(footer?.textContent).not.toMatch(
      /Freie Kurse, Workshops und quelloffene Materialien/,
    );
    expect(footer?.innerHTML).not.toMatch(/text-\[(?:9|10|11)px\]/);
    expect(footer).toHaveClass("dark-section");
    expect(footer?.innerHTML).toMatch(/rounded-(?:full|xl)|shadow-/);
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

describe("Footer link disclosure below lg", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("collapses the four link columns into a disclosure that starts closed", async () => {
    await renderFooter("de");

    const disclosure = screen.getByTestId("footer-group-disclosure");
    expect(disclosure.tagName).toBe("DETAILS");
    // Closed markup is what the first paint of a phone gets. An `open`
    // attribute here would restore the roughly 350px column stack the
    // disclosure exists to remove.
    expect(disclosure).not.toHaveAttribute("open");

    const summary = disclosure.querySelector("summary");
    expect(summary).not.toBeNull();
    expect(summary?.parentElement).toBe(disclosure);
    expect(summary).toHaveTextContent("Alle Bereiche");
    // The summary is the only way into the columns on a phone: 44px floor,
    // and a label at 14px rather than anything below the 12px typography floor.
    expect(summary?.className).toContain("min-h-11");
    expect(summary?.className).toContain("text-sm");

    const indicator = summary?.querySelector("[aria-hidden='true']");
    expect(indicator).toHaveTextContent("+");
  });

  it("labels the disclosure in reviewed English copy", async () => {
    await renderFooter("en");

    const disclosure = screen.getByTestId("footer-group-disclosure");
    expect(disclosure.querySelector("summary")).toHaveTextContent(
      "All sections",
    );
  });

  it("keeps every column destination inside the disclosure and the legal row outside it", async () => {
    await renderFooter("de");

    const disclosure = screen.getByTestId("footer-group-disclosure");
    for (const name of [
      "Alle Kurse",
      "Grundlagenpfad",
      "Technikkurse",
      "Lernbücher",
      "Workshops",
      "Praxisbeispiele",
      "Open Source",
      "Blog",
      "Über mich",
      "Hilfe",
      "Rückmeldung",
    ]) {
      expect(disclosure).toContainElement(screen.getByRole("link", { name }));
    }
    for (const heading of screen.getAllByRole("heading", { level: 2 })) {
      expect(disclosure).toContainElement(heading);
    }

    // Legal reachability never depends on opening anything.
    const legal = screen.getByRole("navigation", {
      name: "Rechtliche Informationen",
    });
    expect(disclosure).not.toContainElement(legal);
    for (const name of ["Impressum", "Datenschutz", "Lizenzrichtlinie"]) {
      expect(disclosure).not.toContainElement(
        screen.getByRole("link", { name }),
      );
    }
    expect(disclosure).not.toContainElement(
      screen.getByTestId("footer-copyright"),
    );
  });

  it("hands the desktop grid back unchanged from lg", async () => {
    await renderFooter("de");

    const disclosure = screen.getByTestId("footer-group-disclosure");
    // ::details-content is the only handle CSS has on a closed <details>.
    // Lifting the user-agent content-visibility there is what makes the grid
    // render at lg exactly as it did before the wrapper existed.
    expect(disclosure.className).toContain(
      "lg:[&::details-content]:[content-visibility:visible]",
    );
    expect(disclosure.className).toContain(
      "lg:[&::details-content]:[block-size:auto]",
    );

    // The summary disappears at lg only where that same pseudo-element is
    // supported. Without the @supports guard an older engine would hide the
    // summary and leave the columns unreachable.
    const summary = disclosure.querySelector("summary");
    expect(summary?.className).toContain(
      "lg:supports-[selector(::details-content)]:hidden",
    );

    const grid = disclosure.querySelector("summary + div");
    expect(grid?.className).toContain("grid-cols-2");
    expect(grid?.className).toContain("md:grid-cols-4");
    // Open-state breathing room below lg only; desktop spacing is untouched.
    expect(grid?.className).toContain("lg:pt-0");
  });

  it("opens and closes without any JavaScript in the footer", () => {
    const source = readFileSync(join(__dirname, "footer.tsx"), "utf8");

    expect(source).toMatch(/<details\b/);
    expect(source).toMatch(/<summary\b/);
    expect(source).not.toMatch(/["']use client["']/);
    expect(source).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
    expect(source).not.toMatch(/\son[A-Z][A-Za-z]*=/);
  });
});
