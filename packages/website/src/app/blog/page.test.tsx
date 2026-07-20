import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import BlogIndexPage from "./page";

describe("BlogIndexPage", () => {
  it("renders every article row from the canonical manifest", () => {
    render(<BlogIndexPage />);

    for (const post of BLOG_POSTS) {
      const link = screen.getByRole("link", {
        name: `Artikel lesen: ${post.titleDe}`,
      });
      const row = within(link);
      const number = String(post.postNumber).padStart(2, "0");
      expect(link).toHaveAttribute("href", `/blog/${post.slug}`);
      expect(row.getByRole("heading", { name: post.titleDe })).toBeInTheDocument();
      expect(row.getByText(post.summary)).toBeInTheDocument();
      expect(row.getByText(`Artikel Nº ${number}`)).toBeInTheDocument();
      expect(row.getByText(`${post.readingTimeMin} Min. Lesezeit`)).toBeInTheDocument();
      expect(row.getByText(post.tags[0])).toBeInTheDocument();
    }
  });

  it("orders equal-date posts by descending manifest number", () => {
    render(<BlogIndexPage />);
    const renderedHrefs = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.row")).map(
      (link) => link.getAttribute("href"),
    );
    const expectedHrefs = [...BLOG_POSTS]
      .sort(
        (a, b) =>
          b.datePublished.localeCompare(a.datePublished) || b.postNumber - a.postNumber,
      )
      .map((post) => `/blog/${post.slug}`);
    expect(renderedHrefs).toEqual(expectedHrefs);
  });
});
