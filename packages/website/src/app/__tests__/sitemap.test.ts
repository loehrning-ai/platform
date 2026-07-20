import { describe, it, expect } from "vitest";
import sitemap from "../sitemap";
import { WIE_KI_LEKTIONEN } from "@/lib/wie-ki-funktioniert";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { books } from "@/lib/books";
import { demos } from "@/lib/demos";
import { IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { getWorkshopSlugs } from "@/lib/workshops";
import { CRAWL_CONTRACT } from "@/lib/crawl/contract";

const result = await sitemap();

describe("sitemap()", () => {
  it("includes the home page with priority 1.0", () => {
    const home = result.find((e) => e.url === "https://loehrning.ai");
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1.0);
  });

  it("returns only public indexable routes", () => {
    // Sitemap composition (public-content contract):
    //   23 static pages = the non-dynamic public-indexable contract entries
    //     (home, einstieg, wie-ki-funktioniert, ki-check, glossar,
    //     kurse, the four course landings, blog, buecher, demos,
    //     workshops, open-source, open-source/lizenzrichtlinie, ueber-mich,
    //     ueber-die-plattform, neuigkeiten, hilfe, bekannte-grenzen,
    //     impressum, datenschutz)
    //   + WIE_KI_LEKTIONEN.length individual lektion routes
    //   + catalog detail pages (buecher + demos + workshops slugs)
    //   + every imported course detail page under /kurse/open-source/:slug
    //     (catalog-driven; not part of the open-source artifact registry)
    //   + every published open-source artifact (tools, projects, and videos)
    //     from the canonical registry
    //   + BLOG_POSTS.length (manifest-driven)
    const wieKiLektionCount = WIE_KI_LEKTIONEN.length; // individual lektion routes
    const detailPageCount =
      books.length +
      demos.length +
      getWorkshopSlugs().length;
    const expectedStatic = CRAWL_CONTRACT.filter(
      (entry) => entry.includeInSitemap && !entry.pattern.includes(":"),
    ).length;
    expect(result.length).toBe(
      expectedStatic +
        wieKiLektionCount +
        detailPageCount +
        BLOG_POSTS.length +
        IMPORTED_COURSE_CATALOG.length +
        OPEN_SOURCE_ARTIFACTS.length,
    );
    expect(result.some((e) => e.url.endsWith("/ueber-die-plattform"))).toBe(true);
    expect(result.some((e) => e.url.endsWith("/einstieg"))).toBe(true);
    expect(result.some((e) => e.url.endsWith("/wie-ki-funktioniert"))).toBe(true);
  });

  it("includes /ki-check, /einstieg, and /wie-ki-funktioniert as indexable public routes", () => {
    const urls = result.map((e) => e.url);
    expect(urls).toContain("https://loehrning.ai/ki-check");
    expect(urls).not.toContain("https://loehrning.ai/glossar");
    expect(urls).toContain("https://loehrning.ai/einstieg");
    expect(urls).toContain("https://loehrning.ai/wie-ki-funktioniert");
    for (const l of WIE_KI_LEKTIONEN) {
      expect(urls).toContain(`https://loehrning.ai/wie-ki-funktioniert/${l.id}`);
    }
  });

  it("includes public course previews, blog, and legal routes", () => {
    const urls = result.map((e) => e.url);
    expect(urls).toContain("https://loehrning.ai/kurse");
    expect(urls).toContain("https://loehrning.ai/ki-fuehrerschein");
    expect(urls).toContain("https://loehrning.ai/eu-ai-act-kurs");
    expect(urls).toContain("https://loehrning.ai/ai-native");
    expect(urls).toContain("https://loehrning.ai/ki-und-gesellschaft");
    expect(urls).toContain("https://loehrning.ai/blog");
    expect(urls).toContain("https://loehrning.ai/buecher");
    expect(urls).toContain("https://loehrning.ai/demos");
    expect(urls).toContain("https://loehrning.ai/workshops");
    expect(urls).toContain("https://loehrning.ai/open-source");
    expect(urls).toContain(
      "https://loehrning.ai/open-source/lizenzrichtlinie",
    );
    expect(urls).toContain("https://loehrning.ai/impressum");
    expect(urls).toContain("https://loehrning.ai/datenschutz");
  });

  it("uses a frozen lastModified across two calls (no Date.now() per call)", async () => {
    const first = await sitemap();
    const second = await sitemap();
    const firstHome = first.find((e) => e.url === "https://loehrning.ai");
    const secondHome = second.find((e) => e.url === "https://loehrning.ai");
    expect(firstHome?.lastModified).toEqual(secondHome?.lastModified);
  });

  it("includes all manifest blog posts (manifest is source of truth)", () => {
    const urls = result.map((e) => e.url);
    for (const post of BLOG_POSTS) {
      expect(urls).toContain(`https://loehrning.ai/blog/${post.slug}`);
    }
  });

  it("does NOT include retired blog posts", () => {
    const urls = result.map((e) => e.url);
    expect(urls).not.toContain("https://loehrning.ai/blog/digify");
    expect(urls).not.toContain("https://loehrning.ai/blog/ki-beratungsluecke");
  });

  it("blog post lastModified matches manifest dateModified", () => {
    for (const post of BLOG_POSTS) {
      const entry = result.find((e) => e.url === `https://loehrning.ai/blog/${post.slug}`);
      expect(entry, `missing sitemap entry for ${post.slug}`).toBeDefined();
      if (entry) {
        const expectedDate = new Date(post.dateModified).toISOString().slice(0, 10);
        const actualDate = (entry.lastModified as Date).toISOString().slice(0, 10);
        expect(actualDate, `${post.slug} date mismatch`).toBe(expectedDate);
      }
    }
  });

  it("includes /ueber-mich as a public indexable route", () => {
    const urls = result.map((e) => e.url);
    expect(urls).toContain("https://loehrning.ai/ueber-mich");
  });

  it("does not include protected state, utility, admin, or api paths", () => {
    const urls = result.map((e) => e.url);
    for (const url of urls) {
      expect(url).not.toMatch(/\/admin/);
      expect(url).not.toMatch(/\/api\//);
      expect(url).not.toMatch(/\/ki-fuehrerschein\/kurs/);
      expect(url).not.toMatch(/\/eu-ai-act-kurs\/kurs/);
      expect(url).not.toMatch(/\/ai-native\/kurs/);
      expect(url).not.toMatch(/\/ai-native\/demos/);
      expect(url).not.toMatch(/\/ai-native\/glossar/);
      expect(url).not.toMatch(/\/kontakt$/);
      expect(url).not.toMatch(/\/ki-transformation-check$/);
      expect(url).not.toMatch(/\/foerdermittel$/);
      expect(url).not.toMatch(/\/arbeitsweise$/);
    }
  });

  it("includes catalog detail pages for buecher, demos, and workshops (public-content contract)", () => {
    const urls = result.map((e) => e.url);
    for (const book of books) {
      expect(urls).toContain(`https://loehrning.ai/buecher/${book.id}`);
    }
    for (const demo of demos) {
      expect(urls).toContain(`https://loehrning.ai/demos/${demo.slug}`);
    }
    for (const slug of getWorkshopSlugs()) {
      expect(urls).toContain(`https://loehrning.ai/workshops/${slug}`);
    }
  });

  it("includes every indexable imported course detail page", () => {
    const urls = result.map((entry) => entry.url);
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(urls).toContain(`https://loehrning.ai${course.href}`);
    }
  });

  it("does not include book chapter reader paths (explicit includeInSitemap: false)", () => {
    const urls = result.map((e) => e.url);
    for (const url of urls) {
      expect(url).not.toMatch(/\/buecher\/[^/]+\/.+/);
    }
  });

  it("does not include noindex utility routes (quiz, zertifikat, verifizierung)", () => {
    const urls = result.map((e) => e.url);
    for (const url of urls) {
      expect(url).not.toMatch(/\/quiz$/);
      expect(url).not.toMatch(/\/zertifikat$/);
      expect(url).not.toMatch(/\/verifizierung$/);
    }
  });
});
