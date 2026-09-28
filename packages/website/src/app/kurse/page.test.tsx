import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "de" as "de" | "en" }));
const runtime = vi.hoisted(() => ({ account: false }));

vi.mock("@/lib/runtime-features", () => ({
  getRuntimeFeatures: () => ({ account: runtime.account }),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(() => Promise.resolve(localeState.value)),
}));

vi.mock("./learning-atlas", () => ({
  LearningAtlas: ({ locale, access }: {
    readonly locale: "de" | "en";
    readonly access: Readonly<Record<string, string>>;
  }) => (
    <div
      data-testid="learning-atlas"
      data-locale={locale}
      data-foundation-access={access["ki-fuehrerschein"]}
      data-public-access={access.claude}
    />
  ),
}));

import KursePage from "./page";
import { getWorkshops } from "@/lib/workshops";
import { numberWord } from "@/lib/courses/course-hub-copy";

describe("course hub introduction", () => {
  beforeEach(() => {
    localeState.value = "de";
    runtime.account = false;
  });

  it("puts the diagnostic and learning atlas in the first route section", async () => {
    render(await KursePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Kostenlose KI-Kurse für den Arbeitsalltag.",
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

    // Workshops appear once as the practical companion, with the registry
    // count, and the cost note states its facts in plain text.
    expect(
      screen.getByRole("heading", { level: 2, name: "Lieber an einem Fall arbeiten?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Workshops ansehen" }),
    ).toHaveAttribute("href", "/workshops");
    expect(
      screen.getByText(
        new RegExp(`In jedem der ${numberWord("de", getWorkshops("de").length)} Workshops`),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Kosten und Konto" }),
    ).toBeInTheDocument();
    // The cost note sits before the workshop band and offers one action.
    expect(
      screen.getByRole("link", { name: "Lernkonto anlegen" }),
    ).toHaveAttribute("href", "/konto");
    expect(screen.queryByRole("link", { name: "Über mich" })).toBeNull();
    const accessHeading = screen.getByRole("heading", { level: 2, name: "Kosten und Konto" });
    const band = document.querySelector("[data-kurse-workshops]") as HTMLElement;
    expect(
      accessHeading.compareDocumentPosition(band) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

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
      screen.getByRole("link", { name: "Find out in five minutes" }),
    ).toHaveAttribute("href", "/en/ki-check");
    expect(screen.getByTestId("learning-atlas")).toHaveAttribute(
      "data-locale",
      "en",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Free AI courses for everyday work." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See the workshops" }),
    ).toHaveAttribute("href", "/en/workshops");
  });

  it.each([false, true])("passes public access facts from server readiness %s", async (ready) => {
    runtime.account = ready;
    render(await KursePage());
    expect(screen.getByTestId("learning-atlas")).toHaveAttribute(
      "data-foundation-access",
      ready ? "account-required" : "unavailable",
    );
    expect(screen.getByTestId("learning-atlas")).toHaveAttribute("data-public-access", "open");
  });
});
