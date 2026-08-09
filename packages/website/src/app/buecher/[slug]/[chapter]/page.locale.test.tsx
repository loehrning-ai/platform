import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("@/components/book-reader/chapter-reader", () => ({
  ChapterReader: (props: {
    readonly locale: string;
    readonly bookTitle: string;
    readonly relatedResourceLabel: string;
    readonly chapter: { readonly meta: { readonly title: string } };
    readonly neighbours: {
      readonly next: { readonly title: string } | null;
    };
    readonly allChapters: readonly unknown[];
  }) => (
    <section
      data-testid="chapter-reader"
      data-locale={props.locale}
      data-book-title={props.bookTitle}
      data-related-label={props.relatedResourceLabel}
      data-next-title={props.neighbours.next?.title ?? ""}
      data-chapter-count={props.allChapters.length}
    >
      <h1>{props.chapter.meta.title}</h1>
    </section>
  ),
}));

vi.mock("@/components/learning/resource-context-banner", () => ({
  ResourceContextBanner: () => <div data-testid="resource-context" />,
}));

import ChapterPage, { generateMetadata, generateStaticParams } from "./page";

const props = {
  params: Promise.resolve({
    slug: "ki-landschaft",
    chapter: "01_eisberg",
  }),
};

describe("published book chapter locale routing", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("keeps one locale-independent set of stable static identities", async () => {
    const params = await generateStaticParams();

    expect(params).toHaveLength(10);
    expect(new Set(params.map(({ chapter }) => chapter)).size).toBe(10);
    expect(params[0]).toEqual({
      slug: "ki-landschaft",
      chapter: "01_eisberg",
    });
    expect(params.at(-1)).toEqual({
      slug: "ki-landschaft",
      chapter: "10_anhang",
    });
  });

  it.each([
    [
      "de",
      "Das Eisberg-Problem · KI im deutschen Mittelstand",
      "/buecher/ki-landschaft/01_eisberg",
      "de_DE",
    ],
    [
      "en",
      "The iceberg problem · AI in German SMEs",
      "/en/buecher/ki-landschaft/01_eisberg",
      "en_GB",
    ],
  ] as const)(
    "emits indexable %s metadata with canonical and reciprocal alternates",
    async (locale, title, canonical, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata(props);

      expect(metadata).toMatchObject({
        title,
        robots: { index: true, follow: true },
        alternates: {
          canonical,
          languages: {
            de: "/buecher/ki-landschaft/01_eisberg",
            en: "/en/buecher/ki-landschaft/01_eisberg",
            "x-default": "/buecher/ki-landschaft/01_eisberg",
          },
        },
        openGraph: {
          locale: openGraphLocale,
          url: `https://loehrning.ai${canonical}`,
        },
      });
    },
  );

  it("loads the reviewed English manifest, chapter, neighbours, and chrome", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(await ChapterPage(props));

    const reader = screen.getByTestId("chapter-reader");
    expect(reader).toHaveAttribute("data-locale", "en");
    expect(reader).toHaveAttribute("data-book-title", "AI in German SMEs");
    expect(reader).toHaveAttribute(
      "data-related-label",
      "Open the EU AI Act course",
    );
    expect(reader).toHaveAttribute(
      "data-next-title",
      "Method without spurious precision",
    );
    expect(reader).toHaveAttribute("data-chapter-count", "10");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The iceberg problem",
      }),
    ).toBeVisible();
    expect(screen.queryByTestId("resource-context")).not.toBeInTheDocument();
  });

  it("retains the German learning-context banner on the canonical route", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await ChapterPage(props));

    expect(screen.getByTestId("chapter-reader")).toHaveAttribute(
      "data-locale",
      "de",
    );
    expect(screen.getByTestId("resource-context")).toBeVisible();
  });
});
