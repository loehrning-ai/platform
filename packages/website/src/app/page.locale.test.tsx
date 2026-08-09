import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import { generateMetadata } from "./page";

describe("homepage locale metadata", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/", "KI-Kurse, Workshops und offene Lernmaterialien", "de_DE"],
    ["en", "/en", "AI courses, workshops and open learning materials", "en_GB"],
  ] as const)(
    "uses the %s copy and its own canonical route",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toEqual({
        canonical,
        languages: { de: "/", en: "/en", "x-default": "/" },
      });
      expect(metadata.openGraph).toMatchObject({
        title,
        locale: openGraphLocale,
        url: canonical === "/" ? "https://loehrning.ai" : `https://loehrning.ai${canonical}`,
      });
    },
  );
});
