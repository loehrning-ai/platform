import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOTAL_QUESTIONS } from "@/lib/ki-check/questions";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import EinstiegPage, { generateMetadata } from "../einstieg/page";

async function renderPage(locale: "de" | "en" = "de") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await EinstiegPage());
}

describe("/einstieg locale content", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders the German learning structure and all 3 example cards", async () => {
    await renderPage("de");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Was ist Künstliche Intelligenz?",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("beispiel-cards")).toBeVisible();
    for (const id of ["gesicht", "route", "empfehlungen"] as const) {
      expect(screen.getByTestId(`beispiel-${id}`)).toBeVisible();
    }
    expect(
      screen.getByText(new RegExp(`${TOTAL_QUESTIONS} Fragen`)),
    ).toBeVisible();
    const primaryCard = screen
      .getByRole("heading", { level: 3, name: "KI-Check" })
      .closest("article");
    expect(primaryCard).not.toBeNull();
    expect(
      primaryCard?.querySelectorAll(".text-foreground").length,
    ).toBeGreaterThan(2);
  });

  it("renders reviewed English copy without German learner UI", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is artificial intelligence?",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Face recognition" }),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent(
      "Wie möchtest du weitermachen?",
    );
  });

  it("preserves the active locale across every internal link", async () => {
    await renderPage("en");

    const internalHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href?.startsWith("/")));

    expect(internalHrefs).toEqual(
      expect.arrayContaining([
        "/en/ueber-mich",
        "/en/ki-check",
        "/en/ki-fuehrerschein",
        "/en/wie-ki-funktioniert",
      ]),
    );
    expect(internalHrefs.every((href) => href.startsWith("/en/"))).toBe(true);
  });

  it.each([
    ["de", "/einstieg", "Was ist KI? Ein Einstieg ohne Vorwissen", "de_DE"],
    [
      "en",
      "/en/einstieg",
      "What is AI? An introduction without prerequisites",
      "en_GB",
    ],
  ] as const)(
    "uses localized %s metadata and its own canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        title,
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );

  it("contains no form, login prompt, price, or commercial filler", async () => {
    await renderPage("de");
    const page = document.body.textContent ?? "";

    expect(document.querySelector("form")).toBeNull();
    for (const phrase of [
      "Mehrwert",
      "disruptiv",
      "Transformation",
      "Wettbewerbsvorteil",
      "Jetzt loslegen",
      "€",
    ]) {
      expect(page).not.toContain(phrase);
    }
  });
});
