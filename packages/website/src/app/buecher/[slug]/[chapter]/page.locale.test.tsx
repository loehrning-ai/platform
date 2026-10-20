import { readFileSync } from "node:fs";
import { join } from "node:path";
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

// The chapters come from the manifests on disk, so the content refresh cannot desync this test.
interface ManifestFile {
  readonly chapters: readonly { readonly slug: string; readonly title: string }[];
}
const manifest = (locale: "de" | "en"): ManifestFile =>
  JSON.parse(
    readFileSync(join(process.cwd(), "content", "books", "ki-landschaft", locale === "de" ? "" : "en", "manifest.json"), "utf-8"),
  ) as ManifestFile;
const DE = manifest("de").chapters;
const EN = manifest("en").chapters;
const FIRST = DE[0]!;
const FIRST_PATH = `/buecher/ki-landschaft/${FIRST.slug}`;

const props = {
  params: Promise.resolve({
    slug: "ki-landschaft",
    chapter: FIRST.slug,
  }),
};

describe("published book chapter locale routing", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("keeps one locale-independent set of stable static identities", async () => {
    const params = await generateStaticParams();

    expect(params).toHaveLength(DE.length);
    expect(new Set(params.map(({ chapter }) => chapter)).size).toBe(DE.length);
    expect(params[0]).toEqual({
      slug: "ki-landschaft",
      chapter: FIRST.slug,
    });
    expect(params.at(-1)).toEqual({
      slug: "ki-landschaft",
      chapter: DE.at(-1)!.slug,
    });
  });

  it.each([
    ["de", `${FIRST.title} · Von außen gesehen`, FIRST_PATH, "de_DE"],
    ["en", `${EN.find((c) => c.slug === FIRST.slug)?.title ?? FIRST.title} · Seen from the outside`, `/en${FIRST_PATH}`, "en_GB"],
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
            de: FIRST_PATH,
            en: `/en${FIRST_PATH}`,
            "x-default": FIRST_PATH,
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
    expect(reader).toHaveAttribute("data-book-title", "Seen from the outside");
    expect(reader).toHaveAttribute(
      "data-related-label",
      "Open the EU AI Act course",
    );
    expect(reader).toHaveAttribute("data-next-title", EN[1]!.title);
    expect(reader).toHaveAttribute("data-chapter-count", String(EN.length));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: EN.find((c) => c.slug === FIRST.slug)!.title,
      }),
    ).toBeVisible();
    expect(screen.queryByTestId("resource-context")).not.toBeInTheDocument();
  });

  it("shows no course-funnel banner above the insight book on the canonical route", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await ChapterPage(props));

    expect(screen.getByTestId("chapter-reader")).toHaveAttribute(
      "data-locale",
      "de",
    );
    // The insight book is a data book: no "Stufe ... Kurs" strip above it, in any locale.
    expect(screen.queryByTestId("resource-context")).toBeNull();
  });
});
