import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, within } from "@testing-library/react";
import type { Locale } from "@/lib/i18n/locale";
import { ACCOUNT_COPY } from "../account-copy";
import { KontoVerwaltenSection } from "./verwalten";

function renderSettings(locale: Locale) {
  return render(
    <KontoVerwaltenSection copy={ACCOUNT_COPY[locale]} locale={locale} />,
  );
}

beforeEach(() => {
  cleanup();
});

describe("Konto verwalten region", () => {
  it("names export, reset and deletion and opens the workspace that performs them", () => {
    const { container } = renderSettings("de");

    const region = container.querySelector("#konto-verwalten") as HTMLElement;
    for (const name of [
      "Daten exportieren",
      "Kursfortschritt zurücksetzen",
      "Konto löschen",
    ]) {
      expect(
        within(region).getByRole("link", { name: new RegExp(`^${name}`) }),
      ).toHaveAttribute("href", "/konto/datenschutz");
    }
    expect(region).toHaveTextContent(
      "Löscht Konto, E-Mail-Adresse und serverseitigen Fortschritt dauerhaft.",
    );
  });

  it("marks deletion as the irreversible control", () => {
    const { container } = renderSettings("de");

    const region = container.querySelector("#konto-verwalten") as HTMLElement;
    const deletion = within(region).getByRole("link", {
      name: /^Konto löschen/,
    });
    expect(deletion.className).toContain("border-l-red-700");
    expect(
      within(region).getByRole("link", { name: /^Daten exportieren/ })
        .className,
    ).toContain("border-l-brand-orange");
  });

  it("keeps one privacy landmark with one link inside it", () => {
    const { container } = renderSettings("de");

    const region = container.querySelector("#konto-verwalten") as HTMLElement;
    const privacy = within(region).getByRole("navigation", {
      name: "Kontodatenschutz",
    });
    expect(
      within(privacy).getAllByRole("link").map((link) => link.textContent),
    ).toEqual(["Datenschutz und Datenverwaltung"]);
  });

  it("localizes the controls and the workspace href for the English mirror", () => {
    const { container } = renderSettings("en");

    const region = container.querySelector("#konto-verwalten") as HTMLElement;
    for (const name of ["Export data", "Reset course progress", "Delete account"]) {
      expect(
        within(region).getByRole("link", { name: new RegExp(`^${name}`) }),
      ).toHaveAttribute("href", "/en/konto/datenschutz");
    }
    expect(
      within(region).getByRole("navigation", { name: "Account privacy" }),
    ).toBeVisible();
  });

  it("keeps every control at the 44px floor and adds no second heading level", () => {
    const { container } = renderSettings("de");

    const region = container.querySelector("#konto-verwalten") as HTMLElement;
    for (const link of within(region).getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
    }
    // The account page asserts the exact list of level-2 headings, so this
    // region contributes exactly one.
    expect(within(region).getAllByRole("heading", { level: 2 })).toHaveLength(
      1,
    );
  });
});
