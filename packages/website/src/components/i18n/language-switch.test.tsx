import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { LanguageSwitch } from "./language-switch";
import { LocaleProvider } from "./locale-context";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";

const navigationMock = vi.hoisted(() => ({
  pathname: "/kurse",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

describe("<LanguageSwitch />", () => {
  it("renders the DE/EN pill with 44px targets and a visible active chip", () => {
    navigationMock.pathname = "/kurse";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const group = screen.getByRole("group", { name: "Sprache" });
    // The studio pill: a rounded paper capsule, not a full-round badge and
    // not a drop-shadowed chip.
    expect(group).toHaveClass("rounded-xl", "bg-paper", "border");
    expect(group.className).not.toMatch(/shadow-\[/);
    expect(group.className).not.toContain("rounded-full");
    // No padding around the 44px targets, so the capsule stays inside the
    // 48px header row.
    expect(group.className).not.toMatch(/\bp-0\.5\b|\bp-1\b/);
    for (const link of within(group).getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
      expect(link.className).toContain("text-xs");
      expect(link.className).not.toContain("rounded-full");
      // `ring-inset` is banned here: with the --color-inset theme token
      // Tailwind v4 also compiles it to a Beton ring colour that overrides
      // the intended one (1.12:1 on paper).
      expect(link.className).toContain("focus-visible:inset-ring-2");
      expect(link.className).toContain("focus-visible:inset-ring-brand-cobalt");
      expect(link.className).not.toMatch(/\bring-inset\b/);
    }
    // The active language carries the acid chip and the cobalt underline, so
    // the state is a shape as well as a colour; the other has neither.
    const german = within(group).getByRole("link", { name: /Deutsch/ });
    expect(german.querySelector("[data-language-chip='active']")).toHaveClass(
      "bg-brand-acid/85",
    );
    expect(german.querySelector("[data-language-underline]")).toHaveClass(
      "bg-brand-cobalt",
    );
    const english = within(group).getByRole("link", {
      name: /englische Oberfläche/,
    });
    expect(english.querySelector("[data-language-chip='active']")).toBeNull();
    expect(english.querySelector("[data-language-underline]")).toBeNull();
    // Never an ink-filled chip.
    expect(group.innerHTML).not.toMatch(/bg-(?:foreground|black|graphit)\b/);
  });

  it("starts every accessible name with the visible language code", () => {
    navigationMock.pathname = "/kurse";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );
    const group = screen.getByRole("group", { name: "Sprache" });
    const [german, english] = within(group).getAllByRole("link");
    expect(german).toHaveTextContent(/^DE$/);
    expect(german).toHaveAccessibleName("DE, Deutsch, Sprache");
    expect(english).toHaveTextContent(/^EN$/);
    expect(english).toHaveAccessibleName("EN, englische Oberfläche öffnen");
  });

  it("marks German active and links English to the equivalent prefixed path", () => {
    navigationMock.pathname = "/kurse";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const group = screen.getByRole("group", { name: "Sprache" });
    expect(
      within(group).getByRole("link", { name: /Deutsch/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(group).getByRole("link", { name: /Deutsch/ }),
    ).toHaveAttribute("hreflang", "de");
    expect(
      within(group).getByRole("link", { name: /englische Oberfläche/ }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(
      within(group).getByRole("link", { name: /englische Oberfläche/ }),
    ).toHaveAttribute("hreflang", "en");
    expect(
      within(group).getByRole("link", { name: /englische Oberfläche/ }),
    ).not.toHaveAttribute("lang");
  });

  it("marks English active and returns German to its unprefixed canonical URL", () => {
    navigationMock.pathname = "/en/workshops";
    render(
      <LocaleProvider locale="en">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const group = screen.getByRole("group", { name: "Language" });
    expect(
      within(group).getByRole("link", { name: /English/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(group).getByRole("link", { name: /English/ }),
    ).toHaveAttribute("hreflang", "en");
    expect(
      within(group).getByRole("link", { name: /German interface/ }),
    ).toHaveAttribute("href", "/workshops");
    expect(
      within(group).getByRole("link", { name: /German interface/ }),
    ).toHaveAttribute("hreflang", "de");
    expect(
      within(group).getByRole("link", { name: /German interface/ }),
    ).not.toHaveAttribute("lang");
  });

  it("falls back to locale roots for an unsafe pathname", () => {
    navigationMock.pathname = "//evil.example/path";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const group = screen.getByRole("group", { name: "Sprache" });
    expect(
      within(group).getByRole("link", { name: /Deutsch/ }),
    ).toHaveAttribute("href", "/");
    expect(
      within(group).getByRole("link", { name: /englische Oberfläche/ }),
    ).toHaveAttribute("href", "/en");
  });

  it("preserves certificate data in the URL fragment across locale links", async () => {
    navigationMock.pathname = "/kurse/open-source/data-infrastructure/verifizierung";
    window.location.hash = "#test_test-test";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const englishLink = within(
      screen.getByRole("group", { name: "Sprache" }),
    ).getByRole("link", { name: /englische Oberfläche/ });
    await waitFor(() =>
      expect(englishLink).toHaveAttribute(
        "href",
        "/en/kurse/open-source/data-infrastructure/verifizierung#test_test-test",
      ),
    );
    window.history.replaceState(null, "", "/");
  });

  it("preserves the current lesson query and fragment when switching languages", async () => {
    navigationMock.pathname = "/ki-fuehrerschein/kurs/block_1";
    window.history.replaceState(
      null,
      "",
      "/ki-fuehrerschein/kurs/block_1?step=2&mode=review#exercise",
    );
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const englishLink = within(
      screen.getByRole("group", { name: "Sprache" }),
    ).getByRole("link", { name: /englische Oberfläche/ });
    await waitFor(() =>
      expect(englishLink).toHaveAttribute(
        "href",
        "/en/ki-fuehrerschein/kurs/block_1?step=2&mode=review#exercise",
      ),
    );
    window.history.replaceState(null, "", "/");
  });

  it("refreshes its target after an in-place learning-goal change", async () => {
    navigationMock.pathname = "/kurse";
    window.history.replaceState(null, "", "/kurse?goal=start");
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const englishLink = within(
      screen.getByRole("group", { name: "Sprache" }),
    ).getByRole("link", { name: /englische Oberfläche/ });
    await waitFor(() =>
      expect(englishLink).toHaveAttribute("href", "/en/kurse?goal=start"),
    );

    window.history.replaceState(null, "", "/kurse?goal=data");
    notifyUrlStateChanged();
    await waitFor(() =>
      expect(englishLink).toHaveAttribute("href", "/en/kurse?goal=data"),
    );
    window.history.replaceState(null, "", "/");
  });
});
