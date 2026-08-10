import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import { generateMetadata } from "./page";

describe("workshop catalog locale metadata", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/workshops", "Workshops für KI im Mittelstand", "de_DE"],
    ["en", "/en/workshops", "Practical AI workshops for business", "en_GB"],
  ] as const)(
    "uses reviewed %s copy and the current locale canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      if (metadata.alternates && "languages" in metadata.alternates) {
        expect(metadata.alternates.languages).toEqual({
          de: "/workshops",
          en: "/en/workshops",
          "x-default": "/workshops",
        });
      }
      expect(metadata.openGraph).toMatchObject({
        title,
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
