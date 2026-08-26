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

describe("book detail locale metadata and UI", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    [
      "de",
      "/buecher/ki-landschaft",
      "KI im deutschen Mittelstand · Lernbuch",
      "de_DE",
    ],
    [
      "en",
      "/en/buecher/ki-landschaft",
      "AI in German SMEs · Learning book",
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
      screen.getByRole("heading", { level: 1, name: "AI in German SMEs" }),
    ).toBeVisible();
    expect(screen.getByText("Material language")).toBeVisible();
    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    expect(screen.getByText(/by Tim Löhr/)).toBeVisible();

    const contents = screen.getByRole("navigation", {
      name: "Table of contents",
    });
    const chapterLinks = within(contents).getAllByRole("link");
    expect(chapterLinks).toHaveLength(10);
    expect(chapterLinks[0]).toHaveAttribute(
      "href",
      "/en/buecher/ki-landschaft/01_eisberg",
    );
    expect(chapterLinks[0]).toHaveAttribute("hreflang", "en");
    expect(chapterLinks[0]).toHaveAttribute("lang", "en");
    expect(chapterLinks[0]).toHaveTextContent("The iceberg problem");
    expect(chapterLinks[0]).toHaveClass("min-h-16");

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
      name: "AI in German SMEs",
      inLanguage: "en-GB",
      url: "https://loehrning.ai/en/buecher/ki-landschaft",
    });
    expect(book).toMatchObject({
      hasPart: expect.arrayContaining([
        expect.objectContaining({
          name: "The iceberg problem",
          inLanguage: "en-GB",
          url: "https://loehrning.ai/en/buecher/ki-landschaft/01_eisberg",
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
