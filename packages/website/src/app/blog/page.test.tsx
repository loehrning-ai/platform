import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BLOG_POSTS } from "@/lib/blog-metadata";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import BlogIndexPage, { generateMetadata } from "./page";

async function renderPage(locale: "de" | "en") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await BlogIndexPage());
}

describe("BlogIndexPage", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders every German article row from the canonical manifest", async () => {
    await renderPage("de");

    for (const post of BLOG_POSTS) {
      const link = screen.getByRole("link", {
        name: `Artikel lesen: ${post.titleDe}`,
      });
      const row = within(link);
      const number = String(post.postNumber).padStart(2, "0");
      expect(link).toHaveAttribute("href", `/blog/${post.slug}`);
      expect(
        row.getByRole("heading", { name: post.titleDe }),
      ).toBeInTheDocument();
      expect(row.getByText(post.summary)).toBeInTheDocument();
      expect(row.getByText(`Artikel Nº ${number}`)).toBeInTheDocument();
      expect(
        row.getByText(`${post.readingTimeMin} Min. Lesezeit`),
      ).toBeInTheDocument();
      expect(row.getByText(post.tags[0]!)).toBeInTheDocument();
    }
  });

  it("renders the reviewed English manifest fields and localized links", async () => {
    await renderPage("en");

    for (const post of BLOG_POSTS) {
      const link = screen.getByRole("link", {
        name: `Read article: ${post.titleEn}`,
      });
      const row = within(link);
      expect(link).toHaveAttribute("href", `/en/blog/${post.slug}`);
      expect(
        row.getByRole("heading", { name: post.titleEn }),
      ).toBeInTheDocument();
      expect(row.getByText(post.summaryEn)).toBeInTheDocument();
      expect(
        row.getByText(`${post.readingTimeMin} min read`),
      ).toBeInTheDocument();
      expect(row.getByText(post.tagsEn[0]!)).toBeInTheDocument();
    }
    expect(document.body).not.toHaveTextContent("Artikel lesen");
  });

  it("orders equal-date posts by descending manifest number", async () => {
    await renderPage("de");
    const renderedHrefs = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a.row"),
    ).map((link) => link.getAttribute("href"));
    const expectedHrefs = [...BLOG_POSTS]
      .sort(
        (a, b) =>
          b.datePublished.localeCompare(a.datePublished) ||
          b.postNumber - a.postNumber,
      )
      .map((post) => `/blog/${post.slug}`);
    expect(renderedHrefs).toEqual(expectedHrefs);
  });

  it.each([
    ["de", "/blog", "de_DE"],
    ["en", "/en/blog", "en_GB"],
  ] as const)(
    "uses localized %s metadata",
    async (locale, canonical, ogLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: ogLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
