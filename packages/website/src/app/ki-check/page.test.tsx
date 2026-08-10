import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import KiCheckPage, { generateMetadata } from "./page";

afterEach(cleanup);

describe("KI check locale route", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/ki-check", "de_DE", "KI-Check"],
    ["en", "/en/ki-check", "en_GB", "AI competency check"],
  ] as const)(
    "owns %s metadata and structured data",
    async (locale, canonical, openGraphLocale, graphName) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();
      const { container } = render(await KiCheckPage());
      const graph = JSON.parse(
        container.querySelector("#ki-check-jsonld")?.textContent ?? "{}",
      );

      expect(metadata.alternates).toMatchObject({
        canonical,
        languages: {
          de: "/ki-check",
          en: "/en/ki-check",
          "x-default": "/ki-check",
        },
      });
      expect(metadata.openGraph).toMatchObject({
        url: `https://loehrning.ai${canonical}`,
        locale: openGraphLocale,
      });
      expect(graph).toMatchObject({
        name: expect.stringContaining(graphName),
        url: `https://loehrning.ai${canonical}`,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
      });
    },
  );
});
