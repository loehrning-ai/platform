import { describe, expect, it } from "vitest";
import { DEF_CHAPTER_IDS } from "@/lib/data-engineering-fundamentals/types";
import { generateMetadata, generateStaticParams, dynamicParams } from "./page";

describe("data-engineering-fundamentals chapter route ", () => {
  it("generates exactly the 12 real chapter ids as static params, in source order", () => {
    expect(generateStaticParams()).toEqual(
      DEF_CHAPTER_IDS.map((chapterId) => ({ chapterId })),
    );
    expect(generateStaticParams()).toHaveLength(12);
  });

  it("disables dynamicParams so an unknown chapterId 404s instead of rendering", () => {
    expect(dynamicParams).toBe(false);
  });

  it("returns a not-found metadata title for an unknown chapterId", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ chapterId: "does-not-exist" }),
    });
    expect(metadata.title).toBe("Chapter not found");
  });

  it("generates real per-chapter metadata with a noindex/follow robots policy and a local canonical", async () => {
    for (const chapterId of DEF_CHAPTER_IDS) {
      const metadata = await generateMetadata({ params: Promise.resolve({ chapterId }) });
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe(
        `https://loehrning.ai/kurse/open-source/data-engineering-fundamentals/${chapterId}`,
      );
      expect(typeof metadata.title).toBe("string");
      expect(metadata.title).not.toBe("Chapter not found");
    }
  });
});
