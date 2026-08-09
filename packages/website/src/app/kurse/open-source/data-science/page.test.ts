import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { generateMetadata } from "./page";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

const requestLocale = vi.mocked(getRequestLocale);

beforeEach(() => {
  requestLocale.mockResolvedValue("de");
});

describe("data-science course root / overview route", () => {
  it.each([
    ["de", "/kurse/open-source/data-science", "interaktiver Kurs"],
    ["en", "/en/kurse/open-source/data-science", "interactive course"],
  ] as const)(
    "emits reviewed %s metadata and locale-preserving canonicals",
    async (locale, canonical, titleMarker) => {
      requestLocale.mockResolvedValue(locale);
      const metadata = await generateMetadata();
      expect(metadata.title).toContain(titleMarker);
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.alternates?.languages).toEqual({
        de: "/kurse/open-source/data-science",
        en: "/en/kurse/open-source/data-science",
        "x-default": "/kurse/open-source/data-science",
      });
      expect(metadata.openGraph?.url).toBe(`https://loehrning.ai${canonical}`);
    },
  );
});
