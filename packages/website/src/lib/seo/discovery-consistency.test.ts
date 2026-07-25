import { describe, expect, it } from "vitest";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import sitemap from "@/app/sitemap";
import { COURSES_GRAPH } from "@/lib/seo/course-discovery";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { absoluteUrl } from "@/lib/seo/entity";

type ItemListEntry = {
  readonly url: string;
};

type KnowledgeGraphPayload = {
  readonly nodes: readonly { readonly id: string; readonly url: string; readonly crawlClass: string }[];
  readonly catalogs: {
    readonly openSourceLabs: readonly { readonly id: string; readonly url: string }[];
    readonly openSourceArtifacts: readonly {
      readonly id: string;
      readonly kind: string;
      readonly url: string;
      readonly sourceUrl: string;
      readonly sourceCommit: string;
      readonly licenseUrl: string;
      readonly accessUrl: string;
    }[];
  };
};

function courseItemListUrls(): readonly string[] {
  const itemList = COURSES_GRAPH["@graph"].find(
    (node) => node["@type"] === "ItemList",
  ) as { readonly itemListElement: readonly ItemListEntry[] } | undefined;
  return itemList?.itemListElement.map((entry) => entry.url) ?? [];
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

describe("open-source artifact discovery consistency", () => {
  it("publishes every artifact with synchronized identity, provenance, license, and delivery", async () => {
    const sitemapUrls = (await sitemap()).map((entry) => entry.url);
    const llmsLines = (await getLlmsTxt({} as never).text()).split("\n");
    const knowledgeGraph = (await (
      await getKnowledgeGraph()
    ).json()) as KnowledgeGraphPayload;

    expect(knowledgeGraph.catalogs.openSourceArtifacts).toHaveLength(
      OPEN_SOURCE_ARTIFACTS.length,
    );

    for (const artifact of OPEN_SOURCE_ARTIFACTS) {
      const canonicalUrl = absoluteUrl(artifact.href);
      const expectedId = `${artifact.kind}:${artifact.slug}`;
      const expectedAccessUrl =
        artifact.kind === "video"
          ? absoluteUrl(artifact.watchHref)
          : artifact.delivery === "source-only"
            ? canonicalUrl
            : absoluteUrl(artifact.launchHref);

      expect(artifact.id, artifact.slug).toBe(expectedId);
      expect(getCrawlRoute(artifact.href).routeClass, artifact.id).toBe(
        "public-indexable",
      );
      expect(
        sitemapUrls.filter((url) => url === canonicalUrl),
        `${artifact.id} canonical sitemap entry`,
      ).toHaveLength(1);
      expect(
        llmsLines.filter(
          (line) => line === `- ${artifact.title}: ${canonicalUrl}`,
        ),
        `${artifact.id} canonical llms.txt entry`,
      ).toHaveLength(1);

      const graphEntries =
        knowledgeGraph.catalogs.openSourceArtifacts.filter(
          (entry) => entry.id === artifact.id,
        );
      expect(graphEntries, `${artifact.id} knowledge-graph entry`).toHaveLength(
        1,
      );
      expect(graphEntries[0]).toEqual({
        id: expectedId,
        kind: artifact.kind,
        url: canonicalUrl,
        sourceUrl: artifact.source.href,
        sourceCommit: artifact.source.revision,
        licenseUrl: absoluteUrl(artifact.license.href),
        accessUrl: expectedAccessUrl,
      });
    }
  });
});
