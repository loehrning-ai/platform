import { describe, expect, it } from "vitest";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import sitemap from "@/app/sitemap";
import { COURSES_GRAPH } from "@/lib/seo/course-discovery";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { courseFacts } from "@/lib/courses/tracks";
import { getCrawlRoute } from "@/lib/crawl/contract";

type ItemListEntry = {
  readonly url: string;
  readonly item: {
    readonly inLanguage: string;
  };
};

type KnowledgeGraphPayload = {
  readonly nodes: readonly { readonly id: string; readonly url: string; readonly crawlClass: string }[];
  readonly catalogs: {
    readonly openSourceLabs: readonly { readonly id: string; readonly url: string }[];
    readonly openSourceArtifacts: readonly {
      readonly id: string;
      readonly kind: string;
      readonly url: string;
    }[];
  };
};

function courseItemListUrls(): readonly string[] {
  const itemList = COURSES_GRAPH["@graph"].find(
    (node) => node["@type"] === "ItemList",
  ) as { readonly itemListElement: readonly ItemListEntry[] } | undefined;
  return itemList?.itemListElement.map((entry) => entry.url) ?? [];
}

function courseItemListEntries(): readonly ItemListEntry[] {
  const itemList = COURSES_GRAPH["@graph"].find(
    (node) => node["@type"] === "ItemList",
  ) as { readonly itemListElement: readonly ItemListEntry[] } | undefined;
  return itemList?.itemListElement ?? [];
}

describe("course discovery consistency", () => {
  it("publishes every native course across human and machine discovery surfaces", async () => {
    const sitemapUrls = new Set((await sitemap()).map((entry) => entry.url));
    const llms = await getLlmsTxt({} as never).text();
    const knowledgeGraph = (await (await getKnowledgeGraph()).json()) as KnowledgeGraphPayload;
    const jsonLdUrls = new Set(courseItemListUrls());

    for (const course of COURSE_CATALOG) {
      const url = `https://loehrning.ai${course.href}`;
      expect(getCrawlRoute(course.href).routeClass, course.slug).toBe("public-indexable");
      expect(sitemapUrls.has(url), course.slug).toBe(true);
      expect(llms, course.slug).toContain(url);
      expect(jsonLdUrls.has(url), course.slug).toBe(true);
      expect(
        knowledgeGraph.nodes.some(
          (node) =>
            node.id === `course:${course.slug}` &&
            node.url === url &&
            node.crawlClass === "public-indexable",
        ),
        course.slug,
      ).toBe(true);
    }
  });

  it("publishes each native course with the language declared by COURSE_FACTS", () => {
    const entries = courseItemListEntries();

    for (const course of COURSE_CATALOG) {
      const entry = entries.find(
        (candidate) => candidate.url === `https://loehrning.ai${course.href}`,
      );
      const expectedLanguage =
        courseFacts(course.slug).language === "Englisch" ? "en" : "de";
      expect(entry?.item.inLanguage, course.slug).toBe(expectedLanguage);
    }
  });

  it("publishes every imported lab locally while retaining its external launch boundary", async () => {
    const sitemapUrls = new Set((await sitemap()).map((entry) => entry.url));
    const llms = await getLlmsTxt({} as never).text();
    const knowledgeGraph = (await (await getKnowledgeGraph()).json()) as KnowledgeGraphPayload;
    const jsonLdUrls = new Set(courseItemListUrls());

    for (const course of IMPORTED_COURSE_CATALOG) {
      const url = `https://loehrning.ai${course.href}`;
      expect(course.launchHref).not.toBe(url);
      expect(getCrawlRoute(course.href).routeClass, course.slug).toBe("public-indexable");
      expect(sitemapUrls.has(url), course.slug).toBe(true);
      expect(llms, course.slug).toContain(url);
      expect(jsonLdUrls.has(url), course.slug).toBe(true);
      expect(
        knowledgeGraph.catalogs.openSourceLabs.some(
          (node) => node.id === `open-source-lab:${course.slug}` && node.url === url,
        ),
        course.slug,
      ).toBe(true);
      // Imported labs are course-catalog content; the open-source artifact
      // registry is reserved for the loehrning-ai GitHub organization.
      expect(
        knowledgeGraph.catalogs.openSourceArtifacts.some(
          (artifact) => artifact.id === `course:${course.slug}`,
        ),
        course.slug,
      ).toBe(false);
    }
  });
});
