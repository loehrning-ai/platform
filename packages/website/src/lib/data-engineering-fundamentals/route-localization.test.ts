import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateMetadata as generateLandingMetadata } from "@/app/kurse/open-source/data-engineering-fundamentals/page";
import { generateMetadata as generateCertificateMetadata } from "@/app/kurse/open-source/data-engineering-fundamentals/zertifikat/layout";
import { generateMetadata as generateVerificationMetadata } from "@/app/kurse/open-source/data-engineering-fundamentals/verifizierung/layout";
import { getRequestLocale } from "@/lib/i18n/request-locale";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

const requestLocale = vi.mocked(getRequestLocale);

beforeEach(() => {
  requestLocale.mockResolvedValue("de");
});

describe("Data Engineering Fundamentals localized route metadata", () => {
  it.each([
    ["de", "/kurse/open-source/data-engineering-fundamentals", "de_DE"],
    ["en", "/en/kurse/open-source/data-engineering-fundamentals", "en_GB"],
  ] as const)(
    "publishes the reviewed %s landing with canonical and reciprocal hreflang",
    async (locale, canonical, openGraphLocale) => {
      requestLocale.mockResolvedValue(locale);
      const metadata = await generateLandingMetadata();
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.alternates?.canonical).toBe(canonical);
      expect(metadata.alternates?.languages).toEqual({
        de: "/kurse/open-source/data-engineering-fundamentals",
        en: "/en/kurse/open-source/data-engineering-fundamentals",
        "x-default": "/kurse/open-source/data-engineering-fundamentals",
      });
      expect(metadata.openGraph?.locale).toBe(openGraphLocale);
      expect(metadata.openGraph?.url).toBe(`https://loehrning.ai${canonical}`);
    },
  );

  it.each([
    [generateCertificateMetadata, "/zertifikat"],
    [generateVerificationMetadata, "/verifizierung"],
  ] as const)(
    "keeps localized record utility metadata noindex",
    async (generateMetadata, suffix) => {
      requestLocale.mockResolvedValue("en");
      const metadata = await generateMetadata();
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe(
        `/en/kurse/open-source/data-engineering-fundamentals${suffix}`,
      );
      expect(metadata.alternates?.languages).toBeUndefined();
    },
  );
});
