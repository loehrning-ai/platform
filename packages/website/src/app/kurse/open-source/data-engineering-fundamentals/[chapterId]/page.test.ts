import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEF_CHAPTER_IDS } from "@/lib/data-engineering-fundamentals/types";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { dynamicParams, generateMetadata, generateStaticParams } from "./page";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

const requestLocale = vi.mocked(getRequestLocale);

beforeEach(() => {
  requestLocale.mockResolvedValue("de");
});

describe("data-engineering-fundamentals chapter route", () => {
  it("generates exactly the 12 canonical chapter ids in source order", () => {
    expect(generateStaticParams()).toEqual(
      DEF_CHAPTER_IDS.map((chapterId) => ({ chapterId })),
    );
    expect(generateStaticParams()).toHaveLength(12);
  });

  it("disables dynamicParams so an unknown chapter ID cannot render", () => {
    expect(dynamicParams).toBe(false);
  });

  it.each([
    ["de", "Kapitel nicht gefunden"],
    ["en", "Chapter not found"],
  ] as const)(
    "returns localized noindex metadata for an unknown %s chapter",
    async (locale, title) => {
      requestLocale.mockResolvedValue(locale);
      const metadata = await generateMetadata({
        params: Promise.resolve({ chapterId: "does-not-exist" }),
      });
      expect(metadata.title).toBe(title);
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
    },
  );

  it.each([
    ["de", ""],
    ["en", "/en"],
  ] as const)(
    "generates localized %s chapter metadata with stable canonical identities",
    async (locale, prefix) => {
      requestLocale.mockResolvedValue(locale);
      for (const chapterId of DEF_CHAPTER_IDS) {
        const metadata = await generateMetadata({
          params: Promise.resolve({ chapterId }),
        });
        const canonical = `${prefix}/kurse/open-source/data-engineering-fundamentals/${chapterId}`;
        expect(metadata.robots).toMatchObject({ index: false, follow: true });
        expect(metadata.alternates?.canonical).toBe(canonical);
        expect(metadata.openGraph?.url).toBe(
          `https://loehrning.ai${canonical}`,
        );
        expect(typeof metadata.title).toBe("string");
      }
    },
  );
});
