import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("./buecher-content", () => ({
  BuecherContent: ({ locale }: { locale: string }) => (
    <div data-testid="book-content" data-locale={locale} />
  ),
}));

import BuecherPage, { generateMetadata } from "./page";

describe("book catalog locale metadata and structured data", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/buecher", "Bücher über KI und Datenreife", "de_DE"],
    ["en", "/en/buecher", "Books on AI and data readiness", "en_GB"],
  ] as const)(
    "uses reviewed %s metadata and the current locale canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );

  it("describes the published English collection edition", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const { container, getByTestId } = render(await BuecherPage());
    const script =
      container.querySelector<HTMLScriptElement>("#buecher-jsonld");
    const graph = JSON.parse(script?.textContent ?? "{}") as {
      "@graph": Array<Record<string, unknown>>;
    };
    const collection = graph["@graph"].find(
      (node) => node["@type"] === "CollectionPage",
    );
    const book = graph["@graph"].find((node) => node["@type"] === "Book");

    expect(getByTestId("book-content")).toHaveAttribute("data-locale", "en");
    expect(collection).toMatchObject({
      name: "Books on AI and data readiness",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher",
    });
    expect(book).toMatchObject({
      name: "AI in German SMEs",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher/ki-landschaft",
      isAccessibleForFree: true,
    });
  });
});
