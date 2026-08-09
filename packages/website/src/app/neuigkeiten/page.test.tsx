import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import NeuigkeitenPage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await NeuigkeitenPage());
}

describe("Updates locale content", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders one German page heading and dated changelog sections", async () => {
    await renderPage("de");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Was ist neu" }),
    ).toBeVisible();
    expect(screen.getByText("3 dokumentiert")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /Zweisprachige Plattformrevision/ }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /2026-07-16/ })).toBeVisible();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("uses the English source and preserves the catalog locale", async () => {
    await renderPage("en");

    expect(
      screen.getByRole("heading", { level: 1, name: "What is new" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /Blog published/ }),
    ).toBeVisible();
    expect(screen.getByText("3 documented")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /Bilingual platform revision/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Open the current course catalog/ }),
    ).toHaveAttribute("href", "/en/kurse");
    expect(document.body).not.toHaveTextContent("Hinzugefügt");
  });

  it.each([
    ["de", "/neuigkeiten", "Neuigkeiten und Inhaltsänderungen", "de_DE"],
    ["en", "/en/neuigkeiten", "Updates and content changes", "en_GB"],
  ] as const)(
    "uses localized %s metadata",
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
});
