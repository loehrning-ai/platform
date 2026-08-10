import { afterEach, describe, expect, it } from "vitest";
import {
  __resetDsLocaleRegistryForTests,
  getDsLocaleRegistry,
} from "./content";
import { DS_CHAPTER_IDS, DS_NUMBERED_CHAPTER_IDS } from "./types";

afterEach(() => {
  __resetDsLocaleRegistryForTests();
});

describe("Data Science locale registry", () => {
  it("registers complete explicit German and English bundles", async () => {
    const registry = await getDsLocaleRegistry();
    expect(registry.courseSlug).toBe("data-science");
    expect(registry.sourceLocale).toBe("en");
    expect(registry.availableLocales).toEqual(["de", "en"]);

    for (const locale of registry.availableLocales) {
      const bundle = registry.get(locale);
      expect(bundle.locale).toBe(locale);
      expect(bundle.config.language).toBe(locale);
      expect(bundle.content.chapters.map((chapter) => chapter.id)).toEqual(
        DS_CHAPTER_IDS,
      );
      expect(bundle.identity.contentItemIds).toEqual(DS_CHAPTER_IDS);
      expect(bundle.identity.progressKeys).toEqual(DS_NUMBERED_CHAPTER_IDS);
      expect(Object.keys(bundle.identity.sectionIdsByProgressKey)).toEqual(
        DS_NUMBERED_CHAPTER_IDS,
      );
      expect(bundle.identity.workshopQuestions).toEqual([]);
      expect(bundle.identity.checkpointKeys).toEqual([]);
    }
  });

  it("keeps locale-specific components and visible metadata separate", async () => {
    const registry = await getDsLocaleRegistry();
    const english = registry.get("en");
    const german = registry.get("de");

    for (const [index, source] of english.content.chapters.entries()) {
      const translated = german.content.chapters[index];
      expect(translated?.id).toBe(source.id);
      expect(translated?.component).not.toBe(source.component);
      expect(translated?.meta.title).not.toBe(source.meta.title);
      expect(translated?.sectionIds).toEqual(source.sectionIds);
      expect(translated?.simulatorIds).toEqual(source.simulatorIds);
    }
  });
});
