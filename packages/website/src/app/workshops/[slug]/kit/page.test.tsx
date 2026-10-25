import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock, notFoundMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

import WorkshopKitPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const kitProps = { params: Promise.resolve({ slug: "esg-berichte-mit-ki" }) };

describe("workshop kit page route", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
    notFoundMock.mockClear();
  });

  it("prerenders only the workshops that have a kit block and 404s every other slug", async () => {
    expect(await generateStaticParams()).toEqual([
      { slug: "ki-prognosen-einschaetzen" },
      { slug: "esg-berichte-mit-ki" },
      { slug: "ki-im-unternehmen-sicher-nutzen" },
    ]);
    expect(dynamicParams).toBe(false);
    getRequestLocaleMock.mockResolvedValue("de");
    await expect(
      WorkshopKitPage({ params: Promise.resolve({ slug: "geschaeftsberichte-mit-ki-lesen" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      WorkshopKitPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["de", "/workshops/esg-berichte-mit-ki/kit", "Das Nachweisprobe-Kit"],
    ["en", "/en/workshops/esg-berichte-mit-ki/kit", "The evidence check kit"],
  ] as const)("uses reviewed %s copy and the current locale canonical", async (locale, canonical, title) => {
    getRequestLocaleMock.mockResolvedValue(locale);
    const metadata = await generateMetadata(kitProps);
    expect(String(metadata.title)).toContain(title);
    expect(metadata.alternates).toMatchObject({ canonical });
    if (metadata.alternates && "languages" in metadata.alternates) {
      expect(metadata.alternates.languages).toEqual({
        de: "/workshops/esg-berichte-mit-ki/kit",
        en: "/en/workshops/esg-berichte-mit-ki/kit",
        "x-default": "/workshops/esg-berichte-mit-ki/kit",
      });
    }
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({ url: `https://loehrning.ai${canonical}` });
  });

  it("renders the audit workshop kit through the same route, in both locales", async () => {
    const auditProps = { params: Promise.resolve({ slug: "ki-im-unternehmen-sicher-nutzen" }) };
    for (const [locale, canonical] of [
      ["de", "/workshops/ki-im-unternehmen-sicher-nutzen/kit"],
      ["en", "/en/workshops/ki-im-unternehmen-sicher-nutzen/kit"],
    ] as const) {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata(auditProps);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      const json = JSON.stringify(await WorkshopKitPage(auditProps));
      expect(json).toContain(`https://loehrning.ai${canonical}`);
      expect(json).toContain("application/zip");
      expect(json).toContain("/workshops/ki-im-unternehmen-sicher-nutzen/ai-at-work-kit.zip");
    }
  });

  it("returns the not-found title for an unknown slug", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "missing" }) });
    expect(metadata.title).toBe("Workshop not found");
  });

  it("renders the breadcrumb and download JSON-LD for the page locale", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const element = await WorkshopKitPage(kitProps);
    const json = JSON.stringify(element);
    expect(json).toContain("https://loehrning.ai/en/workshops/esg-berichte-mit-ki/kit");
    expect(json).toContain("application/zip");
    expect(json).toContain("/workshops/esg-berichte-mit-ki/crvena-zemja-esg-kit.zip");
  });
});
