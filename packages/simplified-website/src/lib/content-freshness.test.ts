import { describe, it, expect } from "vitest";
import { SITE_CONTENT_DATE } from "./content-freshness";
import { BLOG_POSTS } from "./blog-metadata";
import sitemap from "@/app/sitemap";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import { metadata as euAiActGrundlagenMeta } from "@/app/blog/eu-ai-act-grundlagen/page";
import { generateMetadata as generateVorlageMetadata } from "@/app/vorlagen/[slug]/page";
import { generateMetadata as generateDemoMetadata } from "@/app/demos/[slug]/page";
import { getAllVorlagenMeta } from "./vorlagen";
import { demos } from "./demos";

type ArticleOpenGraph = {
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

async function sitemapStaticDate(): Promise<string> {
  const entries = await sitemap();
  const home = entries.find((e) => e.url === "https://loehrning.ai");
  expect(home, "home entry missing from sitemap").toBeDefined();
  return (home?.lastModified as Date).toISOString().slice(0, 10);
}

async function llmsTxtDate(): Promise<string> {
  const res = getLlmsTxt(new Request("https://loehrning.ai/llms.txt") as never);
  const text = await res.text();
  const match = text.match(/Veröffentlichungsdatum dieser Datei: (\d{4}-\d{2}-\d{2})\./);
  expect(match, "llms.txt is missing the Veröffentlichungsdatum line").not.toBeNull();
  return match?.[1] ?? "";
}

async function knowledgeGraphDate(): Promise<string> {
  const res = await getKnowledgeGraph();
  const body = (await res.json()) as { generatedAt: string };
  return body.generatedAt.slice(0, 10);
}

describe("shared content freshness source (public-content contract)", () => {
  it("SITE_CONTENT_DATE is a valid ISO YYYY-MM-DD date", () => {
    expect(SITE_CONTENT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(SITE_CONTENT_DATE).getTime())).toBe(false);
  });

  it("sitemap static entries derive lastModified from SITE_CONTENT_DATE", async () => {
    expect(await sitemapStaticDate()).toBe(SITE_CONTENT_DATE);
  });

  it("llms.txt emits SITE_CONTENT_DATE as Veröffentlichungsdatum", async () => {
    expect(await llmsTxtDate()).toBe(SITE_CONTENT_DATE);
  });

  it("knowledge-graph generatedAt derives from SITE_CONTENT_DATE", async () => {
    const res = await getKnowledgeGraph();
    const body = (await res.json()) as { generatedAt: string };
    expect(body.generatedAt).toBe(new Date(SITE_CONTENT_DATE).toISOString());
  });

  it("sitemap, llms.txt, and knowledge-graph emit one and the same date", async () => {
    const [fromSitemap, fromLlms, fromKnowledgeGraph] = await Promise.all([
      sitemapStaticDate(),
      llmsTxtDate(),
      knowledgeGraphDate(),
    ]);
    expect(fromSitemap).toBe(fromLlms);
    expect(fromLlms).toBe(fromKnowledgeGraph);
    expect(fromKnowledgeGraph).toBe(SITE_CONTENT_DATE);
  });

  it("no blog post dateModified is newer than SITE_CONTENT_DATE (fourth surface link)", () => {
    for (const post of BLOG_POSTS) {
      expect(
        post.dateModified <= SITE_CONTENT_DATE,
        `${post.slug}: dateModified ${post.dateModified} is newer than SITE_CONTENT_DATE ${SITE_CONTENT_DATE}; bump src/lib/content-freshness.ts in the same commit`,
      ).toBe(true);
    }
  });
});

describe("blog OpenGraph article freshness meta (public-content contract)", () => {
  const pages = [
    { slug: "eu-ai-act-grundlagen", metadata: euAiActGrundlagenMeta },
  ] as const;

  it("covers every manifest post with a page metadata assertion", () => {
    expect(pages.map((p) => p.slug).sort()).toEqual(
      BLOG_POSTS.map((p) => p.slug).sort(),
    );
  });

  for (const { slug, metadata } of pages) {
    it(`/blog/${slug} emits article:published_time and article:modified_time from the manifest`, () => {
      const post = BLOG_POSTS.find((p) => p.slug === slug);
      expect(post, `manifest entry missing for ${slug}`).toBeDefined();
      const og = metadata.openGraph as ArticleOpenGraph | undefined;
      expect(og?.type).toBe("article");
      expect(og?.publishedTime).toBe(post?.datePublished);
      expect(og?.modifiedTime).toBe(post?.dateModified);
    });
  }
});

describe("dated catalog pages emit article:modified_time (public-content contract)", () => {
  it("every /vorlagen/:slug emits modifiedTime from the catalog lastReviewed", async () => {
    for (const meta of getAllVorlagenMeta()) {
      const pageMeta = await generateVorlageMetadata({
        params: Promise.resolve({ slug: meta.slug }),
      });
      const og = pageMeta.openGraph as ArticleOpenGraph | undefined;
      expect(og?.type, `${meta.slug}: og type`).toBe("article");
      expect(meta.lastReviewed, `${meta.slug}: catalog lastReviewed missing`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(og?.modifiedTime, `${meta.slug}: modifiedTime`).toBe(meta.lastReviewed);
    }
  });

  it("every /demos/:slug emits modifiedTime from the catalog lastReviewed", async () => {
    for (const demo of demos) {
      const pageMeta = await generateDemoMetadata({
        params: Promise.resolve({ slug: demo.slug }),
      });
      const og = pageMeta.openGraph as ArticleOpenGraph | undefined;
      expect(og?.type, `${demo.slug}: og type`).toBe("article");
      expect(demo.lastReviewed, `${demo.slug}: catalog lastReviewed missing`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(og?.modifiedTime, `${demo.slug}: modifiedTime`).toBe(demo.lastReviewed);
    }
  });
});
