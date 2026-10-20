import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

import BookOverviewPage, { generateMetadata } from "./page";

const props = {
  params: Promise.resolve({ slug: "ki-landschaft" }),
};

// The chapters come from the English manifest on disk, so the content refresh cannot desync this test.
const EN_CHAPTERS = (
  JSON.parse(readFileSync(resolve(process.cwd(), "content/books/ki-landschaft/en/manifest.json"), "utf-8")) as {
    chapters: { slug: string; title: string }[];
  }
).chapters;

describe("book detail locale metadata and UI", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    [
      "de",
      "/buecher/ki-landschaft",
      "Von außen gesehen · Lernbuch",
      "de_DE",
    ],
    [
      "en",
      "/en/buecher/ki-landschaft",
      "Seen from the outside · Learning book",
      "en_GB",
    ],
  ] as const)(
    "uses reviewed %s metadata and the current locale canonical",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata(props);

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );

  it("renders the reviewed English overview and chapter edition", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const { container } = render(await BookOverviewPage(props));

    expect(
      screen.getByRole("heading", { level: 1, name: "Seen from the outside" }),
    ).toBeVisible();
    expect(screen.getByText(/Tim Löhr/)).toBeVisible();
    // The cover page is the insight layout: the poster band, the stage and a visible chapter list.
    expect(container.querySelector("[data-cover-band]")).not.toBeNull();
    expect(container.querySelector("[data-book-stage]")).not.toBeNull();
    expect(container.querySelector("details, summary")).toBeNull();

    const contents = screen.getByRole("navigation", {
      name: "All chapters of the book",
    });
    const chapterLinks = within(contents).getAllByRole("link");
    expect(chapterLinks).toHaveLength(EN_CHAPTERS.length);
    expect(chapterLinks[0]).toHaveAttribute(
      "href",
      `/en/buecher/ki-landschaft/${EN_CHAPTERS[0]!.slug}`,
    );
    expect(chapterLinks[0]).toHaveAttribute("hreflang", "en");
    expect(chapterLinks[0]).toHaveAttribute("lang", "en");
    expect(chapterLinks[0]).toHaveTextContent(EN_CHAPTERS[0]!.title);

    expect(screen.getByRole("link", { name: "Back to books" })).toHaveAttribute(
      "href",
      "/en/buecher",
    );
    expect(
      screen.getByRole("link", { name: "Open the EU AI Act course" }),
    ).toHaveAttribute("href", "/en/eu-ai-act-kurs");

    const jsonLd = JSON.parse(
      container.querySelector<HTMLScriptElement>("#book-detail-jsonld")
        ?.textContent ?? "{}",
    ) as { "@graph": Array<Record<string, unknown>> };
    const book = jsonLd["@graph"].find((node) => node["@type"] === "Book");
    expect(book).toMatchObject({
      name: "Seen from the outside",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher/ki-landschaft",
    });
    expect(book).toMatchObject({
      hasPart: expect.arrayContaining([
        expect.objectContaining({
          name: EN_CHAPTERS[0]!.title,
          inLanguage: "en-GB",
          url: `https://loehrning.ai/en/buecher/ki-landschaft/${EN_CHAPTERS[0]!.slug}`,
        }),
      ]),
    });
  });

  it("uses a compact flat overview while preserving server-owned metadata", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/buecher/[slug]/page.tsx"),
      "utf8",
    );

    expect(source).toContain("priority");
    expect(source).toContain('id="book-detail-jsonld"');
    expect(source).not.toMatch(/text-\[(?:9|10|11)(?:\.\d+)?px\]/);
    expect(source).not.toMatch(/rounded-(?:lg|xl|2xl|3xl|full)/);
    expect(source).not.toMatch(/shadow-|motion-safe|animate-/);
  });
});
