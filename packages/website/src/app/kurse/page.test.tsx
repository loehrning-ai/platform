import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(() => Promise.resolve(localeState.value)),
}));

vi.mock("./course-gallery", () => ({
  CourseGallery: ({ locale }: { readonly locale: "de" | "en" }) => (
    <div data-testid="course-gallery">{locale}</div>
  ),
}));

vi.mock("./persona-filter", () => ({
  PersonaCourseLinks: ({ locale }: { readonly locale: "de" | "en" }) => (
    <nav aria-label="persona links" data-locale={locale} />
  ),
}));

import KursePage from "./page";

describe("course hub introduction", () => {
  beforeEach(() => {
    localeState.value = "de";
  });

  it("puts the diagnostic and learner routes directly before the catalogue", async () => {
    render(await KursePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /KI verstehen,\s*einsetzen und prüfen\./,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Vier Grundlagenkurse bilden den Lernpfad/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "In fünf Minuten einordnen" }),
    ).toHaveAttribute("href", "/ki-check");

    const personaLinks = screen.getByRole("navigation", {
      name: "persona links",
    });
    const gallery = screen.getByTestId("course-gallery");
    expect(
      personaLinks.compareDocumentPosition(gallery) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.queryByText("Was ist der Unterschied?")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Lernangebote" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the compact entry path localized in English", async () => {
    localeState.value = "en";
    render(await KursePage());

    expect(
      screen.getByText(/Four foundation courses form the learning path/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Map it in five minutes" }),
    ).toHaveAttribute("href", "/en/ki-check");
    expect(screen.getByRole("navigation", { name: "persona links" })).toHaveAttribute(
      "data-locale",
      "en",
    );
  });
});
