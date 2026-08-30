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
  it("uses editorial 44px language targets without pill geometry", () => {
    navigationMock.pathname = "/kurse";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const group = screen.getByRole("group", { name: "Sprache" });
    expect(group.className).toContain("rounded-xl");
    expect(group.className).toContain(
      "shadow-[3px_3px_0_var(--color-brand-acid)]",
    );
    expect(group.className).not.toContain("rounded-full");
    for (const link of within(group).getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
      expect(link.className).toContain("text-xs");
      expect(link.className).not.toContain("rounded-full");
    }
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
      within(group).getByRole("link", { name: /Englische Oberfläche/ }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(
      within(group).getByRole("link", { name: /Englische Oberfläche/ }),
    ).toHaveAttribute("hreflang", "en");
    expect(
      within(group).getByRole("link", { name: /Englische Oberfläche/ }),
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
      within(group).getByRole("link", { name: /Englische Oberfläche/ }),
    ).toHaveAttribute("href", "/en");
  });

  it("preserves certificate data in the URL fragment across locale links", async () => {
    navigationMock.pathname = "/kurse/open-source/codex/verifizierung";
    window.location.hash = "#test_test-test";
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    const englishLink = within(
      screen.getByRole("group", { name: "Sprache" }),
    ).getByRole("link", { name: /Englische Oberfläche/ });
    await waitFor(() =>
      expect(englishLink).toHaveAttribute(
        "href",
        "/en/kurse/open-source/codex/verifizierung#test_test-test",
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
    ).getByRole("link", { name: /Englische Oberfläche/ });
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
    ).getByRole("link", { name: /Englische Oberfläche/ });
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
