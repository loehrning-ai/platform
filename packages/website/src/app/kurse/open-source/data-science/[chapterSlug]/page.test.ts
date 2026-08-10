import { beforeEach, describe, expect, it, vi } from "vitest";
import { DS_NUMBERED_CHAPTER_IDS } from "@/lib/data-science/types";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { dynamicParams, generateMetadata, generateStaticParams } from "./page";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
}));

const requestLocale = vi.mocked(getRequestLocale);

beforeEach(() => {
  requestLocale.mockResolvedValue("de");
});

describe("data-science chapter route", () => {
  it("generates exactly the 12 numbered chapter ids in canonical order", () => {
    expect(generateStaticParams()).toEqual(
      DS_NUMBERED_CHAPTER_IDS.map((chapterSlug) => ({ chapterSlug })),
    );
    expect(generateStaticParams()).toHaveLength(12);
    expect(
      generateStaticParams().map((param) => param.chapterSlug),
    ).not.toContain("home");
  });

  it("disables dynamicParams so an unknown chapter cannot render", () => {
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
        params: Promise.resolve({ chapterSlug: "does-not-exist" }),
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
      for (const chapterSlug of DS_NUMBERED_CHAPTER_IDS) {
        const metadata = await generateMetadata({
          params: Promise.resolve({ chapterSlug }),
        });
        const canonical = `${prefix}/kurse/open-source/data-science/${chapterSlug}`;
        expect(metadata.robots).toMatchObject({ index: false, follow: true });
        expect(metadata.alternates?.canonical).toBe(canonical);
        expect(metadata.openGraph?.url).toBe(
          `https://loehrning.ai${canonical}`,
        );
        expect(typeof metadata.title).toBe("string");
        expect(metadata.title).not.toBe("Chapter not found");
        expect(metadata.title).not.toBe("Kapitel nicht gefunden");
      }
    },
  );
});
