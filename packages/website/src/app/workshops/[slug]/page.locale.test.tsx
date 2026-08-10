import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import { generateMetadata } from "./page";

const props = {
  params: Promise.resolve({ slug: "ki-prognosen-einschaetzen" }),
};

describe("workshop detail locale metadata", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/workshops/ki-prognosen-einschaetzen", "Kann KI die Zukunft vorhersagen?"],
    ["en", "/en/workshops/ki-prognosen-einschaetzen", "Can AI predict the future?"],
  ] as const)(
    "uses reviewed %s copy and the current locale canonical",
    async (locale, canonical, title) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata(props);

      expect(metadata.title).toBe(`${title} · Workshop`);
      expect(metadata.alternates).toMatchObject({ canonical });
      if (metadata.alternates && "languages" in metadata.alternates) {
        expect(metadata.alternates.languages).toEqual({
          de: "/workshops/ki-prognosen-einschaetzen",
          en: "/en/workshops/ki-prognosen-einschaetzen",
          "x-default": "/workshops/ki-prognosen-einschaetzen",
        });
      }
      expect(metadata.openGraph).toMatchObject({
        title,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );

  it("localizes the missing workshop title", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "missing" }),
    });
    expect(metadata.title).toBe("Workshop not found");
  });
});
