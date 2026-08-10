import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import { DATA_SCIENCE_CONFIG, DATA_SCIENCE_CONFIG_DE } from "./config";
import type { DsChapterBodyProps } from "./chapters";
import {
  DS_TRANSLATED_CORE_IDENTITY,
  __resetDsTranslatedCoreChapterCacheForTests,
  getDsTranslatedCoreChapterComponent,
  getDsTranslatedCoreChapterMeta,
} from "./localized-core-content";
import {
  DS_CHAPTER_IDS,
  DS_NUMBERED_CHAPTER_IDS,
  type ChapterMeta,
  type DsChapterId,
} from "./types";

export type DsChapterComponent = ComponentType<DsChapterBodyProps>;

export interface DsLocalizedChapter {
  readonly id: DsChapterId;
  readonly meta: ChapterMeta;
  readonly component: DsChapterComponent;
  readonly sectionIds: readonly string[];
  readonly simulatorIds: readonly string[];
}

export interface DsLocaleContent {
  readonly chapters: readonly DsLocalizedChapter[];
}

export type DsLocaleBundle<L extends Locale = Locale> =
  TechnicalCourseLocaleBundle<"data-science", L, DsLocaleContent>;

export async function getAllDsLocalizedChapters(
  locale: Locale,
): Promise<readonly DsLocalizedChapter[]> {
  return Promise.all(
    DS_CHAPTER_IDS.map(async (id) => {
      const component = await getDsTranslatedCoreChapterComponent(id, locale);
      if (!component) {
        throw new Error(
          `Data Science is missing reviewed ${locale} chapter "${id}".`,
        );
      }
      return Object.freeze({
        id,
        meta: getDsTranslatedCoreChapterMeta(id, locale),
        component,
        sectionIds: DS_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter[id],
        simulatorIds: DS_TRANSLATED_CORE_IDENTITY.simulatorIdsByChapter[id],
      });
    }),
  );
}

export function extractDsContentIdentity(
  chapters: readonly DsLocalizedChapter[],
) {
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ordered = DS_CHAPTER_IDS.map((id) => {
    const chapter = chapterById.get(id);
    if (!chapter) {
      throw new Error(`Data Science locale bundle is missing chapter "${id}".`);
    }
    return chapter;
  });

  return defineTechnicalCourseContentIdentity("data-science", {
    unitIds: [],
    contentItemIds: ordered.map((chapter) => chapter.id),
    progressKeys: [...DS_NUMBERED_CHAPTER_IDS],
    sectionIdsByProgressKey: Object.fromEntries(
      DS_NUMBERED_CHAPTER_IDS.map((id) => [
        id,
        chapterById.get(id)?.sectionIds ?? [],
      ]),
    ),
    workshopQuestions: [],
    checkpointKeys: [],
  });
}

let registryPromise: Promise<
  TechnicalCourseLocaleRegistry<"data-science", DsLocaleContent>
> | null = null;

export function getDsLocaleRegistry(): Promise<
  TechnicalCourseLocaleRegistry<"data-science", DsLocaleContent>
> {
  registryPromise ??= Promise.all([
    getAllDsLocalizedChapters("en"),
    getAllDsLocalizedChapters("de"),
  ]).then(([enChapters, deChapters]) => {
    const enBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-science",
      locale: "en",
      config: DATA_SCIENCE_CONFIG,
      identity: extractDsContentIdentity(enChapters),
      content: { chapters: enChapters },
    });
    const deBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-science",
      locale: "de",
      config: DATA_SCIENCE_CONFIG_DE,
      identity: extractDsContentIdentity(deChapters),
      content: { chapters: deChapters },
    });
    return createTechnicalCourseLocaleRegistry({
      courseSlug: "data-science",
      sourceLocale: "en",
      bundles: { en: enBundle, de: deBundle },
    });
  });
  return registryPromise;
}

export async function getDsLocaleBundle<L extends Locale>(
  locale: L,
): Promise<DsLocaleBundle<L>> {
  return (await getDsLocaleRegistry()).get(locale);
}

export function __resetDsLocaleRegistryForTests(): void {
  __resetDsTranslatedCoreChapterCacheForTests();
  registryPromise = null;
}
