import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("next/font/local", () => ({
  default: () => ({ className: "book-display-font" }),
}));

vi.mock("./buecher-content", () => ({
  BuecherContent: ({
    locale,
    headingFontClassName,
    entries,
  }: {
    locale: string;
    headingFontClassName: string;
    entries: readonly {
      book: { id: string };
      display: { title: string };
      chapters: readonly unknown[];
      headline: { value: string; share: number; tail: string } | null;
    }[];
  }) => (
    <div
      data-testid="book-content"
      data-locale={locale}
      data-heading-font={headingFontClassName}
      data-entries={JSON.stringify(
        entries.map((entry) => ({
          id: entry.book.id,
          title: entry.display.title,
          chapters: entry.chapters.length,
          headline: entry.headline,
        })),
      )}
    />
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

  it.each([
    ["de", "Von außen gesehen", /^\d+,\d\u00a0%$/, /^der Startseiten/],
    ["en", "Seen from the outside", /^\d+\.\d%$/, /^of the homepages/],
  ] as const)(
    "hands the %s shelf the manifest title, every chapter and the landing headline",
    async (locale, title, valuePattern, tailPattern) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const { getByTestId } = render(await BuecherPage());
      const entries = JSON.parse(
        getByTestId("book-content").getAttribute("data-entries") ?? "[]",
      ) as {
        id: string;
        title: string;
        chapters: number;
        headline: { value: string; share: number; tail: string } | null;
      }[];
      const manifest = JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            `content/books/ki-landschaft/${locale === "de" ? "" : "en/"}manifest.json`,
          ),
          "utf-8",
        ),
      ) as { chapters: unknown[] };

      expect(entries.map((entry) => entry.id)).toEqual(["ki-landschaft"]);
      const [entry] = entries;
      expect(entry?.title).toBe(title);
      expect(entry?.chapters).toBe(manifest.chapters.length);
      expect(entry?.headline?.value).toMatch(valuePattern);
      expect(entry?.headline?.tail).toMatch(tailPattern);
      expect(entry?.headline?.share).toBeGreaterThan(0);
      expect(entry?.headline?.share).toBeLessThan(1);
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
    expect(getByTestId("book-content")).toHaveAttribute(
      "data-heading-font",
      "book-display-font",
    );
    expect(collection).toMatchObject({
      name: "Books on AI and data readiness",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher",
    });
    expect(book).toMatchObject({
      name: "Seen from the outside",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher/ki-landschaft",
      isAccessibleForFree: true,
    });
  });
});
