import { describe, expect, it } from "vitest";
import { DS_NUMBERED_CHAPTER_IDS } from "@/lib/data-science/types";
import { generateMetadata, generateStaticParams, dynamicParams } from "./page";

describe("data-science chapter route ", () => {
  it("generates exactly the 12 numbered chapter ids as static params, in source order — 'home' is not among them", () => {
    expect(generateStaticParams()).toEqual(
      DS_NUMBERED_CHAPTER_IDS.map((chapterSlug) => ({ chapterSlug })),
    );
    expect(generateStaticParams()).toHaveLength(12);
    expect(generateStaticParams().map((p) => p.chapterSlug)).not.toContain("home");
  });

  it("disables dynamicParams so an unknown chapterSlug 404s instead of rendering", () => {
    expect(dynamicParams).toBe(false);
  });

  it("returns a not-found metadata title for an unknown chapterSlug", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ chapterSlug: "does-not-exist" }),
    });
    expect(metadata.title).toBe("Chapter not found");
  });

  it("returns a not-found metadata title for 'home' (it lives at the course root, not here)", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ chapterSlug: "home" }),
    });
    expect(metadata.title).toBe("Chapter not found");
  });

  it("generates real per-chapter metadata with a noindex/follow robots policy and a local canonical", async () => {
    for (const chapterSlug of DS_NUMBERED_CHAPTER_IDS) {
      const metadata = await generateMetadata({ params: Promise.resolve({ chapterSlug }) });
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe(
        `https://loehrning.ai/kurse/open-source/data-science/${chapterSlug}`,
      );
      expect(typeof metadata.title).toBe("string");
      expect(metadata.title).not.toBe("Chapter not found");
    }
  });
});
