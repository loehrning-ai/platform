import { describe, it, expect } from "vitest";
import { DEF_CHAPTER_IDS, type DefChapterId } from "./types";
import {
  getDefChapterComponent,
  getAllDefChapterComponents,
  getDefLocaleRegistry,
  __resetDefChapterCacheForTests,
} from "./content";

describe("data-engineering-fundamentals content loader map ", () => {
  it.each(["de", "en"] as const)(
    "resolves a real %s component for every one of the 12 chapter ids",
    async (locale) => {
      __resetDefChapterCacheForTests();
      for (const id of DEF_CHAPTER_IDS) {
        const Component = await getDefChapterComponent(id, locale);
        expect(Component).toBeDefined();
        expect(typeof Component).toBe("function");
      }
    },
  );

  it("memoizes: a second lookup for the same id returns the same component reference", async () => {
    __resetDefChapterCacheForTests();
    const first = await getDefChapterComponent("fund", "de");
    const second = await getDefChapterComponent("fund", "de");
    expect(first).toBe(second);
  });

  it("returns undefined for an id outside the known set instead of throwing", async () => {
    expect(
      await getDefChapterComponent("does-not-exist" as DefChapterId, "en"),
    ).toBeUndefined();
  });

  it.each(["de", "en"] as const)(
    "getAllDefChapterComponents resolves all 12 %s chapters keyed by id",
    async (locale) => {
      __resetDefChapterCacheForTests();
      const all = await getAllDefChapterComponents(locale);
      expect(all.size).toBe(12);
      for (const id of DEF_CHAPTER_IDS) {
        expect(all.has(id)).toBe(true);
      }
    },
  );

  it("registers complete German and English bundles with identical machine identity", async () => {
    __resetDefChapterCacheForTests();
    const registry = await getDefLocaleRegistry();
    expect(registry.availableLocales).toEqual(["de", "en"]);
    const de = registry.get("de");
    const en = registry.get("en");
    expect(de.content.chapters.map((chapter) => chapter.id)).toEqual(
      DEF_CHAPTER_IDS,
    );
    expect(en.content.chapters.map((chapter) => chapter.id)).toEqual(
      DEF_CHAPTER_IDS,
    );
    expect(de.identity).toEqual(en.identity);
    expect(
      Object.values(de.identity.sectionIdsByProgressKey).flat(),
    ).toHaveLength(36);
    expect(de.identity.workshopQuestions).toEqual([]);
    expect(de.identity.checkpointKeys).toEqual([]);
  });
});
