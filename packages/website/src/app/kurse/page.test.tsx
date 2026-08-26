import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(() => Promise.resolve(localeState.value)),
}));

vi.mock("./learning-atlas", () => ({
  LearningAtlas: ({ locale }: { readonly locale: "de" | "en" }) => (
    <div data-testid="learning-atlas" data-locale={locale} />
  ),
}));

import KursePage from "./page";

describe("course hub introduction", () => {
  beforeEach(() => {
    localeState.value = "de";
  });

  it("puts the diagnostic and learning atlas in the first route section", async () => {
    render(await KursePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /KI verstehen,\s*einsetzen und prüfen\./,
      }),
    ).toBeVisible();
    expect(
      screen.queryByText(/Vier Grundlagenkurse bilden das Fundament/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "In fünf Minuten einordnen" }),
    ).toHaveAttribute("href", "/ki-check");

    const diagnostic = screen.getByRole("link", {
      name: "In fünf Minuten einordnen",
    });
    const atlas = screen.getByTestId("learning-atlas");
    expect(
      diagnostic.compareDocumentPosition(atlas) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      screen.queryByText("Was ist der Unterschied?"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Lernangebote" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the compact entry path localized in English", async () => {
    localeState.value = "en";
    render(await KursePage());

    expect(
      screen.queryByText(/Four foundation courses establish the base/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Map it in five minutes" }),
    ).toHaveAttribute("href", "/en/ki-check");
    expect(screen.getByTestId("learning-atlas")).toHaveAttribute(
      "data-locale",
      "en",
    );
  });
});
